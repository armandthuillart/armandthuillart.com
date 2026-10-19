import Link from '@remark/adapters/link';
import { DISCORD_URL, GITHUB_URL, X_URL, YOUTUBE_URL } from '@remark/lib/constants';

import { Logo } from './Logo';

export function DocsFooter() {
  return (
    <footer className="mt-12 flex border-t pt-10 pb-28">
      <div className="flex gap-6">
        {socials.map(({ href, Icon, name }) => (
          <Link
            className="text-muted-foreground transition-colors hover:text-foreground"
            href={href}
            key={name}
          >
            <Icon className="not-hover:*:first:fill-muted-foreground" size={18} />
          </Link>
        ))}
      </div>
    </footer>
  );
}

const socials = [
  {
    href: X_URL,
    Icon: Logo.X,
    name: 'X',
  },
  {
    href: GITHUB_URL,
    Icon: Logo.GitHub,
    name: 'GitHub',
  },
  {
    href: DISCORD_URL,
    Icon: Logo.Discord,
    name: 'Discord',
  },
  {
    href: YOUTUBE_URL,
    Icon: Logo.YouTube,
    name: 'YouTube',
  },
];
