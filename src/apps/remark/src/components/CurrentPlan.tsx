'use client';

import { Badge } from '@remark/components/ui/Badge';
import { Button } from '@remark/components/ui/Button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@remark/components/ui/Card';
import { authClient } from '@remark/lib/auth-client';
import { APP_NAME } from '@remark/lib/constants';
import type { SubscriptionSlug } from '@remark/lib/schema';
import { capitalizeFirstLetter } from '@remark/lib/utils';
import { format } from 'date-fns';
import { Calendar } from 'lucide-react';
import React from 'react';

import { CircleArrow } from './CircleArrow';
import { TextShimmer } from './TextShimmer';

export function CurrentPlan({
  cancelAtPeriodEnd,
  currentPeriodEnd,
  slug,
  startedAt,
}: {
  cancelAtPeriodEnd: boolean;
  currentPeriodEnd: Date;
  slug: SubscriptionSlug;
  startedAt: Date;
}) {
  const [isLoading, setIsLoading] = React.useState<'cancel' | 'portal' | null>(null);
  const [isHovering, setIsHovering] = React.useState(false);

  async function handlePortal(from: 'cancel' | 'portal') {
    setIsLoading(from);
    await authClient.customer.portal();
    setIsLoading(null);
  }

  return (
    <Card className="gap-4 py-5">
      <CardHeader>
        <CardTitle className="flex justify-between text-lg">
          <TextShimmer>{`${APP_NAME} ${capitalizeFirstLetter(slug)}`}</TextShimmer>
          <Badge
            className="justify-self-end rounded-full font-normal tracking-normal"
            variant="outline"
          >
            Joined on {format(startedAt, 'd MMM yyyy')}
          </Badge>
        </CardTitle>
        <CardDescription className="flex items-center gap-2">
          <Calendar className="opacity-80" size={16} />
          {cancelAtPeriodEnd
            ? `Your subscription will end on ${format(currentPeriodEnd, 'd MMMM yyyy')}.`
            : `Next payment on ${format(currentPeriodEnd, 'd MMMM yyyy')}.`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <hr className="border-t border-dashed" />
        <div></div>
      </CardContent>
      <CardFooter className="justify-between">
        <Button
          loading={isLoading === 'portal'}
          onClick={() => {
            void handlePortal('portal');
          }}
          variant="outline"
        >
          Manage subscription
        </Button>

        <Button
          className="has-[>svg:is(.loading)]:[&_svg]:first:text-destructive group not-hover:text-destructive/80 text-destructive"
          loading={isLoading === 'cancel'}
          onClick={() => {
            void handlePortal('cancel');
          }}
          onMouseEnter={() => {
            setIsHovering(true);
          }}
          onMouseLeave={() => {
            setIsHovering(false);
          }}
          variant="link"
        >
          Cancel plan
          <CircleArrow direction="up-right" isHovering={isHovering} variant="destructive" />
        </Button>
      </CardFooter>
    </Card>
  );
}
