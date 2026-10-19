'use client';

import type { ComponentProps } from 'react';

import { cn } from '../../lib/utils';
import { Button, type ButtonProps } from '../ui/button';
import { SendIcon, StopIcon } from '../ui/icons';
import { Kbd } from '../ui/kbd';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '../ui/tooltip';

function PromptInput({ children, className, ...props }: ComponentProps<'form'>) {
  return (
    <form
      className={cn(
        "group/prompt-input grid grid-cols-[auto_1fr_auto] rounded-4xl bg-muted p-2.5 [grid-template-areas:'left_center_right'] data-expanded:[grid-template-areas:'center_center_center''left_void_right']",
        className,
      )}
      {...props}
    >
      {children}
    </form>
  );
}

function PromptInputStop({ className, ...props }: ButtonProps) {
  return (
    <Button
      className="rounded-full bg-background [grid-area:right] hover:bg-background"
      size="icon"
      type="button"
      variant="secondary"
      {...props}
    >
      <StopIcon className="size-5" />
    </Button>
  );
}

function PromptInputSubmit({ className, ...props }: ButtonProps) {
  return (
    <Button className="rounded-full [grid-area:right]" size="icon" type="submit" {...props}>
      <SendIcon className="size-5" />
    </Button>
  );
}

function PromptInputTextarea({ className, ...props }: ComponentProps<'textarea'>) {
  return (
    <div
      className={cn(
        '-my-2.5 flex min-h-14 w-full px-2.5 [grid-area:center] group-data-expanded/prompt-input:mb-0',
        className,
      )}
    >
      <textarea
        className={cn(
          'my-4 max-h-52 w-full resize-none antialiased outline-none ring-0 placeholder:text-muted-foreground focus-visible:ring-0',
          className,
        )}
        name="prompt"
        rows={1}
        {...props}
      />
    </div>
  );
}

const PromptInputButton = ({
  children,
  className,
  kbd,
  tooltip,
  ...props
}: ButtonProps & { kbd: string; tooltip: string }) => (
  <TooltipProvider>
    <Tooltip>
      <TooltipTrigger className="h-9 [grid-area:left]" {...props}>
        {children}
      </TooltipTrigger>
      <TooltipContent className="flex gap-1.5" side="bottom">
        {tooltip}{' '}
        <Kbd className="!text-primary-foreground !bg-primary-foreground/20 -mr-1 flex !size-4 min-w-auto items-center justify-center rounded">
          {kbd}
        </Kbd>
      </TooltipContent>
    </Tooltip>
  </TooltipProvider>
);

export { PromptInput, PromptInputButton, PromptInputStop, PromptInputSubmit, PromptInputTextarea };
