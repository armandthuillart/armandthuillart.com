import { cn } from '@remark/lib/utils';
import type { ReactNode } from 'react';

interface PageTitleProps {
  description?: string;
  endContent?: ReactNode;
  title: string;
}

export function PageTitle({ description, endContent, title }: PageTitleProps) {
  const heading = <h1 className="text-3xl font-semibold tracking-tight">{title}</h1>;
  const titleBlock = description ? (
    <>
      {heading}
      <p className="text-sm text-muted-foreground">{description}</p>
    </>
  ) : (
    heading
  );

  return (
    <div className="container">
      <div
        className={cn('py-8', {
          'flex flex-col gap-2': !endContent && description,
          'flex items-center justify-between': endContent,
        })}
      >
        {endContent && description ? (
          <div className="flex flex-col gap-2">{titleBlock}</div>
        ) : (
          titleBlock
        )}

        {endContent}
      </div>
    </div>
  );
}
