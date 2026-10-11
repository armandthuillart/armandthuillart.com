import { glob } from 'astro/loaders';
import { z } from 'astro/zod';
import { defineCollection } from 'astro:content';

const blog = defineCollection({
  loader: glob({
    base: './src/content/blog',
    pattern: '**/*.mdx',
  }),
  schema: () =>
    z.object({
      date: z.coerce.date(),
      draft: z.boolean(),
      title: z.string(),
    }),
});

const ventures = defineCollection({
  loader: glob({
    base: './src/content/ventures',
    pattern: '**/*.mdx',
  }),
  schema: ({ image }) =>
    z.object({
      date: z.coerce.date(),
      description: z.string(),
      draft: z.boolean(),
      image: image().optional(),
      title: z.string(),
    }),
});

export const collections = {
  blog,
  ventures,
};
