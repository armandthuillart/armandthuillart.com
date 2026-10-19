import { z } from 'zod';

const apiKeySchema = z.object({
  createdAt: z.date(),
  id: z.string(),
  lastRequest: z.date().nullable(),
  name: z.string().nullable(),
  start: z.string().nullable(),
});

export type ApiKey = z.infer<typeof apiKeySchema>;
