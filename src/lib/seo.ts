// SEO utilities for multilingual support
import type { LocaleSlugs } from '../types/strapi';

// Site configuration
export const SITE_CONFIG = {
  name: 'PromoCode.lv',
  url: 'https://promocode.lv',
  defaultLocale: 'lv' as const,
  locales: ['lv', 'en', 'ru'] as const,
  hreflangDefaultLocale: 'lv' as const, // x-default points to Latvian (default locale)
};

export type Locale = (typeof SITE_CONFIG.locales)[number];

/**
 * Locale to hreflang code mapping
 * Google expects standard hreflang codes
 */
const HREFLANG_MAP: Record<Locale, string> = {
  lv: 'lv',
  en: 'en',
  ru: 'ru',
};

/**
 * Locale to HTML lang attribute mapping
 * Uses BCP 47 language tags for proper HTML lang
 */
const HTML_LANG_MAP: Record<Locale, string> = {
  lv: 'lv-LV',
  en: 'en-US',
  ru: 'ru-RU',
};

/**
 * Get hreflang code for a locale (for link alternates)
 */
export function getHreflang(locale: Locale): string {
  return HREFLANG_MAP[locale];
}

/**
 * Get HTML lang attribute for a locale
 */
export function getHtmlLang(locale: Locale): string {
  return HTML_LANG_MAP[locale];
}

/**
 * Get og:locale code for a locale (uses underscore format)
 */
export function getOgLocale(locale: Locale): string {
  return HTML_LANG_MAP[locale].replace('-', '_');
}

/**
 * Build absolute URL from path
 */
export function buildAbsoluteUrl(path: string): string {
  const cleanPath = path.startsWith('/') ? path : `/${path}`;
  return `${SITE_CONFIG.url}${cleanPath}`;
}

/**
 * Generate hreflang alternate URLs for a page
 *
 * @param basePath - URL path without locale (e.g., '/categories/food-delivery')
 * @param localeSlugs - Mapping of locales to their slugs
 * @returns Array of hreflang alternate objects
 */
export function generateHreflangAlternates(
  basePath: string,
  localeSlugs: LocaleSlugs
): Array<{ hreflang: string; href: string }> {
  const alternates: Array<{ hreflang: string; href: string }> = [];

  // Add all language versions
  for (const locale of SITE_CONFIG.locales) {
    const slug = localeSlugs[locale];
    if (slug) {
      const path = `/${locale}${basePath.replace(/\/(lv|en|ru)\//, '/')}`;
      // Reconstruct path with correct slug for each locale
      const pathParts = basePath.split('/').filter(Boolean);
      // Remove locale prefix from base path
      const pathWithoutLocale = pathParts.slice(1).join('/');
      const fullPath = `/${locale}/${pathWithoutLocale}`;
      alternates.push({
        hreflang: getHreflang(locale),
        href: buildAbsoluteUrl(fullPath),
      });
    }
  }

  // Add x-default (points to English for international users)
  const defaultSlug = localeSlugs[SITE_CONFIG.hreflangDefaultLocale];
  if (defaultSlug) {
    const pathParts = basePath.split('/').filter(Boolean);
    const pathWithoutLocale = pathParts.slice(1).join('/');
    const defaultPath = `/${SITE_CONFIG.hreflangDefaultLocale}/${pathWithoutLocale}`;
    alternates.push({
      hreflang: 'x-default',
      href: buildAbsoluteUrl(defaultPath),
    });
  }

  return alternates;
}

/**
 * Generate hreflang alternates for category pages
 *
 * @param localeSlugs - Mapping of locales to category slugs
 * @returns Array of hreflang alternate objects
 */
export function generateCategoryHreflang(localeSlugs: LocaleSlugs): Array<{ hreflang: string; href: string }> {
  const alternates: Array<{ hreflang: string; href: string }> = [];

  for (const locale of SITE_CONFIG.locales) {
    const slug = localeSlugs[locale];
    if (slug) {
      alternates.push({
        hreflang: getHreflang(locale),
        href: buildAbsoluteUrl(`/${locale}/categories/${slug}/`),
      });
    }
  }

  // x-default points to English for international users
  const defaultSlug = localeSlugs[SITE_CONFIG.hreflangDefaultLocale];
  if (defaultSlug) {
    alternates.push({
      hreflang: 'x-default',
      href: buildAbsoluteUrl(`/${SITE_CONFIG.hreflangDefaultLocale}/categories/${defaultSlug}/`),
    });
  }

  return alternates;
}

/**
 * Generate hreflang alternates for brand pages
 *
 * @param localeSlugs - Mapping of locales to brand slugs
 * @returns Array of hreflang alternate objects
 */
export function generateBrandHreflang(localeSlugs: LocaleSlugs): Array<{ hreflang: string; href: string }> {
  const alternates: Array<{ hreflang: string; href: string }> = [];

  for (const locale of SITE_CONFIG.locales) {
    const slug = localeSlugs[locale];
    if (slug) {
      alternates.push({
        hreflang: getHreflang(locale),
        href: buildAbsoluteUrl(`/${locale}/brands/${slug}/`),
      });
    }
  }

  // x-default points to English for international users
  const defaultSlug = localeSlugs[SITE_CONFIG.hreflangDefaultLocale];
  if (defaultSlug) {
    alternates.push({
      hreflang: 'x-default',
      href: buildAbsoluteUrl(`/${SITE_CONFIG.hreflangDefaultLocale}/brands/${defaultSlug}/`),
    });
  }

  return alternates;
}

/**
 * Generate hreflang alternates for footer link pages
 *
 * @param localeSlugs - Mapping of locales to footer link slugs
 * @returns Array of hreflang alternate objects
 */
export function generateFooterLinkHreflang(localeSlugs: LocaleSlugs): Array<{ hreflang: string; href: string }> {
  const alternates: Array<{ hreflang: string; href: string }> = [];

  for (const locale of SITE_CONFIG.locales) {
    const slug = localeSlugs[locale];
    if (slug) {
      alternates.push({
        hreflang: getHreflang(locale),
        href: buildAbsoluteUrl(`/${locale}/info/${slug}/`),
      });
    }
  }

  // x-default points to English for international users
  const defaultSlug = localeSlugs[SITE_CONFIG.hreflangDefaultLocale];
  if (defaultSlug) {
    alternates.push({
      hreflang: 'x-default',
      href: buildAbsoluteUrl(`/${SITE_CONFIG.hreflangDefaultLocale}/info/${defaultSlug}/`),
    });
  }

  return alternates;
}

/**
 * Generate canonical URL for current page
 * Always points to current language version
 * Ensures trailing slash consistency
 *
 * @param currentPath - Current URL path (e.g., '/lv/categories/ediena-piegade')
 * @returns Absolute canonical URL with trailing slash
 */
export function generateCanonicalUrl(currentPath: string): string {
  // Ensure path ends with trailing slash (except for root)
  let normalizedPath = currentPath;
  if (!normalizedPath.endsWith('/') && normalizedPath !== '/') {
    normalizedPath += '/';
  }
  return buildAbsoluteUrl(normalizedPath);
}

/**
 * Get localized path for language switcher
 *
 * @param targetLocale - Target locale code
 * @param localeSlugs - Mapping of locales to slugs
 * @param contentType - Type of content ('categories' | 'brands')
 * @param currentPath - Current path as fallback
 * @returns Localized path
 */
export function getLocalizedPath(
  targetLocale: Locale,
  localeSlugs: LocaleSlugs,
  contentType: 'categories' | 'brands',
  currentPath: string
): string {
  const slug = localeSlugs[targetLocale];

  if (slug) {
    return `/${targetLocale}/${contentType}/${slug}`;
  }

  // Fallback: replace locale in current path
  return currentPath.replace(/^\/(lv|en|ru)(\/|$)/, `/${targetLocale}$2`);
}

/**
 * Strip Markdown syntax from text for use in meta tags
 *
 * @param text - Text that may contain Markdown
 * @returns Plain text without Markdown formatting
 */
export function stripMarkdown(text: string | null | undefined): string {
  if (!text) return '';

  return text
    // Remove headers (#, ##, ###, etc.)
    .replace(/^#+\s+/gm, '')
    // Remove bold/italic (**, __, *, _)
    .replace(/\*\*([^*]+)\*\*/g, '$1')
    .replace(/__([^_]+)__/g, '$1')
    .replace(/\*([^*]+)\*/g, '$1')
    .replace(/_([^_]+)_/g, '$1')
    // Remove links [text](url)
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
    // Remove images ![alt](url)
    .replace(/!\[([^\]]*)\]\([^)]+\)/g, '$1')
    // Remove list items (-, *)
    .replace(/^[\-\*]\s+/gm, '')
    // Remove blockquotes (>)
    .replace(/^>\s+/gm, '')
    // Remove code blocks (```)
    .replace(/```[\s\S]*?```/g, '')
    // Remove inline code (`)
    .replace(/`([^`]+)`/g, '$1')
    // Remove horizontal rules (---, ***, ___)
    .replace(/^[\-\*_]{3,}$/gm, '')
    // Normalize whitespace
    .replace(/\n+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}
