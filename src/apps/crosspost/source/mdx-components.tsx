type MDXComponents = Record<string, any>;
type Route = string;
const Link = 'a';
import type { ComponentProps } from 'react';

import { ArrowUpRightIcon } from './components/ui/icons';

export function getMDXComponents(): MDXComponents {
  return {
    a: ({ children, href, ...props }: ComponentProps<'a'>) => (
      <Link
        className="inline cursor-pointer align-baseline underline decoration-foreground/50 decoration-dotted decoration-1 underline-offset-4 transition-none"
        href={href}
        rel="noreferrer"
        target="_blank"
        {...props}
      >
        {children}
        <span className="mb-1 ml-px inline-block size-3 align-middle">
          <ArrowUpRightIcon className="scale-125" strokeWidth={1.75} />
        </span>
      </Link>
    ),
    h1: ({ children, ...props }: ComponentProps<'h1'>) => (
      <h1 className="mt-4 mb-2 text-2xl font-semibold" {...props}>
        {children}
      </h1>
    ),
    h2: ({ children, ...props }: ComponentProps<'h2'>) => (
      <h2 className="mt-4 mb-1 text-xl font-semibold" {...props}>
        {children}
      </h2>
    ),
    h3: ({ children, ...props }: ComponentProps<'h3'>) => (
      <h3 className="mt-4 mb-1 text-lg font-semibold" {...props}>
        {children}
      </h3>
    ),
    h4: ({ children, ...props }: ComponentProps<'h4'>) => (
      <h4 className="mt-4 mb-1 text-base font-semibold" {...props}>
        {children}
      </h4>
    ),
    h5: ({ children, ...props }: ComponentProps<'h5'>) => (
      <h5 className="mt-4 mb-1 text-sm font-semibold" {...props}>
        {children}
      </h5>
    ),
    h6: ({ children, ...props }: ComponentProps<'h6'>) => (
      <h6 className="mt-4 mb-1 text-xs font-semibold" {...props}>
        {children}
      </h6>
    ),
    hr: ({ children, ...props }: ComponentProps<'hr'>) => (
      <hr className="my-7 border-border" {...props} />
    ),
    li: ({ children, ...props }: ComponentProps<'li'>) => (
      <li className="list-item pl-1.5 leading-7 marker:font-semibold" {...props}>
        {children}
      </li>
    ),
    ol: ({ children, ...props }: ComponentProps<'ol'>) => (
      <ol className="list-decimal pl-7" {...props}>
        {children}
      </ol>
    ),
    p: ({ children, ...props }: ComponentProps<'p'>) => (
      <p className="mt-2 text-base leading-7 [p]:mb-1 [p+p]:my-4" {...props}>
        {children}
      </p>
    ),
    table: ({ children, ...props }: ComponentProps<'table'>) => (
      <table className="max-w-(--chat-content-max-width)" {...props}>
        {children}
      </table>
    ),
    td: ({ children, ...props }: ComponentProps<'td'>) => (
      <td className="py-2.5 align-baseline text-sm/6 not-first:pl-2 not-last:pr-6" {...props}>
        {children}
      </td>
    ),
    th: ({ children, ...props }: ComponentProps<'th'>) => (
      <th
        className="max-w-[calc(var(--chat-content-max-width)*6/24)] min-w-[calc(var(--chat-content-max-width)*4/24)] py-2 text-left text-sm/4 whitespace-nowrap not-first:pl-2 not-last:pr-6 [&>strong]:font-semibold"
        {...props}
      >
        {children}
      </th>
    ),
    tr: ({ children, ...props }: ComponentProps<'tr'>) => (
      <tr className="border-border/70 not-last:border-b last:[&>td]:pb-6" {...props}>
        {children}
      </tr>
    ),
    ul: ({ children, ...props }: ComponentProps<'ul'>) => (
      <ul className="list-disc pl-7" {...props}>
        {children}
      </ul>
    ),
  };
}
