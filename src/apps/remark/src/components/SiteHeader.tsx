import Link from '@remark/adapters/link';

import { AppIconLink } from './AppIcon';
import { HeaderEndContent } from './HeaderEndContent';
import { HeaderLayout } from './HeaderLayout';
import { Logo } from './Logo';

export function SiteHeader({ startContent }: { startContent?: React.ReactNode }) {
  const hasStartContent = Boolean(startContent);

  return (
    <HeaderLayout>
      <header className="container">
        <div className="py-1 md:pt-6 md:pb-0">
          <div className="flex h-14 items-center justify-between">
            {hasStartContent ? (
              <div className="inline-flex items-center gap-x-2.5">
                <Link href="/home">
                  <Logo.Remark height={24} />
                </Link>
                {startContent}
              </div>
            ) : (
              <AppIconLink />
            )}
            <HeaderEndContent />
          </div>
        </div>
      </header>
    </HeaderLayout>
  );
}
