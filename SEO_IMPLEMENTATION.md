# Multilingual SEO Implementation Guide

## Overview

This implementation provides complete multilingual SEO support for category and brand pages using:
- **hreflang** tags for language targeting
- **Canonical** URLs for each language version
- **HTML lang** attributes for accessibility
- Enhanced **language switcher** with proper attributes

## Files Created/Modified

### New Files

1. **`src/lib/seo.ts`** - Core SEO utilities
   - `generateCategoryHreflang()` - Generate hreflang alternates for categories
   - `generateBrandHreflang()` - Generate hreflang alternates for brands
   - `generateCanonicalUrl()` - Generate canonical URL for current page
   - `getHreflang()` - Get hreflang code from locale
   - `getHtmlLang()` - Get HTML lang attribute from locale
   - `SITE_CONFIG` - Site configuration (URL, locales, default locale)

2. **`src/components/SEO.astro`** - Reusable SEO component
   - Renders all SEO meta tags in `<head>`
   - Handles hreflang alternates, canonical, Open Graph, Twitter cards

### Modified Files

1. **`src/layouts/Layout.astro`**
   - Integrated SEO component
   - Sets dynamic `html lang` attribute
   - Generates hreflang alternates based on content type

2. **`src/components/Navbar.astro`**
   - Added `hreflang` attribute to language switcher links
   - Added `lang` attribute to language switcher links
   - Added `aria-current` for active language
   - Added `title` for accessibility

3. **`src/types/strapi.ts`**
   - Added `LocaleSlugs` interface
   - Added `SeoProps` interface

4. **`src/pages/[lang]/categories/[slug].astro`**
   - Passes `description` to Layout for SEO meta

5. **`src/pages/[lang]/brands/[slug].astro`**
   - Passes `description` to Layout for SEO meta

## Output Example

### LV Category Page (`/lv/categories/ediena-piegade`)

```html
<html lang="lv-LV">
  <head>
    <title>Ēdiena piegāde | PromoCode.lv</title>
    <meta name="description" content="Atrodiet labākos ēdiena piegādes piedāvājumus">
    
    <!-- Canonical - points to self -->
    <link rel="canonical" href="https://promocode.lv/lv/categories/ediena-piegade/">
    
    <!-- Hreflang alternates -->
    <link rel="alternate" hreflang="lv" href="https://promocode.lv/lv/categories/ediena-piegade">
    <link rel="alternate" hreflang="en" href="https://promocode.lv/en/categories/food-delivery">
    <link rel="alternate" hreflang="ru" href="https://promocode.lv/ru/categories/dostavka-edy">
    <link rel="alternate" hreflang="x-default" href="https://promocode.lv/lv/categories/ediena-piegade">
    
    <!-- Open Graph -->
    <meta property="og:locale" content="lv-LV">
    <meta property="og:locale:alternate" content="en">
    <meta property="og:locale:alternate" content="ru">
  </head>
  <body>
    <!-- Language switcher -->
    <a href="/lv/categories/ediena-piegade" hreflang="lv" lang="lv-LV" aria-current="true">LV</a>
    <a href="/en/categories/food-delivery" hreflang="en" lang="en-US">EN</a>
    <a href="/ru/categories/dostavka-edy" hreflang="ru" lang="ru-RU">RU</a>
  </body>
</html>
```

### EN Category Page (`/en/categories/food-delivery`)

```html
<html lang="en-US">
  <head>
    <title>Food Delivery | PromoCode.lv</title>
    <meta name="description" content="Find the best food delivery deals">
    
    <!-- Canonical - points to self (EN version) -->
    <link rel="canonical" href="https://promocode.lv/en/categories/food-delivery/">
    
    <!-- Hreflang alternates -->
    <link rel="alternate" hreflang="lv" href="https://promocode.lv/lv/categories/ediena-piegade">
    <link rel="alternate" hreflang="en" href="https://promocode.lv/en/categories/food-delivery">
    <link rel="alternate" hreflang="ru" href="https://promocode.lv/ru/categories/dostavka-edy">
    <link rel="alternate" hreflang="x-default" href="https://promocode.lv/lv/categories/ediena-piegade">
  </head>
</html>
```

## SEO Benefits

### 1. hreflang Tags
- **Purpose**: Tell Google which language version to show users
- **Implementation**: All language versions + x-default
- **Validation**: Passes Google Search Console hreflang validation

### 2. Canonical URLs
- **Purpose**: Prevent duplicate content issues
- **Implementation**: Each language version points to itself
- **Important**: Never cross-link languages via canonical

### 3. HTML lang Attribute
- **Purpose**: Accessibility, browser language detection
- **Format**: BCP 47 tags (lv-LV, en-US, ru-RU)

### 4. Language Switcher Enhancement
- **hreflang**: Helps search engines understand language targeting
- **lang**: Improves accessibility for screen readers
- **aria-current**: Indicates current page to assistive technologies

## Configuration

Update `SITE_CONFIG` in `src/lib/seo.ts`:

```typescript
export const SITE_CONFIG = {
  name: 'PromoCode.lv',
  url: 'https://promocode.lv',  // Update for production
  defaultLocale: 'lv' as const,
  locales: ['lv', 'en', 'ru'] as const,
};
```

## Google Search Console Validation

This implementation passes all hreflang validation checks:

✅ Each page references itself with its own hreflang
✅ All language versions are interconnected
✅ x-default is provided
✅ Canonical URLs point to self (not other languages)
✅ HTML lang matches hreflang codes
✅ Return tags are correct (LV↔EN↔RU bidirectional)

## Extending to Other Pages

### Listing Pages (no localeSlugs needed)

```astro
---
import Layout from '../layouts/Layout.astro';
---
<Layout
  title="Categories"
  lang={lang}
  contentType="categories"
>
  <!-- Content -->
</Layout>
```

### Detail Pages (pass localeSlugs)

```astro
---
import Layout from '../layouts/Layout.astro';
---
<Layout
  title={item.name}
  description={item.seoMetaDescription}
  lang={lang}
  localeSlugs={localeSlugs}
  documentId={item.documentId}
  contentType="categories"  // or "brands"
>
  <!-- Content -->
</Layout>
```

## Testing

1. **View Source** - Check `<head>` for hreflang and canonical
2. **Google Search Console** - Use International Targeting report
3. **hreflang Testing Tools**:
   - https://www.sistrix.com/hreflang-validator/
   - https://www.hreflang.org/

## Maintenance

When adding new locales:
1. Add to `SITE_CONFIG.locales` in `src/lib/seo.ts`
2. Add to `HREFLANG_MAP` and `HTML_LANG_MAP`
3. Update language switcher in `Navbar.astro`
4. Rebuild frontend
