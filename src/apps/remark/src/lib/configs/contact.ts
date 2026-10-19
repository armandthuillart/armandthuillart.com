import type { SubscriptionSlug } from '@remark/lib/schema';

interface ContactConfig {
  limit: null | number;
}

export const CONTACT_CONFIG: Record<SubscriptionSlug, ContactConfig> = {
  free: { limit: 1000 },
  plus: { limit: 5000 },
  pro: { limit: null },
} as const;
