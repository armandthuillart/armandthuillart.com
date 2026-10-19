import { contactMetadataSchema } from '@remark/lib/schema';
import { z } from 'zod';

const contactSchema = z.object({
  createdAt: z.date(),
  email: z.email(),
  id: z.string(),
  metadata: contactMetadataSchema,
  name: z.string(),
  referenceId: z.string(),
  updatedAt: z.date(),
});
export type Contact = z.infer<typeof contactSchema>;
