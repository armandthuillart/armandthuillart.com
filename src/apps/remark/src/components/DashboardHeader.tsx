import Link from '@remark/adapters/link';

import { FeedbackPopover } from './FeedbackPopover';

export function DashboardHeader() {
  return (
    <div className="flex h-16 items-center justify-end border-b border-border px-6">
      <div className="hidden items-center gap-6 md:flex">
        <FeedbackPopover />
        <Link
          className="rounded-md text-sm text-muted-foreground hover:text-foreground hover:no-underline"
          href="/docs"
        >
          Documentation
        </Link>
      </div>
    </div>
  );
}
