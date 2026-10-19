import { APP_NAME } from '@remark/lib/constants';
import { cn } from '@remark/lib/utils';
import { CodeIcon, LockOpenIcon, type LucideIcon, TypeIcon } from 'lucide-react';

import { CodeExample, ts } from './CodeExample';
import { FeaturesButton } from './FeaturesButton';
import { Logo } from './Logo';

interface Feature {
  description: string;
  Icon: LucideIcon;
  title: string;
}

const features: Feature[] = [
  {
    description:
      'Transparency means a lot to us, so our libraries are open-source, ready for you to dive into.',
    Icon: LockOpenIcon,
    title: 'Open-source.',
  },
  {
    description: "You own the UI, the UX, the flow. Not another library's opinionated design.",
    Icon: CodeIcon,
    title: 'Ownership.',
  },
  {
    description: 'Most fast and break nothing with our end-to-end type-safe libraries.',
    Icon: TypeIcon,
    title: 'Type-safe.',
  },
];

export function Features() {
  return (
    <section className="container">
      <div className="space-y-12 py-12 md:py-24">
        <h2 className="text-4xl/14 font-semibold tracking-tight md:px-6">As it should be.</h2>

        {/* Most important features */}
        <div className="grid gap-x-10 gap-y-12 md:grid-cols-2">
          <DocsCard />
          <BundleSizeCard />
        </div>

        {/* Other features */}
        <ul className="space-y-4">
          {features.map(({ description, Icon, title }, index) => {
            const showBorder = index % 2 === 1;
            return (
              <li key={title}>
                <article
                  className={cn(
                    'grid gap-2 px-8 py-7 md:grid-cols-2 md:gap-10 md:py-8',
                    showBorder && 'rounded-2xl border',
                  )}
                >
                  <div className="flex items-center gap-4">
                    <Icon size={32} strokeWidth={1.5} />
                    <h3 className="font-semibold">{title}</h3>
                  </div>
                  <p className="font-medium text-muted-foreground">{description}</p>
                </article>
              </li>
            );
          })}
        </ul>
      </div>
    </section>
  );
}

function DocsCard() {
  return (
    <div className="relative flex h-75 flex-col-reverse overflow-hidden rounded-2xl border p-4 md:p-8">
      <h3 className="self-start text-lg/6 font-medium tracking-[-0.015em] [&_span]:opacity-50">
        Clear and comprehensive docs. <span>Developer documentation the way it should be.</span>
      </h3>
      <div className="absolute inset-0 -z-1 bg-linear-to-t from-background from-20% to-transparent" />
      <div className="-z-2 flex flex-col items-start gap-6 overflow-hidden rounded-xl border border-b-0 px-6 pt-4 shadow-xs select-none md:inset-8 md:px-8 md:pt-7">
        <Logo.Remark className="shrink-0" height={20} />
        <div className="grid w-full grid-cols-[1fr_3fr] gap-2">
          <div className="flex h-full flex-col gap-2">
            {[70, 90, 50, 80, 60].map((width) => (
              <div
                className="h-2 rounded-full bg-border"
                key={width}
                style={{ width: `${width}%` }}
              />
            ))}
          </div>
          <div className="grid grid-cols-3 grid-rows-3 gap-3">
            {['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h', 'i'].map((id) => (
              <div className="aspect-4/3 rounded-md border" key={id} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const example = ts`
  // [!code highlight:1]
  import { ... } from '...' // 2.5k (gzipped: 950)

  const ${APP_NAME.toLowerCase()} = new ${APP_NAME}(...)

  async function send() {
    "use server";
    // ...
  }
`;

function BundleSizeCard() {
  return (
    <div className="relative flex h-75 flex-col gap-4 overflow-hidden rounded-2xl border p-4 md:p-8">
      <h3 className="self-start text-lg/6 font-medium tracking-[-0.015em] [&_span]:text-muted-foreground">
        Tiny by design. <span>So lightweight your bundle size will shrink.</span>
      </h3>
      <FeaturesButton />
      <div className="dark relative -mr-8 -mb-8 h-full overflow-hidden rounded-tl-xl bg-background shadow-xs">
        <CodeExample className="*:md:w-min" example={example} />
      </div>
    </div>
  );
}
