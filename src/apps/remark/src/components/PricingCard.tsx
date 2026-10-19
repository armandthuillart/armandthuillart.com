'use client';

import { useRouter } from '@remark/adapters/navigation';
import { Button } from '@remark/components/ui/Button';
import { authClient } from '@remark/lib/auth-client';
import type { SubscriptionSlug } from '@remark/lib/schema';
import { cn } from '@remark/lib/utils';
import { CheckIcon } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';

import { CircleArrow } from './CircleArrow';

export function PricingCard({
  currentSlug,
  description,
  features,
  id,
  name,
  price,
}: {
  currentSlug?: SubscriptionSlug;
  description: string;
  features: { content: React.ReactNode | string; id: string }[];
  id: SubscriptionSlug;
  name: string;
  price: number;
}) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [isHovering, setIsHovering] = React.useState(false);

  const planOrder = ['free', 'plus', 'pro'];
  const isCurrent = id === currentSlug;

  const router = useRouter();

  async function handleClick() {
    setIsLoading(true);

    if (currentSlug === 'free') {
      // Not subscribed yet, allow checkout for paid plans only
      if (id === 'free') {
        // Free plan, nothing to do or show a message
        setIsLoading(false);
      } else {
        await authClient.checkout({ slug: id });
        return;
      }
      // Already subscribed, always go to portal for any plan action
      await authClient.customer.portal();
      return;
    }

    // No currentSlug, means user isn't signed up/in yet
    router.push('/sign-up');
  }

  return (
    <div
      className={cn(
        'flex flex-1 flex-col rounded-2xl border',
        id === 'plus' ? 'border-ring outline-ring/50 outline-4' : '',
      )}
    >
      <div className="flex flex-col gap-2 p-6">
        <h3 className="text-xl font-semibold tracking-tight">{name}</h3>
        <span className="inline-block whitespace-nowrap">
          <span className="text-3xl font-semibold tracking-tight">${price}</span>{' '}
          <span className="inline-block -translate-y-px text-sm text-muted-foreground">
            {id === 'pro' && ' starts at'} per month
          </span>
        </span>
        <p>{description}</p>
      </div>

      <div className="p-6 pt-0">
        {id === 'free' ? (
          <div className="mb-3 h-5" />
        ) : (
          <span className="mb-3 block text-sm text-muted-foreground">
            Everything in {name === 'Plus' ? 'Free' : 'Plus'}, and:
          </span>
        )}
        <ul className="space-y-3">
          {features.map(({ content, id }) => (
            <li
              className="flex items-center gap-x-2 text-sm text-pretty [&_bold]:font-medium"
              key={id}
            >
              <CheckIcon className="shrink-0" size={16} />
              {content}
            </li>
          ))}
        </ul>
      </div>

      <div className="mt-auto p-6 pt-0">
        <Button
          className={cn(
            'group/button h-10 w-full cursor-pointer justify-between rounded-full pr-3 pl-4',
            isLoading && 'justify-center',
          )}
          disabled={id === 'free' && isCurrent}
          loading={isLoading}
          onClick={() => {
            void handleClick();
          }}
          onMouseEnter={() => {
            setIsHovering(true);
          }}
          onMouseLeave={() => {
            setIsHovering(false);
          }}
          size="lg"
          variant={id === 'plus' ? 'default' : 'outline'}
        >
          {isCurrent ? (
            <span className="relative inline-block h-1/2">
              {id === 'free' ? (
                'Your current plan'
              ) : (
                <AnimatePresence initial={false} mode="wait">
                  {isHovering ? (
                    <motion.span
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="absolute right-0 left-0"
                      exit={{
                        opacity: 0,
                        y: -8,
                      }}
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      key="manage"
                      transition={{ duration: 0.11 }}
                    >
                      Manage subscription
                    </motion.span>
                  ) : (
                    <motion.span
                      animate={{
                        opacity: 1,
                        y: 0,
                      }}
                      className="absolute right-0 left-0"
                      exit={{
                        opacity: 0,
                        y: -8,
                      }}
                      initial={{
                        opacity: 0,
                        y: 8,
                      }}
                      key="current"
                      transition={{ duration: 0.11 }}
                    >
                      Your current plan
                    </motion.span>
                  )}
                </AnimatePresence>
              )}
            </span>
          ) : (
            (() => {
              const currentIndex = planOrder.indexOf(currentSlug ?? 'free');
              const thisIndex = planOrder.indexOf(id);
              if (thisIndex > currentIndex) {
                return `Upgrade to ${name}`;
              }
              if (thisIndex < currentIndex) {
                return `Downgrade to ${name}`;
              }
              if (id === 'free') {
                return 'Start Building';
              }
              return `Choose ${name}`;
            })()
          )}
          <CircleArrow
            direction="up-right"
            isHovering={isHovering}
            variant={id === 'plus' ? 'default' : 'outline'}
          />
        </Button>
      </div>
    </div>
  );
}
