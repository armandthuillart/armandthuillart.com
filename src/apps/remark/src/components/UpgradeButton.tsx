'use client';

import { Button } from '@remark/components/ui/Button';
import { authClient } from '@remark/lib/auth-client';
import type { SubscriptionSlug } from '@remark/lib/schema';
import React from 'react';

import { UpdatePlanDialog } from './UpdatePlanDialog';

export function UpgradeButton({ slug }: { slug: SubscriptionSlug }) {
  const [isLoading, setIsLoading] = React.useState(false);

  if (slug === 'free') {
    return (
      <UpdatePlanDialog currentPlan="free">
        <Button size="sm">Upgrade</Button>
      </UpdatePlanDialog>
    );
  }

  async function handleClick() {
    setIsLoading(true);
    await authClient.customer.portal();
    setIsLoading(false);
  }

  return (
    <Button
      loading={isLoading}
      onClick={() => {
        void handleClick();
      }}
      size="sm"
    >
      Upgrade
    </Button>
  );
}
