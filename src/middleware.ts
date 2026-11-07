import { i18n } from 'astro:config/client';
import { defineMiddleware } from 'astro:middleware';

if (!i18n) throw new Error('astro.config.ts i18n is not configured.');
const { defaultLocale } = i18n;

const withVaryHeader = (response: Response) => {
  const headers = new Headers(response.headers);
  headers.set('Vary', 'Accept-Language');

  return new Response(response.body, {
    headers,
    status: response.status,
    statusText: response.statusText,
  });
};

export const onRequest = defineMiddleware(async (context, next) => {
  if (context.url.pathname === '/') {
    const locale = context.preferredLocale ?? defaultLocale;
    return withVaryHeader(context.redirect(`/${locale}${context.url.search}`));
  }
  context.locals.lang = context.currentLocale ?? defaultLocale;
  return withVaryHeader(await next());
});
