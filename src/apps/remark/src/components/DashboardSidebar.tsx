'use client';

import Link from '@remark/adapters/link';
import { usePathname } from '@remark/adapters/navigation';
import { Button } from '@remark/components/ui/Button';
import { cn } from '@remark/lib/utils';
import { Inbox, KeyRound, type LucideIcon, Settings2, UserRound, Vote } from 'lucide-react';

import { DesktopDropdownMenu } from './DesktopDropdownMenu';
import { Logo } from './Logo';

interface Item {
  href: string;
  Icon: LucideIcon;
  label: string;
}

function NavItem({ href, Icon, label }: Item) {
  const pathname = usePathname();
  const isActive = href === '/' ? pathname === '/' : pathname.startsWith(href);

  return (
    <Button
      asChild
      className={cn(
        'group hover:bg-sidebar-accent w-full justify-start gap-2 font-normal',
        isActive && 'bg-sidebar-accent text-sidebar-accent-foreground',
      )}
      size="sm"
      variant="ghost"
    >
      <Link href={href}>
        <Icon className="opacity-60" />
        {label}
      </Link>
    </Button>
  );
}

const navItems: Item[] = [
  {
    href: '/',
    Icon: Inbox,
    label: 'Feedbacks',
  },
  {
    href: '/votes',
    Icon: Vote,
    label: 'Votes',
  },
  {
    href: '/contacts',
    Icon: UserRound,
    label: 'Contacts',
  },
  {
    href: '/api-keys',
    Icon: KeyRound,
    label: 'API Keys',
  },
  {
    href: '/settings/usage',
    Icon: Settings2,
    label: 'Settings',
  },
];

export function DashboardSidebar() {
  return (
    <aside className="bg-sidebar hidden h-screen w-3xs shrink-0 flex-col justify-between border-r border-border p-4 md:flex">
      <div className="flex flex-col gap-8">
        <div className="ml-2 flex h-8 items-center">
          <Link href="/">
            <Logo.Remark height={24} />
          </Link>
        </div>

        <ul className="flex flex-col gap-2">
          {navItems.map((item) => (
            <li key={item.href}>
              <NavItem href={item.href} Icon={item.Icon} label={item.label} />
            </li>
          ))}
        </ul>
      </div>

      <DesktopDropdownMenu />
    </aside>
  );
}
