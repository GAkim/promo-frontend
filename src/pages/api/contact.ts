/**
 * Contact form API endpoint
 * Handles spam protection and forwards valid messages to Strapi
 *
 * Security layers:
 * 1. Honeypot field check
 * 2. reCAPTCHA v2 verification (skipped in dev)
 * 3. IP-based rate limiting (5 requests/hour)
 * 4. Email-based rate limiting (3 requests/hour)
 * 5. Input validation and sanitization
 */

import type { APIRoute } from "astro";
import { verifyRecaptcha, isRecaptchaValid } from "../../lib/recaptcha";
import {
  checkIpRateLimit,
  checkEmailRateLimit,
  getResetTimeSeconds,
} from "../../lib/rate-limiter";

// This route must be server-side only (not prerendered)
export const prerender = false;

// STRAPI_URL can be set as either STRAPI_URL (private) or PUBLIC_STRAPI_URL (public)
// Railway typically uses private env vars, so STRAPI_URL takes precedence
const STRAPI_URL = import.meta.env.STRAPI_URL || import.meta.env.PUBLIC_STRAPI_URL || "http://localhost:1337";
const STRAPI_API_TOKEN = import.meta.env.STRAPI_API_TOKEN;
const RECAPTCHA_SECRET_KEY = import.meta.env.RECAPTCHA_SECRET_KEY;
const IS_DEV = import.meta.env.DEV || process.env.NODE_ENV === 'development';

// Determine if reCAPTCHA should be enforced
// Always enforce in production, enforce in dev only if keys are properly configured
const REQUIRE_CAPTCHA = !IS_DEV || (RECAPTCHA_SECRET_KEY && RECAPTCHA_SECRET_KEY !== 'your_secret_key_here');

// Log environment info (only once at startup)
console.log("[Contact API] Environment:", {
  IS_DEV,
  DEV: import.meta.env.DEV,
  NODE_ENV: process.env.NODE_ENV,
  REQUIRE_CAPTCHA,
  HAS_RECAPTCHA_SECRET: !!RECAPTCHA_SECRET_KEY,
});

// Validate environment variables at startup
if (!STRAPI_API_TOKEN) {
  console.warn(
    "STRAPI_API_TOKEN is not set. Contact form submissions will fail.",
  );
}
if (!RECAPTCHA_SECRET_KEY && !IS_DEV) {
  console.warn(
    "RECAPTCHA_SECRET_KEY is not set. reCAPTCHA verification will fail in production.",
  );
}

export const POST: APIRoute = async ({ request, clientAddress }) => {
  // Get IP address with fallbacks
  let ip = "unknown";
  try {
    ip =
      clientAddress ||
      request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
      "unknown";
  } catch {
    ip = "unknown";
  }

  // Check required config
  if (!STRAPI_API_TOKEN) {
    console.error("[Contact API] STRAPI_API_TOKEN is not configured");
    return new Response(
      JSON.stringify({ error: "Server configuration error" }),
      { status: 500, headers: { "Content-Type": "application/json" } },
    );
  }

  try {
    const body = await request.json();

    // ========== LAYER 1: Honeypot Check ==========
    // Bots fill hidden fields, humans don't see them
    if (body.website_url || body.website) {
      console.warn(`[Spam] Honeypot triggered from IP: ${ip}`);
      return new Response(JSON.stringify({ error: "Submission rejected" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // ========== LAYER 2: reCAPTCHA Verification ==========
    if (REQUIRE_CAPTCHA) {
      if (!body.recaptchaToken || typeof body.recaptchaToken !== 'string' || body.recaptchaToken.trim() === '') {
        console.warn(`[Spam] Missing reCAPTCHA token from IP: ${ip}`);
        return new Response(
          JSON.stringify({ error: "reCAPTCHA verification required" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }

      const recaptchaResult = await verifyRecaptcha(
        body.recaptchaToken,
        RECAPTCHA_SECRET_KEY,
        ip,
      );

      if (!isRecaptchaValid(recaptchaResult)) {
        console.warn(
          `[Spam] reCAPTCHA failed from IP: ${ip}`,
          recaptchaResult.errorCodes,
        );
        return new Response(
          JSON.stringify({ error: "reCAPTCHA verification failed" }),
          { status: 400, headers: { "Content-Type": "application/json" } },
        );
      }
    } else {
      console.log("[Dev Mode] reCAPTCHA not configured - skipping validation. Set RECAPTCHA_SECRET_KEY in .env to enable.");
    }

    // ========== LAYER 3: Rate Limiting (IP) ==========
    const ipRateLimit = checkIpRateLimit(ip);
    if (!ipRateLimit.allowed) {
      const resetSeconds = getResetTimeSeconds(ipRateLimit.resetAt);
      console.warn(
        `[Rate Limit] IP ${ip} exceeded limit. Reset in ${resetSeconds}s`,
      );
      return new Response(
        JSON.stringify({
          error: "Too many requests",
          retryAfter: resetSeconds,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": resetSeconds.toString(),
          },
        },
      );
    }

    // ========== LAYER 4: Rate Limiting (Email) ==========
    const email = body.email?.toLowerCase().trim();
    if (!email) {
      return new Response(JSON.stringify({ error: "Email is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const emailRateLimit = checkEmailRateLimit(email);
    if (!emailRateLimit.allowed) {
      const resetSeconds = getResetTimeSeconds(emailRateLimit.resetAt);
      console.warn(
        `[Rate Limit] Email ${email} exceeded limit. Reset in ${resetSeconds}s`,
      );
      return new Response(
        JSON.stringify({
          error: "Too many submissions from this email",
          retryAfter: resetSeconds,
        }),
        {
          status: 429,
          headers: {
            "Content-Type": "application/json",
            "Retry-After": resetSeconds.toString(),
          },
        },
      );
    }

    // ========== LAYER 5: Input Validation ==========
    const { name, subject, message } = body;

    // Validate required fields
    if (!name || !subject || !message) {
      return new Response(
        JSON.stringify({ error: "All fields are required" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Validate lengths
    if (name.length > 100) {
      return new Response(
        JSON.stringify({ error: "Name is too long (max 100 characters)" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (subject.length > 200) {
      return new Response(
        JSON.stringify({ error: "Subject is too long (max 200 characters)" }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    if (message.length > 2000 || message.length < 10) {
      return new Response(
        JSON.stringify({
          error: "Message must be between 10 and 2000 characters",
        }),
        { status: 400, headers: { "Content-Type": "application/json" } },
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return new Response(JSON.stringify({ error: "Invalid email format" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // Sanitize inputs (basic HTML entity encoding)
    const sanitizeInput = (input: string): string => {
      return input
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/"/g, "&quot;")
        .replace(/'/g, "&#039;");
    };

    const sanitizedData = {
      name: sanitizeInput(name.trim()),
      email: email.trim(),
      subject: sanitizeInput(subject.trim()),
      message: sanitizeInput(message.trim()),
      "msg-status": "pending",
    };

    console.log("[Contact API] Sending to Strapi:", JSON.stringify({ data: sanitizedData }, null, 2));

    // ========== Forward to Strapi ==========
    const strapiResponse = await fetch(`${STRAPI_URL}/api/contactmsgs`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${STRAPI_API_TOKEN}`,
      },
      body: JSON.stringify({
        data: sanitizedData,
      }),
    });

    if (!strapiResponse.ok) {
      const errorData = await strapiResponse.json().catch(() => ({}));
      console.error("[Strapi Error]", strapiResponse.status, JSON.stringify(errorData, null, 2));
      return new Response(
        JSON.stringify({ error: "Failed to submit message", details: errorData }),
        { status: 500, headers: { "Content-Type": "application/json" } },
      );
    }

    const result = await strapiResponse.json();

    console.log(`[Success] Message from ${email} submitted successfully`);

    return new Response(
      JSON.stringify({
        success: true,
        message: "Your message has been sent successfully",
        data: result.data,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
  } catch (error) {
    const errorMessage =
      error instanceof Error ? error.message : "Unknown error";
    console.error("[Contact API Error]", errorMessage);
    return new Response(JSON.stringify({ error: "Internal server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
