import cloudflare from "@astrojs/cloudflare";
import mdx from "@astrojs/mdx";
import react from "@astrojs/react";
import sitemap from "@astrojs/sitemap";
import tailwindcss from "@tailwindcss/vite";
import { defineConfig, fontProviders } from "astro/config";

export default defineConfig({
  adapter: cloudflare({ imageService: "compile" }),
  fonts: [
    {
      cssVariable: "--font-magister-st",
      name: "Magister ST",
      options: {
        variants: [
          {
            src: ["./src/assets/fonts/magister-st-regular.woff2"],
            style: "normal",
            weight: 400,
          },
        ],
      },
      provider: fontProviders.local(),
    },
  ],
  i18n: {
    defaultLocale: "en",
    locales: ["en", "fr"],
  },
  integrations: [
    mdx(),
    react(),
    sitemap({
      i18n: {
        defaultLocale: "en",
        locales: {
          en: "en-US",
          fr: "fr-FR",
        },
      },
    }),
  ],
  output: "server",
  session: false,
  site: "https://armandthuillart.com",
  vite: {
    plugins: [tailwindcss()],
  },
});
