'use client';

import Link from '@remark/adapters/link';
import { Button } from '@remark/components/ui/Button';
import React from 'react';

import { CircleArrow } from './CircleArrow';
import { FadeIn } from './FadeIn';

export function HeaderAuthButtons({ isSignedIn }: { isSignedIn: boolean }) {
  const [isHovering, setIsHovering] = React.useState(false);

  return (
    <>
      {isSignedIn ? (
        <FadeIn className="hidden items-center gap-x-6 md:inline-flex">
          <Button asChild className="rounded-lg" size="sm" variant="outline">
            <Link href="/">Dashboard</Link>
          </Button>
        </FadeIn>
      ) : (
        <FadeIn className="hidden items-center gap-x-6 md:inline-flex">
          <Button
            asChild
            className="not-hover:text-muted-foreground"
            onMouseEnter={() => {
              setIsHovering(true);
            }}
            onMouseLeave={() => {
              setIsHovering(false);
            }}
            variant="link"
          >
            <Link href="/sign-in">
              Sign In <CircleArrow direction="up-right" isHovering={isHovering} variant="outline" />
            </Link>
          </Button>
          <Button asChild className="rounded-lg" size="sm">
            <Link href="/sign-up">Create Account</Link>
          </Button>
        </FadeIn>
      )}
    </>
  );
}
