import { useDatabase } from '@remark/adapters/database';
import { API_KEY_CONFIG } from '@remark/lib/configs/api-key';
import { CONTACT_CONFIG } from '@remark/lib/configs/contact';
import type { SubscriptionSlug } from '@remark/lib/schema';
import React from 'react';

import { ContactUsButton } from './ContactUsButton';
import { PricingCard } from './PricingCard';

interface Plan {
  description: string;
  features: { content: React.ReactNode | string; id: string }[];
  id: SubscriptionSlug;
  name: string;
  price: number;
}

const plans: Plan[] = [
  {
    description: 'For getting started.',
    features: [
      {
        content: 'No credit card required',
        id: 'free-1',
      },
      {
        content: '250 feedbacks per month',
        id: 'free-2',
      },
      {
        content: '25 feedbacks per day',
        id: 'free-3',
      },
      {
        content: `${CONTACT_CONFIG.free.limit?.toLocaleString()} contacts limit`,
        id: 'free-4',
      },
    ],
    id: 'free',
    name: 'Free',
    price: 0,
  },
  {
    description: 'For more feedbacks.',
    features: [
      {
        content: `${API_KEY_CONFIG.plus.remaining?.toLocaleString()} feedbacks per month`,
        id: 'plus-1',
      },
      {
        content: 'No daily limit',
        id: 'plus-2',
      },
      {
        content: `${CONTACT_CONFIG.plus.limit?.toLocaleString()} contacts limit`,
        id: 'plus-3',
      },
      {
        content: 'Votes & ranking',
        id: 'plus-4',
      },
    ],
    id: 'plus',
    name: 'Plus',
    price: 20,
  },
  {
    description: 'For power users.',
    features: [
      {
        content: `10,000 feedbacks per month`,
        id: 'pro-1',
      },
      {
        content: 'Overage at $0.008/feedback',
        id: 'pro-2',
      },
      {
        content: `Unlimited contacts`,
        id: 'pro-3',
      },
    ],
    id: 'pro',
    name: 'Pro',
    price: 200,
  },
];

export function Pricing() {
  return (
    <section className="container">
      <div className="py-12 md:pt-24 md:pb-12">
        <div className="space-y-3 md:px-6">
          <h2 className="text-4xl/14 font-semibold tracking-tight">Forget about your bill.</h2>
          <p className="text-xl font-medium tracking-tight text-muted-foreground">
            Use the core product for free, forever.
          </p>
        </div>
        <div className="mt-18 grid gap-4 md:grid-cols-3">
          <PricingCards />
        </div>
        <div className="mt-12 flex justify-center">
          <div className="relative flex flex-col items-center gap-2 rounded-2xl border px-6 py-4 font-medium md:flex-row">
            Want enterprise features?
            <ContactUsButton />
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingCards() {
  const { plan, signedIn } = useDatabase();

  return plans.map(({ id, ...plan_ }) => (
    <PricingCard currentSlug={signedIn ? plan : undefined} id={id} key={id} {...plan_} />
  ));
}
