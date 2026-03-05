# Sitemap Changes Summary

## ✅ What Was Improved

### 1. Standardized hreflang Codes
**Before:** `lv-LV`, `en-US`, `ru-RU`
**After:** `lv`, `en`, `ru` (Google-recommended format)

### 2. Priority Rules by Page Type
| Page Type | Priority | Changefreq |
|-----------|----------|------------|
| Homepage | 1.0 | daily |
| Categories | 0.8 | weekly |
| Brands | 0.7 | weekly |
| Promo Codes | 0.7 | daily |
| Info Pages | 0.3 | yearly |

### 3. Complete hreflang Alternates
Every URL now includes:
- `lv` (Latvian)
- `en` (English)
- `ru` (Russian)
- `x-default` (points to Latvian)

### 4. Consistent x-default
**Before:** Pointed to English
**After:** Points to Latvian (default locale)

---

## 📁 Files Changed

1. **`astro.config.mjs`** - Updated sitemap i18n codes
2. **`scripts/update-sitemap.js`** - Complete rewrite with priority rules
3. **`src/lib/seo.ts`** - Updated hreflang generation functions

---

## 🔍 Example Sitemap Entry

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

---

## 🚀 Build & Test

```bash
# Build the site
npm run build

# Check sitemap output
cat dist/client/sitemap-0.xml

# Validate with Google Search Console
# https://www.google.com/webmasters/tools/home
```

## ✅ Validation Results

```
Sitemap Validation Results:
===========================
✓ Homepage LV - priority: 1, x-default: YES
✓ Brands LV - priority: 0.7, x-default: YES
✓ Category Detail - priority: 0.8, x-default: YES
✓ Info Page - priority: 0.3, x-default: YES
✓ Promo Codes - priority: 0.7, x-default: YES
```

### Sample Entry (Homepage)

```xml
<url>
  <loc>https://promocode.lv/lv/</loc>
  <lastmod>2026-03-05</lastmod>
  <changefreq>daily</changefreq>
  <priority>1</priority>
  <xhtml:link rel="alternate" hreflang="lv" href="https://promocode.lv/lv/"/>
  <xhtml:link rel="alternate" hreflang="en" href="https://promocode.lv/en/"/>
  <xhtml:link rel="alternate" hreflang="ru" href="https://promocode.lv/ru/"/>
  <xhtml:link rel="alternate" hreflang="x-default" href="https://promocode.lv/lv/"/>
</url>
```

### Sample Entry (Category Detail)

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

---

## 📊 Expected Output

```
✓ Sitemap updated successfully
  Total pages: ~150-200
  Pages by type: {
    homepage: 3,
    category: ~30-50,
    brand: ~60-100,
    promo: ~20-40,
    info: ~6
  }
  Hreflang groups: ~50-70
```

---

## 📖 Documentation

- **Full guide:** `frontend/SITEMAP_IMPLEMENTATION.md`
- **Sitemap location:** `dist/client/sitemap-0.xml`
- **Validation:** Google Search Console → International Targeting

---

*March 2026*
