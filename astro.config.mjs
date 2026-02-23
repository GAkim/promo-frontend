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
  integrations: [
    tailwindcss(),
    sitemap({
      changefreq: 'daily',
      priority: 0.5,
      // Filter out root path if it's just a redirect
      filter: (page) => page !== 'https://promocode.lv/',
      // Add hreflang alternates for multilingual pages
      i18n: {
        defaultLocale: 'lv',
        locales: {
          lv: 'lv-LV',
          en: 'en-US',
          ru: 'ru-RU',
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
});
