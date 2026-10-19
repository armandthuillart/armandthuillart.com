import Link from '@remark/adapters/link';
import { APP_NAME } from '@remark/lib/constants';
import { cn } from '@remark/lib/utils';

function AppIcon({ className, variant }: { className?: string; variant?: 'icon' | 'wordmark' }) {
  return (
    <div className="inline-flex h-6 items-center gap-1.5 select-none">
      <span
        className={cn('font-borel h-3.75 text-xl font-medium antialiased select-none', className)}
      >
        {variant === 'icon' ? <>{APP_NAME.toLowerCase()[0]}</> : <>{APP_NAME.toLowerCase()}</>}
      </span>
    </div>
  );
}

function AppIconLink({ className }: { className?: string }) {
  return (
    <Link className={cn('flex transition-opacity hover:opacity-70', className)} href="/home">
      <AppIcon />
    </Link>
  );
}

export { AppIconLink };
