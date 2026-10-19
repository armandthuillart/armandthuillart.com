import { getEntryByLocale } from '@lib/i18n';
import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ params }) => {
  const entry = await getEntryByLocale('blog', params.slug);

  return entry
    ? new Response(entry.body, { headers: { 'Content-Type': 'text/markdown; charset=utf-8' } })
    : new Response(null, { status: 404 });
};
