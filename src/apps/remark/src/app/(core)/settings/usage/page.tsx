import { getContacts } from '@remark/adapters/database';
import { headers } from '@remark/adapters/headers';
import { UpgradeButton } from '@remark/components/UpgradeButton';
import { UsageSkeleton } from '@remark/components/UsageSkeleton';
import { auth } from '@remark/lib/auth';
import { API_KEY_CONFIG } from '@remark/lib/configs/api-key';
import { CONTACT_CONFIG } from '@remark/lib/configs/contact';
import { polarClient } from '@remark/lib/configs/polar';
import { getSlugFromProductId } from '@remark/lib/configs/products';
import { APP_NAME } from '@remark/lib/constants';
import type { SubscriptionSlug } from '@remark/lib/schema';
import { Suspense } from 'react';

interface ApiKey {
  lastRequest?: Date | null | string;
  requestCount?: number;
}

export default function UsagePage() {
  return (
    <Suspense fallback={<UsageSkeleton />}>
      <UsageCards />
    </Suspense>
  );
}

function countRequestsToday(apiKeys: ApiKey[]): number {
  const startOfDay = new Date();
  startOfDay.setHours(0, 0, 0, 0);
  let total = 0;
  for (const key of apiKeys) {
    if (!key.lastRequest) continue;
    if (new Date(key.lastRequest) < startOfDay) continue;
    total += key.requestCount ?? 0;
  }
  return total;
}

function formatLimitUsage(limit: {
  displayTotal?: string;
  title: string;
  total: null | number | string;
  used?: number | string;
}) {
  if (limit.title.includes('Overage')) return limit.used;
  if (limit.total === null) return 'Unlimited';
  return (
    <>
      {limit.used} / {limit.displayTotal ?? limit.total}
    </>
  );
}

function UsageCard({
  description,
  limits,
  slug,
  title,
}: {
  description: string;
  limits: {
    displayTotal?: string;
    title: string;
    total: null | number | string;
    used?: number | string;
  }[];
  slug: SubscriptionSlug;
  title: string;
}) {
  const getUsageColor = (used: number | string, total: null | number | string) => {
    if (total === null) return 'text-muted';
    if (typeof total === 'string') return 'text-green-700 dark:text-green-400';
    if (typeof used !== 'number') return 'text-green-700 dark:text-green-400';
    const percentage = (used / total) * 100;
    if (percentage >= 80) return 'text-red-700 dark:text-red-400';
    if (percentage >= 50) return 'text-yellow-700 dark:text-yellow-400';
    return 'text-green-700 dark:text-green-400';
  };

  const getStrokeDashoffset = (used: number | string, total: null | number | string) => {
    if (total === null || typeof total === 'string' || total === 0) return 0;
    if (typeof used !== 'number') return 0;
    const circumference = 2 * Math.PI * 8; // 2πr where r=8
    const percentage = used / total;
    return circumference * (1 - percentage);
  };

  return (
    <div className="border-slate-4 flex flex-col border-b py-4 md:flex-row md:pt-8 md:pb-16">
      <div className="flex w-full justify-between md:block md:w-1/2">
        <h2 className="mb-1 text-xl font-bold tracking-tight">{title}</h2>
        <span className="mb-4 hidden text-sm text-muted-foreground md:block md:w-1/2">
          {description}
        </span>
        <UpgradeButton slug={slug} />
      </div>
      <div className="w-full md:w-1/2">
        <h3 className="text-base font-medium capitalize">{slug}</h3>
        <div className="relative w-full overflow-x-auto overflow-y-hidden">
          <table className="m-0 mb-2 w-max min-w-full border-separate border-spacing-0 border-none p-0 py-4 text-left md:w-full">
            <tbody>
              {limits.map((limit) => (
                <tr
                  className={
                    limit.title.includes('Overage') &&
                    typeof limit.used === 'string' &&
                    Number.parseFloat(limit.used) > 0
                      ? 'bg-red-50 dark:bg-red-950/20'
                      : ''
                  }
                  key={limit.title}
                >
                  <td className="h-10 w-8 overflow-hidden border-b px-0 text-center text-sm text-ellipsis whitespace-nowrap">
                    <svg className="flip -mt-px rotate-180" height="22" width="22">
                      <title>Usage</title>
                      <circle
                        className="text-muted"
                        cx={11}
                        cy={11}
                        fill="transparent"
                        r={8}
                        stroke="currentColor"
                        strokeWidth={3}
                      />
                      <circle
                        className={
                          limit.title.includes('Overage')
                            ? 'text-muted'
                            : getUsageColor(limit.used ?? 0, limit.total)
                        }
                        cx={11}
                        cy={11}
                        fill="transparent"
                        r={8}
                        stroke="currentColor"
                        strokeDasharray="50.26548245743669"
                        strokeDashoffset={
                          limit.title.includes('Overage')
                            ? 0
                            : getStrokeDashoffset(limit.used ?? 0, limit.total)
                        }
                        strokeLinecap="round"
                        strokeWidth={3}
                      />
                    </svg>
                  </td>
                  <td className="h-10 w-3/5 overflow-hidden border-b px-0 py-3.5 text-sm text-ellipsis whitespace-nowrap">
                    {limit.title.replace(/ \(billed.*\)/, '')}
                    {limit.title.includes('Overage') && (
                      <span className="ml-2 text-xs text-muted-foreground">
                        (billed at $0.01 per unit)
                      </span>
                    )}
                  </td>
                  <td className="h-10 overflow-hidden border-b px-0 text-right text-sm text-ellipsis whitespace-nowrap">
                    {formatLimitUsage(limit)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function UsageCards() {
  const session = auth.api.getSession({ headers: headers() });

  const user = session.user;

  const customerState = polarClient.customers.getStateExternal({ externalId: user.id });

  const subscription = customerState.activeSubscriptions.at(0);
  const slug = subscription ? getSlugFromProductId(subscription.productId) : 'free';

  const apiKeyConfig = API_KEY_CONFIG[slug];
  const contactConfig = CONTACT_CONFIG[slug];

  if (!user.id) {
    return null;
  }

  const apiKeys = auth.api.listApiKeys({ headers: headers() });
  const contactsCount = [{ count: getContacts().length }];

  const totalRequestsCount = apiKeys.reduce((accumulator, apiKey) => {
    return accumulator + apiKey.requestCount;
  }, 0);

  const requestsMadeToday = countRequestsToday(apiKeys);

  const OVERAGE_UNIT_PRICE = 0.01;
  const overageUnits = slug === 'pro' ? Math.max(0, totalRequestsCount - 10000) : 0;
  const overageCost = overageUnits * OVERAGE_UNIT_PRICE;

  const transactionalLimits = [
    {
      displayTotal: slug === 'pro' ? '10,000 included' : undefined,
      title: 'Monthly limit',
      total: slug === 'pro' ? 10000 : (apiKeyConfig.refillAmount ?? 0),
      used: totalRequestsCount,
    },
    {
      title: 'Daily limit',
      total: apiKeyConfig.rateLimitMax ?? null,
      used: requestsMadeToday,
    },
    ...(slug === 'pro'
      ? [
          {
            title: 'Overage (billed at $0.01 per unit)',
            total: '',
            used: `${overageUnits} ($${overageCost.toFixed(2)})`,
          },
        ]
      : []),
  ];

  const internalLimits = [
    {
      title: 'Contacts limit',
      total: contactConfig.limit,
      used: contactsCount[0].count,
    },
  ];

  return (
    <main className="container">
      <UsageCard
        description={`Integrate feedback into your app using the ${APP_NAME} API.`}
        limits={transactionalLimits}
        slug={slug}
        title="External"
      />
      <UsageCard
        description="Know who's behind the feedback and segment them."
        limits={internalLimits}
        slug={slug}
        title="Internal"
      />
    </main>
  );
}
