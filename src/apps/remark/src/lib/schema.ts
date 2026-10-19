import { z } from 'zod';

const SubscriptionSlugSchema = z.enum(['free', 'plus', 'pro']);
export type SubscriptionSlug = z.infer<typeof SubscriptionSlugSchema>;

export const contactMetadataSchema = z.object({ tier: z.string().optional() }).optional();

export const feedbackTagSchema = z.enum([
  'bug',
  'feature_request',
  'ui',
  'ux',
  'speed',
  'security',
  'pricing',
  'billing',
  'dx',
  'i18n',
  'compliance',
  'a11y',
  'kudos',
]);
export type FeedbackTag = z.infer<typeof feedbackTagSchema>;

export const feedbackImpactSchema = z.enum(['minor', 'major', 'positive', 'critical']);
export type FeedbackImpact = z.infer<typeof feedbackImpactSchema>;

const feedbackMetadataOsSchema = z.enum([
  'Windows',
  'macOS',
  'iOS',
  'Android',
  'Linux',
  'ChromeOS',
  'iPadOS',
  'tvOS',
  'watchOS',
]);

const feedbackMetadataDeviceSchema = z.enum([
  'mobile',
  'tablet',
  'desktop',
  'console',
  'smarttv',
  'wearable',
  'embedded',
]);

const feedbackMetadataBrowserSchema = z.enum([
  'Chrome',
  'Firefox',
  'Safari',
  'Edge',
  'Opera',
  'Brave',
  'Arc',
  'Zen',
  'Samsung Internet',
]);

const feedbackEnrichmentMetadataSchema = z.object({
  browser: feedbackMetadataBrowserSchema.optional(),
  device: feedbackMetadataDeviceSchema.optional(),
  os: feedbackMetadataOsSchema.optional(),
});

export const feedbackMetadataSchema = feedbackEnrichmentMetadataSchema
  .extend({ path: z.string().optional() })
  .optional();
export type FeedbackMetadata = z.infer<typeof feedbackMetadataSchema>;

const voteStatusSchema = z.enum([
  'pending',
  'reviewing',
  'planned',
  'in_progress',
  'completed',
  'closed',
]);

const voteImpactSchema = z.enum(['minor', 'major', 'critical']);
export type VoteImpact = z.infer<typeof voteImpactSchema>;

const voteSchema = z.object({
  browsers: z.array(feedbackMetadataBrowserSchema),
  count: z.number(),
  createdAt: z.date(),
  description: z.string(),
  devices: z.array(feedbackMetadataDeviceSchema),
  feedbackIds: z.array(z.string()),
  id: z.string(),
  impact: voteImpactSchema,
  operatingSystems: z.array(feedbackMetadataOsSchema),
  referenceId: z.string(),
  status: voteStatusSchema,
  tags: z.array(feedbackTagSchema),
  title: z.string(),
  updatedAt: z.date(),
});
export type Vote = z.infer<typeof voteSchema>;
