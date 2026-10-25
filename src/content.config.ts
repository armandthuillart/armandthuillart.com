import { glob } from "astro/loaders";
import { z } from "astro/zod";
import { defineCollection } from "astro:content";

const content = defineCollection({
  loader: glob({
    base: "./src/content",
    generateId: ({ entry }) => entry.replace(/\.mdx$/, ""),
    pattern: "*.mdx",
  }),
  schema: z.object({
    date: z.coerce.date(),
    description: z.string(),
    title: z.string(),
  }),
});

export const collections = { content };
