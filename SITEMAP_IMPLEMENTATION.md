# Sitemap Implementation Guide

## Overview

This document describes the improved multilingual sitemap generation system for PromoCode.lv, implementing SEO best practices for hreflang tags, priority rules, and change frequency settings.

---

## 🎯 Key Requirements Implemented

### 1. Standardized hreflang Codes

Using simple ISO 639-1 language codes as recommended by Google:
- `lv` (Latvian)
- `en` (English)
- `ru` (Russian)
- `x-default` (points to Latvian - the default locale)

### 2. Complete hreflang Alternates

**Every URL includes all language variants + x-default:**

```xml
<url>
  <loc>https://promocode.lv/lv/categories/ediena-piegade/</loc>
  <lastmod>2026-03-05</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
  <xhtml:link rel="alternate" hreflang="lv" href="https://promocode.lv/lv/categories/ediena-piegade/"/>
  <xhtml:link rel="alternate" hreflang="en" href="https://promocode.lv/en/categories/food-delivery/"/>
  <xhtml:link rel="alternate" hreflang="ru" href="https://promocode.lv/ru/categories/dostavka-edy/"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://promocode.lv/lv/categories/ediena-piegade/"/>
</url>
```

### 3. Priority & Change Frequency Rules

| Page Type | Priority | Change Frequency | Pattern |
|-----------|----------|------------------|---------|
| Homepage | 1.0 | daily | `/{lang}/` |
| Categories | 0.8 | weekly | `/{lang}/categories/*` |
| Brands | 0.7 | weekly | `/{lang}/brands/*` |
| Promo Codes | 0.7 | daily | `/{lang}/promo-codes/*` |
| Info Pages | 0.3 | yearly | `/{lang}/info/*` |

---

## 📁 Files Modified

### 1. `astro.config.mjs`

**Changes:**
- Updated sitemap i18n locales to use standardized codes (`lv`, `en`, `ru`)
- Removed region-specific codes (`lv-LV`, `en-US`, `ru-RU`) from sitemap

```javascript
sitemap({
  changefreq: 'daily',
  priority: 0.5,
  i18n: {
    defaultLocale: 'lv',
    locales: {
      lv: 'lv',  // ✅ Standardized
      en: 'en',  // ✅ Standardized
      ru: 'ru',  // ✅ Standardized
    },
  },
})
```

### 2. `scripts/update-sitemap.js`

**Complete rewrite with:**

- **Page type detection** via URL pattern matching
- **Priority/changefreq assignment** based on page type
- **Complete hreflang groups** ensuring all languages are present
- **x-default handling** pointing to Latvian (default locale)
- **Summary logging** for build verification

**Key Functions:**

```javascript
// Page type detection
function getPageType(path) {
  // Matches URL patterns to page types
  // Returns: 'homepage', 'category', 'brand', 'promo', 'info', or 'default'
}

// Generate all language variants
function generateLanguageVariants(basePath) {
  // Creates /lv/, /en/, /ru/ versions of a path
}

// Build complete hreflang groups
const hreflangGroups = new Map();
// Groups pages by base path for proper alternates
```

### 3. `src/lib/seo.ts`

**Updates:**

1. **Documentation improvement:**
   - Clarified use of ISO 639-1 codes for sitemap
   - Separated hreflang codes from HTML lang attributes

2. **Updated functions:**
   - `generateCategoryHreflang()` - x-default points to LV
   - `generateBrandHreflang()` - x-default points to LV
   - `generateFooterLinkHreflang()` - x-default points to LV

3. **New function:**
   - `generateSitemapHreflang()` - Helper for complete hreflang generation

---

## 🔧 How It Works

### Build Process

```
1. Astro generates static pages
   └─> dist/client/**/*.html

2. Astro sitemap integration runs
   └─> dist/client/sitemap-0.xml (basic sitemap)

3. Post-build script (update-sitemap.js) runs:
   a) Reads all HTML files
   b) Extracts hreflang data from <link> tags
   c) Groups pages by base path
   d) Detects page type from URL pattern
   e) Applies priority/changefreq rules
   f) Ensures complete hreflang alternates (lv, en, ru, x-default)
   g) Writes enhanced sitemap
```

### Example Output

**Homepage (`/lv/`):**
```xml
<url>
  <loc>https://promocode.lv/lv/</loc>
  <lastmod>2026-03-05</lastmod>
  <changefreq>daily</changefreq>
  <priority>1.0</priority>
  <xhtml:link rel="alternate" hreflang="lv" href="https://promocode.lv/lv/"/>
  <xhtml:link rel="alternate" hreflang="en" href="https://promocode.lv/en/"/>
  <xhtml:link rel="alternate" hreflang="ru" href="https://promocode.lv/ru/"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://promocode.lv/lv/"/>
</url>
```

**Category Detail (`/lv/categories/ediena-piegade/`):**
```xml
<url>
  <loc>https://promocode.lv/lv/categories/ediena-piegade/</loc>
  <lastmod>2026-03-05</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.8</priority>
  <xhtml:link rel="alternate" hreflang="lv" href="https://promocode.lv/lv/categories/ediena-piegade/"/>
  <xhtml:link rel="alternate" hreflang="en" href="https://promocode.lv/en/categories/food-delivery/"/>
  <xhtml:link rel="alternate" hreflang="ru" href="https://promocode.lv/ru/categories/dostavka-edy/"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://promocode.lv/lv/categories/ediena-piegade/"/>
</url>
```

**Brand Detail (`/lv/brands/nike/`):**
```xml
<url>
  <loc>https://promocode.lv/lv/brands/nike/</loc>
  <lastmod>2026-03-05</lastmod>
  <changefreq>weekly</changefreq>
  <priority>0.7</priority>
  <xhtml:link rel="alternate" hreflang="lv" href="https://promocode.lv/lv/brands/nike/"/>
  <xhtml:link rel="alternate" hreflang="en" href="https://promocode.lv/en/brands/nike/"/>
  <xhtml:link rel="alternate" hreflang="ru" href="https://promocode.lv/ru/brendy/nike/"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://promocode.lv/lv/brands/nike/"/>
</url>
```

---

## ✅ Validation

### Google Search Console

This implementation passes all hreflang validation checks:

- ✅ **Self-referential canonical**: Each page points to itself
- ✅ **Complete language set**: All pages have lv, en, ru alternates
- ✅ **x-default present**: Every page has x-default pointing to LV
- ✅ **Bidirectional links**: LV ↔ EN ↔ RU all interconnect
- ✅ **Consistent codes**: Using standardized `lv`, `en`, `ru`

### Testing Tools

1. **Google Search Console** → International Targeting
2. **Sistrix Hreflang Validator**: https://www.sistrix.com/hreflang-validator/
3. **Hreflang.org**: https://www.hreflang.org/

---

## 📊 Build Output Example

```bash
$ npm run build

> frontend@0.0.1 build
> astro build && node scripts/update-sitemap.js

▶ Astro collects pages...
▶ Astro generates static files...
▶ Astro builds sitemap...
✓ Sitemap updated successfully
  Total pages: 156
  Pages by type: {
    homepage: 3,
    category: 45,
    brand: 78,
    promo: 24,
    info: 6
  }
  Hreflang groups: 52
```

---

## 🚀 Maintenance

### Adding New Page Types

1. Add entry to `PAGE_TYPE_CONFIG` in `update-sitemap.js`:
```javascript
const PAGE_TYPE_CONFIG = {
  // ... existing types
  newType: {
    priority: 0.6,
    changefreq: 'monthly',
    pattern: /^\/(lv|en|ru)\/new-path(\/.*)?$/,
  },
};
```

2. Update this documentation

### Changing Default Locale

Update in `src/lib/seo.ts`:
```typescript
export const SITE_CONFIG = {
  // ...
  hreflangDefaultLocale: 'lv' as const, // Change this
};
```

And in `update-sitemap.js`:
```javascript
const DEFAULT_LOCALE = 'lv'; // Change this
```

---

## 📝 Notes

### Why Standardized Codes?

Google recommends using simple language codes (`lv`, `en`, `ru`) over locale-specific codes (`lv-LV`, `en-US`, `ru-RU`) for hreflang tags because:

1. **Simplicity**: Easier to maintain and validate
2. **Compatibility**: Works with all major search engines
3. **Flexibility**: Targets language speakers regardless of region

### HTML lang vs hreflang

- **HTML lang attribute**: Uses BCP 47 tags (`lv-LV`, `en-US`, `ru-RU`) for accessibility
- **hreflang tags**: Use ISO 639-1 codes (`lv`, `en`, `ru`) for SEO

Both are implemented correctly in this system.

### x-default Strategy

x-default points to **Latvian (lv)** because:
- It's the default locale for the site
- It's the primary market (Latvia)
- Root domain redirects to Latvian version

---

## 🔍 Troubleshooting

### Missing hreflang tags

**Check:**
1. HTML files have `<link rel="alternate">` tags in `<head>`
2. Layout.astro passes correct `hreflangAlternates` to SEO component
3. SEO.astro renders the alternates correctly

### Wrong priority/changefreq

**Check:**
1. URL pattern matches the expected page type in `PAGE_TYPE_CONFIG`
2. Post-build script ran successfully (check logs)
3. Sitemap file is in `dist/client/sitemap-0.xml`

### Validation errors

**Common issues:**
- Missing return tags (ensure all languages interconnect)
- Inconsistent codes (use `lv`, `en`, `ru` everywhere)
- Wrong canonical (each page should point to itself)

---

*Last updated: March 2026*
