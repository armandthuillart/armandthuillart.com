'use client';

import Link from '@remark/adapters/link';
import { Button } from '@remark/components/ui/Button';
import React from 'react';

import { CircleArrow } from './CircleArrow';

export function FeaturesButton() {
  const [isHovering, setIsHovering] = React.useState(false);

  return (
    <Button
      asChild
      className="group/button shrink-0 self-start rounded-lg"
      onMouseEnter={() => {
        setIsHovering(true);
      }}
      onMouseLeave={() => {
        setIsHovering(false);
      }}
      size="sm"
      variant="outline"
    >
      <Link href="https://bundlephobia.com/package/@remark-sh/sdk">
        Check it out
        <CircleArrow direction="up-right" isHovering={isHovering} variant="outline" />
      </Link>
    </Button>
  );
}
