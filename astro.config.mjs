// @ts-check
import { defineConfig } from 'astro/config';
import tailwindcss from '@astrojs/tailwind';
import sitemap from '@astrojs/sitemap';
import node from '@astrojs/node';

// https://astro.build/config
export default defineConfig({
  output: 'server',
  adapter: node({
    mode: 'standalone',
  }),
  compressHTML: true,
  integrations: [
    tailwindcss(),
    sitemap({
      // Basic defaults - will be overridden by post-build script for specific pages
      changefreq: 'daily',
      priority: 0.5,
      // Filter out root path if it's just a redirect
      filter: (page) => page !== 'https://promocode.lv/',
      // Use standardized hreflang codes (lv, en, ru)
      i18n: {
        defaultLocale: 'lv',
        locales: {
          lv: 'lv',
          en: 'en',
          ru: 'ru',
        },
      },
    }),
  ],
  i18n: {
    defaultLocale: 'lv',
    locales: ['lv', 'en', 'ru'],
    routing: {
      prefixDefaultLocale: false,
      redirectDefaultLocaleToRoot: true,
    },
  },
  site: process.env.SITE_URL || 'https://promocode.lv',
  vite: {
    build: {
      cssCodeSplit: false,
      rollupOptions: {
        output: {
          manualChunks: undefined,
        },
      },
    },
    css: {
      // Inline small CSS files
      inline: true,
    },
  },
  build: {
    // Inline stylesheets to prevent render-blocking
    inlineStylesheets: 'always',
  },
});
