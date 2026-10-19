'use client';

import Link from '@remark/adapters/link';
import { Button } from '@remark/components/ui/Button';
import React from 'react';

import { CircleArrow } from './CircleArrow';

export function HeroButtons() {
  const [isHovered1, setIsHovered1] = React.useState(false);
  const [isHovered2, setIsHovered2] = React.useState(false);

  return (
    <div className="flex gap-4 max-[425px]:flex-col">
      <Button
        asChild
        className="group/button h-11 rounded-xl px-6 text-base"
        onMouseEnter={() => {
          setIsHovered1(true);
        }}
        onMouseLeave={() => {
          setIsHovered1(false);
        }}
        variant="outline"
      >
        <Link href="/docs">
          Documentation
          <CircleArrow direction="up-right" isHovering={isHovered1} variant="outline" />
        </Link>
      </Button>

      <Button
        asChild
        className="group/button h-11 rounded-xl px-6 text-base"
        onMouseEnter={() => {
          setIsHovered2(true);
        }}
        onMouseLeave={() => {
          setIsHovered2(false);
        }}
        variant="default"
      >
        <Link href="/sign-up">
          Start Building
          <CircleArrow direction="up-right" isHovering={isHovered2} variant="default" />
        </Link>
      </Button>
    </div>
  );
}
