'use client';

import Link from '@remark/adapters/link';
import { usePathname } from '@remark/adapters/navigation';
import { Tabs, TabsList, TabsTrigger } from '@remark/components/ui/Tabs';

export function SettingsTabs() {
  const pathname = usePathname();
  const currentTab = pathname.includes('usage') ? 'usage' : 'billing';

  return (
    <div className="container">
      <Tabs value={currentTab}>
        <TabsList className="bg-transparent">
          <TabsTrigger
            asChild
            className="data-[state=active]:bg-muted data-[state=active]:shadow-none"
            value="usage"
          >
            <Link href="/settings/usage">Usage</Link>
          </TabsTrigger>
          <TabsTrigger
            asChild
            className="data-[state=active]:bg-muted data-[state=active]:shadow-none"
            value="billing"
          >
            <Link href="/settings/billing">Billing</Link>
          </TabsTrigger>
        </TabsList>
      </Tabs>
    </div>
  );
}
