import { cn } from '@remark/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import type * as React from 'react';

const alertVariants = cva('relative rounded-lg border', {
  defaultVariants: {
    size: 'sm',
    variant: 'default',
  },
  variants: {
    size: {
      lg: 'p-4',
      sm: 'px-4 py-3',
    },
    variant: {
      default: 'border-border bg-card text-card-foreground',
      error: 'border-red-500/50 text-red-600',
      warning: 'border-amber-500/50 text-amber-600',
    },
  },
});

interface AlertProps
  extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof alertVariants> {
  action?: React.ReactNode;
  icon?: React.ReactNode;
  layout?: 'complex' | 'row';
}

function Alert({
  action,
  children,
  className,
  icon,
  layout = 'row',
  size,
  variant,
  ...props
}: AlertProps) {
  return (
    <div
      className={cn(
        alertVariants({
          size,
          variant,
        }),
        className,
      )}
      data-slot="alert"
      role="alert"
      {...props}
    >
      {layout === 'row' ? (
        // Single line variant
        <div className="flex items-center gap-2">
          <div className="flex grow items-center">
            {icon && <span className="me-3 inline-flex">{icon}</span>}
            {children}
          </div>
          {action && <div className="flex shrink-0 items-center">{action}</div>}
        </div>
      ) : (
        // Multi-line variant
        <div className="flex gap-2">
          {icon && children ? (
            <div className="flex grow gap-3">
              <span className="mt-0.5 shrink-0">{icon}</span>
              <div className="grow">{children}</div>
            </div>
          ) : (
            <div className="grow">
              {icon && <span className="me-3 inline-flex">{icon}</span>}
              {children}
            </div>
          )}
          {action && <div className="shrink-0">{action}</div>}
        </div>
      )}
    </div>
  );
}

function AlertDescription({ className, ...props }: React.ComponentProps<'div'>) {
  return (
    <div
      className={cn('text-muted-foreground text-sm', className)}
      data-slot="alert-description"
      {...props}
    />
  );
}

export { Alert, AlertDescription };
