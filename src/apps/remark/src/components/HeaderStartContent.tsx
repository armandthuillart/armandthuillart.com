'use client';

import Link from '@remark/adapters/link';
import { usePathname } from '@remark/adapters/navigation';
import { buttonVariants } from '@remark/components/ui/Button';

export function HeaderStartContent() {
  const pathname = usePathname();

  if (pathname.startsWith('/docs')) {
    return (
      <>
        <hr className="h-4 w-px bg-border max-sm:hidden" />
        <Link
          className={buttonVariants({
            className:
              'text-muted-foreground hover:text-foreground inline-flex font-normal hover:no-underline max-sm:hidden',
            variant: 'link',
          })}
          href="/docs"
        >
          Documentation
        </Link>
      </>
    );
  }

  return null;
}
