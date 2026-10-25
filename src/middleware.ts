import { i18n } from "astro:config/client";
import { defineMiddleware } from "astro:middleware";

if (!i18n) throw new Error("i18n must be configured in astro.config.ts");
const { defaultLocale } = i18n;

export const onRequest = defineMiddleware(async (context, next) => {
  context.locals.lang = context.preferredLocale ?? defaultLocale;
  const response = await next();
  response.headers.set("Vary", "Accept-Language");
  return response;
});
