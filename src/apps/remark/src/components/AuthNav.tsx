'use client';

import Link from '@remark/adapters/link';
import { usePathname } from '@remark/adapters/navigation';
import { Button } from '@remark/components/ui/Button';
import React from 'react';

import { CircleArrow } from './CircleArrow';

export function AuthNav() {
  const pathname = usePathname();
  const isSignIn = pathname === '/sign-in';

  const [isHovering, setIsHovering] = React.useState<'left' | 'right' | null>(null);

  return (
    <>
      <Button
        asChild
        className="absolute top-4 left-4 rounded-full text-muted-foreground"
        onMouseEnter={() => {
          setIsHovering('left');
        }}
        onMouseLeave={() => {
          setIsHovering(null);
        }}
        variant="ghost"
      >
        <Link href="/home">
          <CircleArrow direction="left" isHovering={isHovering === 'left'} variant="outline" />
          Home
        </Link>
      </Button>

      <Button
        asChild
        className="absolute top-4 right-4 rounded-full text-muted-foreground"
        onMouseEnter={() => {
          setIsHovering('right');
        }}
        onMouseLeave={() => {
          setIsHovering(null);
        }}
        variant="ghost"
      >
        <Link href={isSignIn ? '/sign-up' : '/sign-in'}>
          Sign {isSignIn ? 'Up' : 'In'}
          <CircleArrow direction="right" isHovering={isHovering === 'right'} variant="outline" />
        </Link>
      </Button>
    </>
  );
}
