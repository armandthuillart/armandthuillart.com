'use client';

import type { HTMLAttributes } from 'react';

import { cn } from '../../lib/utils';
import { Button, type ButtonProps } from '../ui/button';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

type ActionsProps = HTMLAttributes<HTMLDivElement>;

function Action({ tooltip, children, className, ...props }: ButtonProps & { tooltip: string }) {
  return (
    <Tooltip>
      <TooltipTrigger asChild>
        <Button
          className={cn('size-8 [&>svg]:size-4', className)}
          size="icon"
          variant="ghost"
          {...props}
        >
          {children}
        </Button>
      </TooltipTrigger>
      <TooltipContent side="bottom">{tooltip}</TooltipContent>
    </Tooltip>
  );
}

function Actions({ children, className, ...props }: ActionsProps) {
  return (
    <div
      className={cn(
        'group-not-data-user/message:-ml-1 group-data-user/message:-mr-1 flex p-1 group-data-user/message:justify-end group-data-user/message:has-focus-visible:opacity-100 group-data-user/message:md:opacity-0 group-data-user/message:md:hover:opacity-100',
        className,
      )}
      {...props}
    >
      <TooltipProvider>{children}</TooltipProvider>
    </div>
  );
}

export { Action, Actions };
