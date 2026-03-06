// Post-build script to enhance sitemap with proper hreflang clusters, priority, and changefreq
import { readFileSync, writeFileSync } from 'fs';
import { globSync } from 'glob';

const today = new Date().toISOString().split('T')[0];

// Standardized hreflang codes (Google-recommended format)
const HREFLANG_CODES = {
  lv: 'lv',
  en: 'en',
  ru: 'ru',
};

const DEFAULT_LOCALE = 'lv'; // x-default points to Latvian (default locale)

// Priority and changefreq rules by page type
const PAGE_TYPE_CONFIG = {
  homepage: {
    priority: 1.0,
    changefreq: 'daily',
    pattern: /^\/(lv|en|ru)\/?$/,
  },
  category_listing: {
    priority: 0.8,
    changefreq: 'weekly',
    pattern: /^\/(lv|en|ru)\/categories\/?$/,
  },
  category_detail: {
    priority: 0.8,
    changefreq: 'weekly',
    pattern: /^\/(lv|en|ru)\/categories\/.+\/$/,
  },
  brand_listing: {
    priority: 0.7,
    changefreq: 'weekly',
    pattern: /^\/(lv|en|ru)\/brands\/?$/,
  },
  brand_detail: {
    priority: 0.7,
    changefreq: 'weekly',
    pattern: /^\/(lv|en|ru)\/brands\/.+\/$/,
  },
  promo_listing: {
    priority: 0.7,
    changefreq: 'daily',
    pattern: /^\/(lv|en|ru)\/promo-codes\/?$/,
  },
  promo_detail: {
    priority: 0.6,
    changefreq: 'daily',
    pattern: /^\/(lv|en|ru)\/promocode\/.+\/$/,
  },
  info: {
    priority: 0.3,
    changefreq: 'yearly',
    pattern: /^\/(lv|en|ru)\/info(\/.+)?\/$/,
  },
};

/**
 * Determine page type from URL path
 */
function getPageType(path) {
  for (const [type, config] of Object.entries(PAGE_TYPE_CONFIG)) {
    if (config.pattern.test(path)) {
      return type;
    }
  }
  return 'default';
}

/**
 * Get the base path without locale for grouping alternates
 */
function getBasePath(path) {
  // Remove locale prefix: /lv/categories/food -> /categories/food
  return path.replace(/^\/(lv|en|ru)/, '');
}

/**
 * Generate all language variants of a path
 */
function generateLanguageVariants(basePath) {
  const variants = {};
  for (const locale of ['lv', 'en', 'ru']) {
    variants[locale] = `/${locale}${basePath}`;
  }
  return variants;
}

// Read all generated HTML files to extract hreflang data
const htmlFiles = globSync('dist/client/**/*.html');
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
  const hreflangMatches = content.matchAll(
    /<link rel="alternate" hreflang="([^"]+)" href="([^"]+)"/g
  );
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
      // Store hreflang using standardized codes
      alternates[hreflang] = alternatePath;
    }
  }

  // Store page data (even if no alternates found - we'll generate them)
  pageData.set(path, { alternates, xDefaultHref });
}

// Group pages by their logical base path (using Latvian URL as the canonical key)
const hreflangGroups = new Map();
for (const [path, { alternates, xDefaultHref }] of pageData.entries()) {
  // Use the Latvian alternate as the canonical key for this group
  const lvPath = alternates['lv'];
  if (!lvPath) continue; // Skip if no Latvian version
  
  const basePath = getBasePath(lvPath);
  
  if (!hreflangGroups.has(basePath)) {
    hreflangGroups.set(basePath, { alternates: {}, xDefaultHref: null });
  }
  
  const group = hreflangGroups.get(basePath);
  
  // Merge alternates from this page
  for (const [hreflang, href] of Object.entries(alternates)) {
    group.alternates[hreflang] = href;
  }
  
  // Merge x-default
  if (xDefaultHref) {
    group.xDefaultHref = xDefaultHref;
  }
}

// Ensure all groups have complete alternates (lv, en, ru)
for (const [basePath, group] of hreflangGroups.entries()) {
  const variants = generateLanguageVariants(basePath);
  for (const locale of ['lv', 'en', 'ru']) {
    if (!group.alternates[locale]) {
      group.alternates[locale] = variants[locale];
    }
  }
  
  // Ensure x-default is set (points to Latvian)
  if (!group.xDefaultHref) {
    group.xDefaultHref = variants['lv'];
  }
}

// Process sitemap-0.xml (now in dist/client/ due to server output mode)
const sitemapPath = 'dist/client/sitemap-0.xml';
let content = readFileSync(sitemapPath, 'utf-8');

// Build a map of basePath -> hreflang tags for quick lookup
// Use the hreflangGroups which correctly groups pages by logical equivalence
const basePathHreflangTags = new Map();
for (const [basePath, { alternates, xDefaultHref }] of hreflangGroups.entries()) {
  // Build hreflang tags with standardized codes (lv, en, ru + x-default)
  const hreflangTags = [
    // Regular language alternates (lv, en, ru)
    ...['lv', 'en', 'ru'].map((locale) => {
      const altPath = alternates[locale] || `/${locale}${basePath}`;
      return `<xhtml:link rel="alternate" hreflang="${locale}" href="https://promocode.lv${altPath}"/>`;
    }),
    // x-default alternate (points to Latvian)
    `<xhtml:link rel="alternate" hreflang="x-default" href="https://promocode.lv${xDefaultHref || `/${DEFAULT_LOCALE}${basePath}`}"/>`,
  ].join('');
  basePathHreflangTags.set(basePath, hreflangTags);
}

// Remove all existing <url> entries and rebuild with proper clusters
// First, extract all existing URL entries to get their data
const urlEntries = [];
const urlRegex = /<url>(.*?)<\/url>/gs;
let match;
while ((match = urlRegex.exec(content)) !== null) {
  const entryContent = match[1];
  const locMatch = entryContent.match(/<loc>https:\/\/promocode\.lv([^<]+)<\/loc>/);
  const lastmodMatch = entryContent.match(/<lastmod>([^<]+)<\/lastmod>/);
  const changefreqMatch = entryContent.match(/<changefreq>([^<]+)<\/changefreq>/);
  const priorityMatch = entryContent.match(/<priority>([^<]+)<\/priority>/);

  if (locMatch) {
    const path = locMatch[1];
    // Ensure trailing slash
    const normalizedPath = path.endsWith('/') ? path : path + '/';
    urlEntries.push({
      path: normalizedPath,
      lastmod: lastmodMatch ? lastmodMatch[1] : today,
      changefreq: changefreqMatch ? changefreqMatch[1] : 'monthly',
      priority: priorityMatch ? priorityMatch[1] : '0.5',
    });
  }
}

// Build a lookup map: path -> entry data
const entryByPath = new Map();
for (const entry of urlEntries) {
  entryByPath.set(entry.path, entry);
}

// Build new sitemap content with ONE url entry per language version
// Each entry includes the complete hreflang cluster
const newUrlEntries = [];

for (const [basePath, { alternates, xDefaultHref }] of hreflangGroups.entries()) {
  const lvPath = alternates['lv'] || `/${DEFAULT_LOCALE}${basePath}`;
  const enPath = alternates['en'] || `/en${basePath}`;
  const ruPath = alternates['ru'] || `/ru${basePath}`;
  const xDefaultPath = xDefaultHref || lvPath;

  // Get entry data for each language (use Latvian as fallback for metadata)
  const lvEntry = entryByPath.get(lvPath);
  const enEntry = entryByPath.get(enPath);
  const ruEntry = entryByPath.get(ruPath);
  const baseEntry = lvEntry || enEntry || ruEntry;

  // Get page type and config from Latvian entry
  const pageType = getPageType(lvPath);
  const typeConfig = PAGE_TYPE_CONFIG[pageType] || { priority: 0.5, changefreq: 'monthly' };

  // Build hreflang tags for this cluster
  const hreflangTags = [
    `<xhtml:link rel="alternate" hreflang="lv" href="https://promocode.lv${lvPath}"/>`,
    `<xhtml:link rel="alternate" hreflang="en" href="https://promocode.lv${enPath}"/>`,
    `<xhtml:link rel="alternate" hreflang="ru" href="https://promocode.lv${ruPath}"/>`,
    `<xhtml:link rel="alternate" hreflang="x-default" href="https://promocode.lv${xDefaultPath}"/>`,
  ].join('');

  // Create entry for Latvian version
  newUrlEntries.push(
    `<url>
  <loc>https://promocode.lv${lvPath}</loc>
  <lastmod>${lvEntry?.lastmod || baseEntry?.lastmod || today}</lastmod>
  <changefreq>${typeConfig.changefreq}</changefreq>
  <priority>${typeConfig.priority}</priority>
  ${hreflangTags}
</url>`
  );

  // Create entry for English version (if it exists)
  if (enEntry || enPath !== `/en${basePath}`) {
    newUrlEntries.push(
      `<url>
  <loc>https://promocode.lv${enPath}</loc>
  <lastmod>${enEntry?.lastmod || baseEntry?.lastmod || today}</lastmod>
  <changefreq>${typeConfig.changefreq}</changefreq>
  <priority>${typeConfig.priority}</priority>
  ${hreflangTags}
</url>`
    );
  }

  // Create entry for Russian version (if it exists)
  if (ruEntry || ruPath !== `/ru${basePath}`) {
    newUrlEntries.push(
      `<url>
  <loc>https://promocode.lv${ruPath}</loc>
  <lastmod>${ruEntry?.lastmod || baseEntry?.lastmod || today}</lastmod>
  <changefreq>${typeConfig.changefreq}</changefreq>
  <priority>${typeConfig.priority}</priority>
  ${hreflangTags}
</url>`
    );
  }
}

// Replace the entire URL section in the sitemap
const newSitemapContent = content.replace(
  /(<urlset[^>]*>)[\s\S]*?(<\/urlset>)/,
  `$1\n${newUrlEntries.join('\n')}\n$2`
);

writeFileSync(sitemapPath, newSitemapContent, 'utf-8');

// Log summary
const typeCounts = {};
for (const [basePath] of hreflangGroups.entries()) {
  const lvPath = `/lv${basePath}`;
  const pageType = getPageType(lvPath);
  typeCounts[pageType] = (typeCounts[pageType] || 0) + 1;
}

console.log('✓ Sitemap updated successfully');
console.log(`  Total URL entries: ${newUrlEntries.length} (all language versions)`);
console.log(`  Logical pages: ${hreflangGroups.size}`);
console.log(`  Pages by type:`, typeCounts);
console.log('');
console.log('Priority & changefreq rules applied:');
console.log('  - Homepage: 1.0 (daily)');
console.log('  - Categories: 0.8 (weekly)');
console.log('  - Brands: 0.7 (weekly)');
console.log('  - Promo codes (listing): 0.7 (daily)');
console.log('  - Promo codes (detail): 0.6 (daily)');
console.log('  - Info pages: 0.3 (yearly)');
