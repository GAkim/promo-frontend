/**
 * Google reCAPTCHA v2 verification utility
 * Server-side only - never expose the secret key to the browser
 */

export interface RecaptchaVerificationResult {
  success: boolean;
  score?: number;
  errorCodes?: string[];
  challengeTs?: string;
  hostname?: string;
}

const RECAPTCHA_VERIFY_URL = 'https://www.google.com/recaptcha/api/siteverify';

/**
 * Verify a reCAPTCHA token with Google
 * @param token - The reCAPTCHA response token from the frontend
 * @param secretKey - The reCAPTCHA secret key (server-side only)
 * @param remoteIp - Optional IP address of the user
 */
export async function verifyRecaptcha(
  token: string,
  secretKey: string,
  remoteIp?: string
): Promise<RecaptchaVerificationResult> {
  try {
    const params = new URLSearchParams({
      secret: secretKey,
      response: token,
      ...(remoteIp && { remoteip: remoteIp }),
    });

    const response = await fetch(RECAPTCHA_VERIFY_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: params,
    });

    const result = await response.json();

    return {
      success: result.success,
      score: result.score,
      errorCodes: result['error-codes'],
      challengeTs: result.challenge_ts,
      hostname: result.hostname,
    };
  } catch (error) {
    console.error('reCAPTCHA verification failed:', error);
    return {
      success: false,
      errorCodes: ['verification_error'],
    };
  }
}

/**
 * Check if reCAPTCHA verification passed
 */
export function isRecaptchaValid(result: RecaptchaVerificationResult): boolean {
  // Must be successful and not have error codes
  return result.success === true && (!result.errorCodes || result.errorCodes.length === 0);
}
