import {
  feedbackImpactSchema,
  feedbackMetadataSchema,
  feedbackTagSchema,
} from '@remark/lib/schema';
import { z } from 'zod';

const feedbackSchema = z.object({
  createdAt: z.date(),
  from: z.email(),
  id: z.string(),
  impact: feedbackImpactSchema,
  metadata: feedbackMetadataSchema,
  subject: z.string(),
  summary: z.array(z.string()),
  tags: z.array(feedbackTagSchema),
  text: z.string(),
  updatedAt: z.date(),
});
export type Feedback = z.infer<typeof feedbackSchema>;
