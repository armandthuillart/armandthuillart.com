import { cn } from '@remark/lib/utils';
import type { LucideIcon } from 'lucide-react';

export function PageIcon({ Icon, size }: { Icon: LucideIcon; size: 'lg' | 'md' }) {
  return (
    <>
      <div
        className={cn(
          'bg-primary/2.5 shrink-0 border',
          size === 'lg' ? 'size-20 rounded-2xl p-1.5' : 'size-8 rounded-lg p-0.5',
        )}
      >
        <div
          className={cn(
            'bg-background flex size-full items-center justify-center border',
            size === 'lg' ? 'rounded-xl' : 'rounded-md',
          )}
        >
          <Icon className="opacity-80" size={size === 'lg' ? 40 : 14} />
        </div>
      </div>
    </>
  );
}
