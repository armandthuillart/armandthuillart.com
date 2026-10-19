'use client';

import { useTranslations, checkout } from '../local/runtime';
import { Button } from './ui/button';
import { StarIcon } from './ui/icons';

export function CTA() {
  const t = useTranslations('ChatHeaderUpgradeButton');

  async function handleCheckout() {
    await checkout({ slug: 'pro' });
  }

  return (
    <div className="absolute start-1/2 -translate-x-1/2">
      <Button className="gap-1.5 rounded-full px-3" onClick={handleCheckout} variant="selection">
        <StarIcon className="size-3.5" />
        {t('upgrade')}
      </Button>
    </div>
  );
}
