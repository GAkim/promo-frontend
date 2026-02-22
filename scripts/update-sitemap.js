// Post-build script to enhance sitemap with proper hreflang and lastmod
import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const today = new Date().toISOString().split('T')[0];
const localeCodes = { en: 'en-US', lv: 'lv-LV', ru: 'ru-RU' };
const DEFAULT_LOCALE = 'en'; // x-default points to English

// Read all generated HTML files to extract hreflang data
const htmlFiles = globSync('dist/**/*.html');
const pageData = new Map();

// Extract hreflang alternates from HTML files
for (const file of htmlFiles) {
  const content = readFileSync(file, 'utf-8');

  // Extract canonical URL from HTML (with or without trailing slash)
  const canonicalMatch = content.match(/<link rel="canonical" href="([^"]+)"/);
  if (!canonicalMatch) continue;

  let canonicalUrl = canonicalMatch[1];
  // Normalize: ensure trailing slash for consistent matching
  if (!canonicalUrl.endsWith('/')) canonicalUrl += '/';
  const path = canonicalUrl.replace('https://promocode.lv', '');

  // Extract hreflang alternates (including x-default)
  const hreflangMatches = content.matchAll(/<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g);
  const alternates = {};
  let xDefaultHref = null;

  for (const match of hreflangMatches) {
    const [, hreflang, href] = match;
    let alternatePath = href.replace('https://promocode.lv', '');
    // Normalize: ensure trailing slash
    if (!alternatePath.endsWith('/')) alternatePath += '/';
    
    if (hreflang === 'x-default') {
      xDefaultHref = alternatePath;
    } else {
      // Store hreflang as-is (e.g., 'en-US', 'lv-LV', 'ru-RU')
      alternates[hreflang] = alternatePath;
    }
  }

  if (Object.keys(alternates).length > 0) {
    pageData.set(path, { alternates, xDefaultHref });
  }
}

// Process sitemap-0.xml
const sitemapPath = 'dist/sitemap-0.xml';
let content = readFileSync(sitemapPath, 'utf-8');

// Add lastmod after each <loc> tag (before changefreq)
content = content.replace(
  /(<loc>https:\/\/promocode\.lv\/[^<]+<\/loc>)(<changefreq>)/g,
  `$1<lastmod>${today}</lastmod>$2`
);

// Add hreflang alternates for pages that have them
for (const [path, { alternates, xDefaultHref }] of pageData.entries()) {
  const escapedPath = path.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  
  // Build hreflang tags including x-default
  // Use hreflang values directly as they appear in HTML
  const hreflangTags = [
    // Regular language alternates
    ...Object.entries(alternates).map(([hreflang, altPath]) =>
      `<xhtml:link rel="alternate" hreflang="${hreflang}" href="https://promocode.lv${altPath}"/>`
    ),
    // x-default alternate (always add if available)
    xDefaultHref ? `<xhtml:link rel="alternate" hreflang="x-default" href="https://promocode.lv${xDefaultHref}"/>` : '',
  ].join('');

  if (!hreflangTags) continue;

  // Match URL entry - handle both with and without existing xhtml:link tags
  const regex = new RegExp(
    `(<url><loc>https://promocode\\.lv${escapedPath}</loc><lastmod>[^<]+</lastmod><changefreq>[^<]+</changefreq><priority>[^<]+</priority>)(</url>)`,
    'g'
  );
  content = content.replace(regex, `$1${hreflangTags}$2`);
}

writeFileSync(sitemapPath, content, 'utf-8');
console.log(`✓ Sitemap updated: ${pageData.size} pages with hreflang alternates`);
