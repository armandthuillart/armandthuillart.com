import Link from '@remark/adapters/link';
import { cn } from '@remark/lib/utils';
import React from 'react';

import { CodeExample } from './CodeExample';

export { PaginationGroup, PaginationNext, PaginationPrevious } from './DocsPagination';

const linkClassName =
  'group/link w-fit whitespace-nowrap text-neutral-950 underline decoration-neutral-300 underline-offset-5 transition-[color,text-decoration-color] duration-150 ease-[cubic-bezier(0.25,0.46,0.45,0.94)] hover:decoration-current dark:text-neutral-50 dark:decoration-neutral-600 dark:hover:decoration-current';

export function A({ children, href = '', ...props }: React.ComponentPropsWithoutRef<'a'>) {
  return (
    <Link className={cn(linkClassName)} href={href} {...props}>
      {children}
    </Link>
  );
}

export function Code(props: React.ComponentPropsWithoutRef<'code'>) {
  return (
    <code
      className="font-mono text-sm/6 font-semibold text-neutral-950 dark:text-neutral-50"
      {...props}
    />
  );
}

export function H1(props: React.ComponentPropsWithoutRef<'h1'>) {
  return (
    <h1
      className="mb-12 border-b pb-3 text-2xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
      {...props}
    />
  );
}

export function H2(props: React.ComponentPropsWithoutRef<'h2'>) {
  return (
    <h2
      className="mt-16 mb-6 text-xl font-semibold tracking-tight text-neutral-950 dark:text-neutral-50"
      {...props}
    />
  );
}

export function Hr(props: React.ComponentPropsWithoutRef<'hr'>) {
  return <hr {...props} className="my-12 bg-border" />;
}

export function Li(props: React.ComponentPropsWithoutRef<'li'>) {
  return <li {...props} className="my-2 text-neutral-700 dark:text-neutral-300" />;
}

export function LinkableCard({
  children,
  description,
  href,
  title,
}: {
  children: React.ReactNode;
  description?: string;
  href: string;
  title: string;
}) {
  return (
    <Link
      className="group/card transition-200 relative inline cursor-pointer text-inherit no-underline ease-out"
      href={href}
    >
      <div
        className={cn(
          'text-muted-foreground group-hover/card:bg-foreground/2.5 relative flex size-full flex-col gap-4 overflow-hidden rounded-lg rounded-tr-3xl px-4 pt-5 pb-4 leading-loose shadow-[inset_0_0_0_1px_var(--color-border)] transition-[180ms] select-none group-hover/card:rounded-tr-[2.25rem]',
          "before:bg-background before:absolute before:top-0 before:right-0 before:z-3 before:size-7.5 before:translate-x-1/2 before:-translate-y-1/2 before:rotate-45 before:shadow-[0_1px_0_0_var(--color-border)] before:transition-[inherit] before:content-[''] group-hover/card:before:size-10.5 group-hover/card:before:translate-x-1/2 group-hover/card:before:-translate-y-1/2 group-hover/card:before:rotate-45",
          "after:bg-foreground/2.5 after:absolute after:top-0 after:right-0 after:z-2 after:size-7 after:translate-x-2 after:-translate-y-2 after:rounded-bl-md after:shadow-[-1px_1px_0_0_var(--color-border)] after:transition-[inherit] after:content-[''] group-hover/card:after:translate-x-0 group-hover/card:after:translate-y-0",
        )}
      >
        {children}
        <div className="flex flex-col gap-2">
          <h3 className="text-base font-medium text-foreground">{title}</h3>
          {description && <p className="text-sm">{description}</p>}
        </div>
      </div>
    </Link>
  );
}

export function LinkableCardGroup({ children }: { children: React.ReactNode }) {
  return <div className="grid w-full gap-6 md:grid-cols-2">{children}</div>;
}

export function P(props: React.ComponentPropsWithoutRef<'p'>) {
  return <p className="mb-5 text-base/relaxed text-neutral-700 dark:text-neutral-300" {...props} />;
}

export function Pre({ code, filename, lang }: { code: string; filename?: string; lang: string }) {
  return (
    <div>
      <CodeExample
        example={{
          code,
          lang,
        }}
        filename={filename}
      />
    </div>
  );
}

export function Ul(props: React.ComponentPropsWithoutRef<'ul'>) {
  return (
    <ul
      {...props}
      className="my-5 list-disc pl-6 [&_li]:pl-1.5 [&_li]:text-base/relaxed [&_li]:marker:text-muted-foreground"
    />
  );
}
