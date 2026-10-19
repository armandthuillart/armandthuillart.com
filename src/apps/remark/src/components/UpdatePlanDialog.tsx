'use client';

import { Badge } from '@remark/components/ui/Badge';
import { Button } from '@remark/components/ui/Button';
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@remark/components/ui/Dialog';
import { Label } from '@remark/components/ui/Label';
import { RadioGroup, RadioGroupItem } from '@remark/components/ui/RadioGroup';
import { authClient } from '@remark/lib/auth-client';
import { APP_NAME } from '@remark/lib/constants';
import type { SubscriptionSlug } from '@remark/lib/schema';
import { CheckIcon, RefreshCcwIcon } from 'lucide-react';
import React from 'react';

interface Plan {
  label: string;
  price: string;
  value: SubscriptionSlug;
}

const plans: Plan[] = [
  {
    label: 'Free',
    price: '$0/mo',
    value: 'free',
  },
  {
    label: 'Plus',
    price: '$20/mo',
    value: 'plus',
  },
  {
    label: 'Pro',
    price: '$200/mo',
    value: 'pro',
  },
];

const planIntro = {
  free: 'Features include:',
  plus: `All ${APP_NAME} Free features, and:`,
  pro: `All ${APP_NAME} Plus features, and:`,
};

export function UpdatePlanDialog({
  children,
  currentPlan,
  onOpenChange,
  open,
}: {
  children?: React.ReactNode;
  currentPlan: SubscriptionSlug;
  onOpenChange?: (open: boolean) => void;
  open?: boolean;
}) {
  const [isLoading, setIsLoading] = React.useState(false);
  const [selectedPlan, setSelectedPlan] = React.useState(currentPlan);

  async function onUpgrade(slug: SubscriptionSlug) {
    setIsLoading(true);
    await authClient.checkout({ slug });
    setIsLoading(false);
  }

  return (
    <Dialog onOpenChange={onOpenChange} open={open}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent>
        <div className="mb-2 flex flex-col gap-2">
          <div
            aria-hidden="true"
            className="flex size-11 shrink-0 items-center justify-center rounded-full border border-border"
          >
            <RefreshCcwIcon className="opacity-80" size={16} strokeWidth={2} />
          </div>
          <DialogHeader>
            <DialogTitle className="text-left">Change your plan</DialogTitle>
            <DialogDescription className="text-left">
              Pick one of the following plans.
            </DialogDescription>
          </DialogHeader>
        </div>

        <form className="space-y-5">
          <RadioGroup
            className="gap-0 -space-y-px rounded-lg shadow-xs shadow-black/5"
            defaultValue={currentPlan}
            onValueChange={(v) => {
              setSelectedPlan(v as SubscriptionSlug);
            }}
          >
            {plans.map((plan) => (
              <div
                className="border-input has-data-[state=checked]:border-ring relative flex h-14 flex-col justify-center gap-4 border p-4 first:rounded-t-lg last:rounded-b-lg has-data-[state=checked]:z-10 has-data-[state=checked]:bg-accent"
                key={plan.value}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <RadioGroupItem
                      aria-describedby={`${plan.value}-price`}
                      className="after:absolute after:inset-0"
                      id={plan.value}
                      value={plan.value}
                    />
                    <Label className="inline-flex items-center" htmlFor={plan.value}>
                      {plan.label}
                      {plan.value === 'plus' && (
                        <Badge className="ms-2 rounded-full">Popular</Badge>
                      )}
                    </Label>
                  </div>
                  <div className="text-xs leading-[inherit] text-muted-foreground">
                    {plan.price}
                  </div>
                </div>
              </div>
            ))}
          </RadioGroup>

          <div className="space-y-3">
            <p>
              <strong className="text-sm font-medium">{planIntro[selectedPlan]}</strong>
            </p>
            <ul className="space-y-2 text-sm text-muted-foreground">
              {selectedPlan === 'free' && (
                <>
                  <li className="flex gap-2">
                    <CheckIcon
                      aria-hidden="true"
                      className="text-primary mt-0.5 shrink-0"
                      size={16}
                      strokeWidth={2}
                    />
                    250 feedbacks monthly
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon
                      aria-hidden="true"
                      className="text-primary mt-0.5 shrink-0"
                      size={16}
                      strokeWidth={2}
                    />
                    Daily limit of 25 feedbacks
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon
                      aria-hidden="true"
                      className="text-primary mt-0.5 shrink-0"
                      size={16}
                      strokeWidth={2}
                    />
                    1,000 contacts limit
                  </li>
                </>
              )}
              {selectedPlan === 'plus' && (
                <>
                  <li className="flex gap-2">
                    <CheckIcon
                      aria-hidden="true"
                      className="text-primary mt-0.5 shrink-0"
                      size={16}
                      strokeWidth={2}
                    />
                    2,500 feedbacks per month
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon
                      aria-hidden="true"
                      className="text-primary mt-0.5 shrink-0"
                      size={16}
                      strokeWidth={2}
                    />
                    No daily limits
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon
                      aria-hidden="true"
                      className="text-primary mt-0.5 shrink-0"
                      size={16}
                      strokeWidth={2}
                    />
                    5,000 contacts
                  </li>
                </>
              )}
              {selectedPlan === 'pro' && (
                <>
                  <li className="flex gap-2">
                    <CheckIcon
                      aria-hidden="true"
                      className="text-primary mt-0.5 shrink-0"
                      size={16}
                      strokeWidth={2}
                    />
                    10,000 feedbacks per month
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon
                      aria-hidden="true"
                      className="text-primary mt-0.5 shrink-0"
                      size={16}
                      strokeWidth={2}
                    />
                    Overage billed at $0.01/feedback
                  </li>
                  <li className="flex gap-2">
                    <CheckIcon
                      aria-hidden="true"
                      className="text-primary mt-0.5 shrink-0"
                      size={16}
                      strokeWidth={2}
                    />
                    Unlimited contacts
                  </li>
                </>
              )}
            </ul>
          </div>

          <div className="grid gap-2">
            <Button
              className="w-full"
              disabled={currentPlan === selectedPlan}
              loading={isLoading}
              onClick={() => {
                void onUpgrade(selectedPlan);
              }}
              type="button"
            >
              {currentPlan === selectedPlan ? 'Your current plan' : 'Change plan'}
            </Button>
            <DialogClose asChild>
              <Button className="w-full" type="button" variant="ghost">
                Cancel
              </Button>
            </DialogClose>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
