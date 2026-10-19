import { useLocation } from '@remark/adapters/navigation';
import { HeaderStartContent } from '@remark/components/HeaderStartContent';
import { SiteFooter } from '@remark/components/SiteFooter';
import { SiteHeader } from '@remark/components/SiteHeader';
import React from 'react';

export default function ProductLayout({ children }: { children: React.ReactNode }) {
  const fragment = useLocation().split('#')[1];

  React.useEffect(() => {
    if (fragment) document.getElementById(fragment)?.scrollIntoView();
    else window.scrollTo(0, 0);
  }, [fragment]);

  return (
    <>
      <SiteHeader startContent={<HeaderStartContent />} />
      {children}
      <SiteFooter />
    </>
  );
}
