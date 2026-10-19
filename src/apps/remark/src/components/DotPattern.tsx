import { cn } from '@remark/lib/utils';
import { useId } from 'react';

interface DotPatternProps {
  [key: string]: unknown;
  className?: string;
  cr?: number;
  cx?: number;
  cy?: number;
  height?: number;
  width?: number;
  x?: number;
  y?: number;
}

export function DotPattern({
  className,
  cr = 0.5,
  cx = 1,
  cy = 0.5,
  height = 16,
  width = 16,
  x = 0,
  y = 0,
  ...props
}: DotPatternProps) {
  const id = useId();

  return (
    <svg
      className={cn('fill-foreground/10 pointer-events-none absolute inset-0 size-full', className)}
      {...props}
    >
      <defs>
        <pattern
          height={height}
          id={id}
          patternContentUnits="userSpaceOnUse"
          patternUnits="userSpaceOnUse"
          width={width}
          x={x}
          y={y}
        >
          <circle cx={cx} cy={cy} id="pattern-circle" r={cr} />
        </pattern>
      </defs>
      <rect fill={`url(#${id})`} height="100%" strokeWidth={0} width="100%" />
    </svg>
  );
}
