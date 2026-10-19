import { readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import cloudflare from '@astrojs/cloudflare';
import mdx from '@astrojs/mdx';
import react from '@astrojs/react';
import sitemap from '@astrojs/sitemap';
import svelte from '@astrojs/svelte';
import tailwindcss from '@tailwindcss/vite';
import { defineConfig, fontProviders } from 'astro/config';

const site = 'https://armandthuillart.com';
const appSlugs = ['dimsight', 'remark', 'crosspost'];
const slugs = (collection: string) =>
  readdirSync(`./src/content/${collection}/en`).map((file) => file.replace(/\.mdx$/, ''));

// Pages are rendered on demand, so the sitemap cannot discover them.
const customPages = ['en', 'fr'].flatMap((locale) =>
  [
    '',
    'blog',
    ...slugs('ventures'),
    ...slugs('blog').map((slug) => `blog/${slug}`),
    ...appSlugs.map((slug) => `apps/${slug}`),
  ].map((path) => `${site}/${locale}/${path}${path ? '/' : ''}`),
);

export default defineConfig({
  adapter: cloudflare(),
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
    react(),
    svelte(),
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
  output: 'server',
  site,
  vite: {
    plugins: [tailwindcss()],
    resolve: {
      alias: {
        '@crosspost': resolve('./src/apps/crosspost/source'),
        '@dimsight': resolve('./src/apps/dimsight/source'),
        '@remark': resolve('./src/apps/remark/src'),
      },
      dedupe: ['react', 'react-dom'],
    },
  },
});
