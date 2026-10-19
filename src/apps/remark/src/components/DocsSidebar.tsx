'use client';

import Link from '@remark/adapters/link';
import { usePathname } from '@remark/adapters/navigation';
import { cn } from '@remark/lib/utils';
import { ChevronRightIcon } from 'lucide-react';
import {
  type Transition,
  type Variants,
  motion,
  useMotionValueEvent,
  useScroll,
} from 'motion/react';
import React from 'react';

interface Item {
  href: string;
  items?: Item[];
  title: string;
}

interface Section {
  items: Item[];
  title: string;
}

// Navigation structure with nested items support
// Each section can have items, and items can have nested items
const items: Section[] = [
  {
    items: [
      {
        href: '/docs',
        title: 'Introduction',
      },
    ],
    title: 'Documentation',
  },
  {
    items: [
      {
        href: '/docs/node',
        items: [
          {
            href: '/docs/next',
            title: 'Next.js',
          },
        ],
        title: 'Node.js',
      },
    ],
    title: 'Quickstart',
  },
];

// For expandable items
const variants: Variants = {
  closed: {
    height: 0,
    opacity: 0,
  },
  open: {
    height: 'auto',
    opacity: 1,
  },
};

// For expandable items
const transition: Transition = {
  damping: 25,
  mass: 0.5,
  restDelta: 0.01,
  stiffness: 250,
  type: 'spring',
};

export function DocsSidebar() {
  const pathname = usePathname();
  const { scrollY } = useScroll();
  const [hasScrolled, setHasScrolled] = React.useState(false);
  const [open, setOpen] = React.useState<Record<string, boolean>>({});

  // Track scroll position for header-aware positioning
  useMotionValueEvent(scrollY, 'change', (current) => {
    setHasScrolled(current > 0);
  });

  const handleOpen = (href: string) => {
    setOpen((prev) => ({
      ...prev,
      [href]: !prev[href],
    }));
  };

  // Handle click events with special case for expandable items
  // Prevents navigation when clicking on an expandable item that's already active
  const handleClick = (
    href: string,
    event: React.MouseEvent<HTMLAnchorElement>,
    hasItems: boolean,
  ) => {
    if (href === pathname && hasItems) {
      event.preventDefault();
      handleOpen(href);
    }
  };

  // Init and maintain open states based on current path
  // Ensures correct section is expanded when navigating directly to a nested page
  const [syncedPathname, setSyncedPathname] = React.useState<string>();
  if (syncedPathname !== pathname) {
    setSyncedPathname(pathname);
    setOpen((prevOpen) => {
      const newOpen = { ...prevOpen }; // Preserve existing open states

      const checkItems = (items: Item[], parentHref?: string) => {
        for (const item of items) {
          if (item.href) {
            // If this is the current path, mark it and its parent as open
            if (item.href === pathname) {
              newOpen[item.href] = true;
              if (parentHref) {
                newOpen[parentHref] = true;
              }
            }
          }
          if (item.items) {
            // Pass the current item's href as parent to its children
            checkItems(item.items, item.href);
          }
        }
      };

      for (const section of items) {
        checkItems(section.items);
      }

      return newOpen;
    });
  }

  return (
    <motion.aside
      // Dynamic positioning based on scroll state
      animate={{ '--not-translate-y': hasScrolled ? '24px' : '0px' }}
      className="sticky top-20 h-full max-h-[calc(100vh-var(--header-height)+var(--not-translate-y))] [--header-height:--spacing(14)] max-md:hidden"
      transition={{
        bounce: 0,
        duration: 0.45,
        type: 'spring',
      }}
    >
      <div className="relative h-full">
        <motion.div
          // Smooth scroll-aware positioning
          animate={{ '--translate-y': hasScrolled ? '0px' : '24px' }}
          className="relative h-full scrollbar-none overflow-y-scroll pt-17.5 pb-10 after:pointer-events-none after:absolute after:inset-x-0 after:bottom-0 after:block after:h-10 after:w-full after:bg-[linear-gradient(transparent,var(--color-background))] after:content-['']"
          transition={{
            bounce: 0,
            duration: 0.45,
            type: 'spring',
          }}
        >
          <nav className="relative block w-full p-0 select-none">
            {items.map(({ items, title }) => (
              <div className="group/section" key={title}>
                <p className="mb-2 text-sm/4 font-medium">{title}</p>
                <ul className="group-not-last/section:pb-6">
                  {items.map(({ href, items, title }) => (
                    <li className="relative" key={title}>
                      <span>
                        <Link
                          className={cn(
                            'inline-flex w-full items-center py-1.5 text-sm opacity-40 transition-[opacity,font-weight] duration-200 hover:opacity-70 data-[active=true]:font-medium data-[active=true]:opacity-100 dark:opacity-50 dark:hover:opacity-70 dark:data-[active=true]:opacity-100',
                          )}
                          data-active={href === pathname}
                          href={href}
                          onClick={(event) => {
                            handleClick(href, event, Boolean(items));
                          }}
                        >
                          {title}
                        </Link>

                        {items && (
                          <button
                            className="group/button absolute inset-0 left-auto flex size-8 cursor-pointer items-center justify-center rounded-full opacity-40 transition-opacity hover:opacity-70 data-[open=true]:opacity-100 dark:opacity-50 dark:hover:opacity-70 dark:data-[open=true]:opacity-100"
                            data-open={open[href]}
                            onClick={() => {
                              handleOpen(href);
                            }}
                            type="button"
                          >
                            <ChevronRightIcon
                              className="transition-transform duration-200 group-data-[open=true]/button:scale-110 group-data-[open=true]/button:rotate-90"
                              size={16}
                            />
                          </button>
                        )}
                      </span>

                      {items && (
                        <motion.ul
                          animate={open[href] ? 'open' : 'closed'}
                          className="overflow-hidden pl-5"
                          initial={false}
                          transition={transition}
                          variants={variants}
                        >
                          {items.map(({ href, title }) => (
                            <li key={title}>
                              <Link
                                className={cn(
                                  'inline-flex w-full items-center gap-2.5 py-1.5 text-sm',
                                )}
                                href={href}
                              >
                                <span
                                  className="opacity-40 transition-[opacity,font-weight] duration-200 hover:opacity-70 data-[active=true]:font-medium data-[active=true]:opacity-100 dark:opacity-50 dark:hover:opacity-70 dark:data-[active=true]:opacity-100"
                                  data-active={href === pathname}
                                >
                                  {title}
                                </span>
                              </Link>
                            </li>
                          ))}
                        </motion.ul>
                      )}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </nav>
        </motion.div>
      </div>
    </motion.aside>
  );
}
