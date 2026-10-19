import { Button } from '@remark/components/ui/Button';
import { cn } from '@remark/lib/utils';
import type { LucideIcon } from 'lucide-react';
import { createElement } from 'react';

interface EmptyStateProps {
  action?:
    | React.ReactNode
    | {
        isLoading?: boolean;
        label: string;
        onClick: () => void;
      };
  className?: string;
  description: React.ReactNode | string;
  icons?: LucideIcon[];
  title: React.ReactNode | string;
}

const isActionObject = (
  action: EmptyStateProps['action'],
): action is { isLoading?: boolean; label: string; onClick: () => void } => {
  return typeof action === 'object' && action !== null && 'label' in action && 'onClick' in action;
};

export function EmptyState({ action, className, description, icons = [], title }: EmptyStateProps) {
  return (
    <div
      className={cn(
        'group border-border bg-background hover:border-border/80 hover:bg-muted/50 w-full rounded-xl border-2 border-dashed p-14 text-center transition duration-500 hover:duration-200',
        className,
      )}
    >
      <div className="isolate flex justify-center">
        {icons.length === 3 ? (
          <>
            <div className="relative top-1.5 left-2.5 grid size-12 -rotate-6 place-items-center rounded-xl bg-background shadow-lg ring-1 ring-border transition duration-500 group-hover:-translate-x-5 group-hover:-translate-y-0.5 group-hover:-rotate-12 group-hover:duration-200">
              {createElement(icons[0], { className: 'w-6 h-6 text-muted-foreground' })}
            </div>

            <div className="relative z-10 grid size-12 place-items-center rounded-xl bg-background shadow-lg ring-1 ring-border transition duration-500 group-hover:-translate-y-0.5 group-hover:duration-200">
              {createElement(icons[1], { className: 'w-6 h-6 text-muted-foreground' })}
            </div>

            <div className="relative top-1.5 right-2.5 grid size-12 rotate-6 place-items-center rounded-xl bg-background shadow-lg ring-1 ring-border transition duration-500 group-hover:translate-x-5 group-hover:-translate-y-0.5 group-hover:rotate-12 group-hover:duration-200">
              {createElement(icons[2], { className: 'w-6 h-6 text-muted-foreground' })}
            </div>
          </>
        ) : (
          <div className="grid size-12 place-items-center rounded-xl bg-background shadow-lg ring-1 ring-border transition duration-500 group-hover:-translate-y-0.5 group-hover:duration-200">
            {icons[0] && createElement(icons[0], { className: 'w-6 h-6 text-muted-foreground' })}
          </div>
        )}
      </div>

      <h2 className="mt-6 font-medium text-foreground">{title}</h2>

      <p className="mt-1 text-sm whitespace-pre-line text-muted-foreground">{description}</p>

      {action &&
        (typeof action === 'object' && 'type' in action ? (
          action
        ) : (
          <Button
            className="mt-4 shadow-sm active:shadow-none"
            loading={isActionObject(action) ? action.isLoading : undefined}
            onClick={isActionObject(action) ? action.onClick : undefined}
            variant="outline"
          >
            {isActionObject(action) ? action.label : ''}
          </Button>
        ))}
    </div>
  );
}
