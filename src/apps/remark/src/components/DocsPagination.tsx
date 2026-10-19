'use client';

import Link from '@remark/adapters/link';
import React from 'react';

import { CircleArrow } from './CircleArrow';

function PaginationGroup({ children }: { children: React.ReactNode }) {
  return <div className="flex gap-6">{children}</div>;
}

function PaginationNext({ href, label }: { href: string; label: string }) {
  const [isHovering, setIsHovering] = React.useState(false);

  return (
    <Link
      className="group/button block w-full flex-col rounded-lg bg-background px-5 py-4 text-foreground shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.02)] transition-[100ms] select-none hover:bg-foreground/2.5 hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_1px_2px_rgba(255,255,255,0.02)] dark:hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_2px_6px_rgba(255,255,255,0.03)]"
      href={href}
      onMouseEnter={() => {
        setIsHovering(true);
      }}
      onMouseLeave={() => {
        setIsHovering(false);
      }}
    >
      <div className="flex flex-col items-end gap-1">
        <div className="inline-flex items-center gap-1 text-muted-foreground">
          <span className="text-xs">Next</span>
          <CircleArrow direction="right" isHovering={isHovering} variant="outline" />
        </div>
        <div className="text-sm">{label}</div>
      </div>
    </Link>
  );
}

function PaginationPrevious({ href, label }: { href: string; label: string }) {
  const [isHovering, setIsHovering] = React.useState(false);

  return (
    <Link
      className="group/button block w-full flex-col rounded-lg bg-background px-5 py-4 text-foreground shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.02)] transition-[100ms] select-none hover:bg-foreground/2.5 hover:shadow-[inset_0_0_0_1px_rgba(0,0,0,0.1),0_2px_6px_rgba(0,0,0,0.03)] dark:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_1px_2px_rgba(255,255,255,0.02)] dark:hover:shadow-[inset_0_0_0_1px_rgba(255,255,255,0.1),0_2px_6px_rgba(255,255,255,0.03)]"
      href={href}
      onMouseEnter={() => {
        setIsHovering(true);
      }}
      onMouseLeave={() => {
        setIsHovering(false);
      }}
    >
      <div className="flex flex-col gap-1">
        <div className="inline-flex items-center gap-1 text-muted-foreground">
          <CircleArrow direction="left" isHovering={isHovering} variant="outline" />
          <span className="text-xs">Previous</span>
        </div>
        <div className="text-sm">{label}</div>
      </div>
    </Link>
  );
}

export { PaginationGroup, PaginationNext, PaginationPrevious };
