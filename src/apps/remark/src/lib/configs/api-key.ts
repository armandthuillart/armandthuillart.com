import type { SubscriptionSlug } from '@remark/lib/schema';

interface ApiKeyConfig {
  rateLimitEnabled?: boolean;
  rateLimitMax?: number;
  rateLimitTimeWindow?: number;
  refillAmount?: number;
  refillInterval?: number;
  remaining?: number;
}
export const API_KEY_CONFIG: Record<SubscriptionSlug, ApiKeyConfig> = {
  /**
   * 250 requests each month, 25 requests per day
   */
  free: {
    rateLimitEnabled: true,
    rateLimitMax: 25, // Max requests per day
    rateLimitTimeWindow: 1000 * 60 * 60 * 24, // 1 day
    refillAmount: 250,
    refillInterval: 60 * 60 * 24 * 30, // Refill 250 requests every month
    remaining: 250, // Initial remaining requests
  },
  /**
   * 2500 requests each month, no daily limit
   */
  plus: {
    refillAmount: 2500,
    refillInterval: 60 * 60 * 24 * 30,
    remaining: 2500,
  },
  /**
   * Unlimited requests (metered by middleware)
   */
  pro: {},
} as const;
