import rss from '@astrojs/rss';
import { getLocale, getPathname, getTranslations, getCollectionByLocale } from '@lib/i18n';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ site }) => {
  const locale = getLocale();
  if (!site) return new Response(null, { status: 500 });

  const collection = await getCollectionByLocale('blog');
  const posts = collection.filter(({ entry }) => !entry.data.draft);

  return rss({
    customData: `<language>${locale}</language>`,
    description: getTranslations('Head')('description'),
    items: posts.map(({ entry, slug }) => ({
      ...entry.data,
      link: getPathname(`blog/${slug}`),
    })),
    site: site.href,
    title: 'Armand Thuillart',
  });
};
