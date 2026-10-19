import { headers } from '@remark/adapters/headers';
import { CurrentPlan } from '@remark/components/CurrentPlan';
import { EmptyState } from '@remark/components/EmptyState';
import { Button } from '@remark/components/ui/Button';
import { Skeleton } from '@remark/components/ui/Skeleton';
import { UpdatePlanDialog } from '@remark/components/UpdatePlanDialog';
import { auth } from '@remark/lib/auth';
import { polarClient } from '@remark/lib/configs/polar';
import { getSlugFromProductId } from '@remark/lib/configs/products';
import { CreditCard } from 'lucide-react';
import React from 'react';

export default function BillingPage() {
  return (
    <div className="container">
      <React.Suspense fallback={<Skeleton className="h-38 rounded-xl border" />}>
        <BillingCard />
      </React.Suspense>
    </div>
  );
}

function BillingCard() {
  const session = auth.api.getSession({ headers: headers() });

  const user = session.user;

  const customerState = polarClient.customers.getStateExternal({ externalId: user.id });

  const subscription = customerState.activeSubscriptions.find(
    (subscription) => subscription.status === 'active',
  );

  if (!subscription) {
    return (
      <EmptyState
        action={
          <UpdatePlanDialog currentPlan="free">
            <Button className="mt-4 shadow-sm active:shadow-none" variant="outline">
              Change plan
            </Button>
          </UpdatePlanDialog>
        }
        description="Upgrade for AI at your fingertips, no daily limit and many more."
        icons={[CreditCard, CreditCard, CreditCard]}
        title="You are not subscribed to any plan yet"
      />
    );
  }

  return (
    <CurrentPlan
      cancelAtPeriodEnd={Boolean(subscription.cancelAtPeriodEnd)}
      currentPeriodEnd={subscription.currentPeriodEnd}
      slug={getSlugFromProductId(subscription.productId)}
      startedAt={subscription.startedAt}
    />
  );
}
