import Link from '@remark/adapters/link';
import { DISCORD_URL, GITHUB_URL, SUPPORT_EMAIL, X_URL, YOUTUBE_URL } from '@remark/lib/constants';

import { Logo } from './Logo';

export function SiteFooter() {
  return (
    <footer className="relative pt-24 pb-12">
      <div className="container">
        <div className="flex flex-wrap justify-between gap-x-24 gap-y-12">
          <Link className="h-fit transition-opacity hover:opacity-80" href="/home">
            <Logo.Remark height={24} />
          </Link>
          <FooterMenu />
        </div>
        <div className="mt-16 flex flex-wrap-reverse items-center justify-between gap-x-12 gap-y-6">
          <FooterCopyright />
          <FooterSocial />
        </div>
      </div>
    </footer>
  );
}

const currentYear = new Date().getFullYear();

function FooterCopyright() {
  return <p className="text-sm text-muted-foreground">&copy; {currentYear} All rights reserved.</p>;
}

function FooterMenu() {
  return (
    <ul className="flex flex-wrap gap-x-24 gap-y-12">
      {menuItems.map(({ items, label }) => (
        <li key={label}>
          <h3 className="text-sm font-medium">{label}</h3>
          <ul>
            {items.map(({ href, label }) => (
              <li key={label}>
                <Link
                  className="mt-4 block text-sm transition-colors not-hover:text-muted-foreground"
                  href={href}
                >
                  {label}
                </Link>
              </li>
            ))}
          </ul>
        </li>
      ))}
    </ul>
  );
}

function FooterSocial() {
  return (
    <ul className="flex items-center gap-x-6">
      {socialItems.map(({ href, Icon, label }) => (
        <li key={label}>
          <Link className="group text-muted-foreground transition-colors" href={href}>
            <span className="sr-only">{label}</span>
            <Icon className="group-not-[&:hover]:*:first:fill-muted-foreground" size={18} />
          </Link>
        </li>
      ))}
    </ul>
  );
}

const menuItems = [
  {
    items: [
      {
        href: '/docs',
        label: 'Docs',
      },
    ],
    label: 'Developers',
  },
  {
    items: [
      {
        href: '/home#faqs',
        label: 'FAQs',
      },
    ],
    label: 'Resources',
  },
  {
    items: [
      {
        href: `mailto:${SUPPORT_EMAIL}`,
        label: 'Contact',
      },
      {
        href: '/notice',
        label: 'Notice',
      },
      {
        href: '/terms',
        label: 'Terms',
      },
    ],
    label: 'Company',
  },
];

const socialItems = [
  {
    href: X_URL,
    Icon: Logo.X,
    label: 'X',
  },
  {
    href: GITHUB_URL,
    Icon: Logo.GitHub,
    label: 'GitHub',
  },
  {
    href: DISCORD_URL,
    Icon: Logo.Discord,
    label: 'Discord',
  },
  {
    href: YOUTUBE_URL,
    Icon: Logo.YouTube,
    label: 'YouTube',
  },
];
