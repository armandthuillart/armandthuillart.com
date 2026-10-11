import { readdirSync } from 'node:fs';

import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import sitemap from '@astrojs/sitemap';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

const site = 'https://armandthuillart.com';
const slugs = (collection: string) =>
  readdirSync(`./src/content/${collection}/en`).map((file) => file.replace(/\.mdx$/, ''));

// Pages are rendered on demand, so the sitemap cannot discover them.
const customPages = ['en', 'fr'].flatMap((locale) =>
  ['', 'blog', ...slugs('ventures'), ...slugs('blog').map((slug) => `blog/${slug}`)].map(
    (path) => `${site}/${locale}/${path}${path ? '/' : ''}`,
  ),
);

export default defineConfig({
  adapter: cloudflare(),
  output: 'server',
  fonts: [
    {
      cssVariable: '--font-ibm-plex-mono',
      name: 'IBM Plex Mono',
      provider: fontProviders.google(),
    },
    {
      cssVariable: '--font-ibm-plex-sans',
      name: 'IBM Plex Sans',
      provider: fontProviders.google(),
    },
    {
      cssVariable: '--font-ibm-plex-serif',
      name: 'IBM Plex Serif',
      provider: fontProviders.google(),
    },
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr'],
    routing: { prefixDefaultLocale: true },
  },
  integrations: [
    mdx(),
    sitemap({
      customPages,
      filter: (page) => page !== `${site}/`,
      i18n: {
        defaultLocale: 'en',
        locales: {
          en: 'en-US',
          fr: 'fr-FR',
        },
      },
    }),
  ],
  site,
  vite: {
    plugins: [tailwindcss()],
  },
});
