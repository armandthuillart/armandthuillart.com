'use client';

import Link from '@remark/adapters/link';
import { Button } from '@remark/components/ui/Button';
import { SUPPORT_EMAIL } from '@remark/lib/constants';
import React from 'react';

import { CircleArrow } from './CircleArrow';

export function ContactUsButton() {
  const [isHovering, setIsHovering] = React.useState(false);

  return (
    <Button
      asChild
      className="text-base not-hover:text-muted-foreground"
      onMouseEnter={() => {
        setIsHovering(true);
      }}
      onMouseLeave={() => {
        setIsHovering(false);
      }}
      variant="link"
    >
      <Link href={`mailto:${SUPPORT_EMAIL}`}>
        Contact us
        <CircleArrow direction="up-right" isHovering={isHovering} variant="outline" />
      </Link>
    </Button>
  );
}
