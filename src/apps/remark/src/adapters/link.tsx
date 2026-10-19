import type { AnchorHTMLAttributes } from 'react';

import { navigate } from './navigation';

export default function Link({
  children,
  href = '',
  onClick,
  ...props
}: AnchorHTMLAttributes<HTMLAnchorElement>) {
  if (isExternalHref(href)) {
    const { className, id, style, title } = props;
    return (
      <span className={className} id={id} style={style} title={title}>
        {children}
      </span>
    );
  }

  const local = href.startsWith('/');
  return (
    <a
      {...props}
      href={local ? `#${href}` : href}
      onClick={(event) => {
        onClick?.(event);
        if (
          event.defaultPrevented ||
          !local ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey ||
          event.button !== 0
        )
          return;
        event.preventDefault();
        navigate(href);
      }}
    >
      {children}
    </a>
  );
}

const offsitePaths = ['/terms', '/notice'];

function isExternalHref(href: string) {
  return (
    /^(?:[a-z][a-z\d+.-]*:|\/\/)/i.test(href) ||
    offsitePaths.some((path) => href === path || href.startsWith(`${path}/`))
  );
}
