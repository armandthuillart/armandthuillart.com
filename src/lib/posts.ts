import { getCollection } from 'astro:content';
import { getRelativeLocaleUrl } from 'astro:i18n';

export async function getPosts(lang: string) {
  const entries = await getCollection('content', ({ data, id }) => {
    return id.endsWith(`.${lang}`) && !id.startsWith('index.') && !data.draft;
  });

  return entries
    .map(({ data, id }) => {
      if (data.year === undefined) throw new Error(`Missing year: ${id}`);
      const slug = id.replace(`.${lang}`, '');
      return {
        date: data.date,
        year: data.year,
        slug,
        title: data.title,
        url: getRelativeLocaleUrl(lang, slug),
      };
    })
    .sort((a, b) => b.year - a.year || b.date.getTime() - a.date.getTime());
}
