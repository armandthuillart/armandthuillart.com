import React from 'react';

import { HeroButtons } from './HeroButtons';

const HeroCanvas = React.lazy(async () => {
  const mod = await import('./HeroCanvas');
  return { default: mod.HeroCanvas };
});

export function Hero() {
  return (
    <section className="container">
      <div className="relative flex flex-col items-center gap-6 pt-14 pb-25">
        <div className="absolute bottom-0 left-1/2 -z-1 size-full -translate-x-1/2 [mask:radial-gradient(ellipse_at_center_calc(100%-100px),var(--color-background),transparent_75%)]">
          <React.Suspense>
            <HeroCanvas />
          </React.Suspense>
        </div>
        <div className="flex flex-col items-center gap-9">
          <div className="flex flex-col items-center gap-4 text-center text-balance md:mt-10">
            <h1 className="text-4xl/12 font-semibold tracking-tighter md:text-5xl/14">
              Ship faster, build better
            </h1>
            <p className="text-lg text-muted-foreground md:text-xl">
              Collect feedback, iterate and ship what your users want.
            </p>
          </div>
        </div>
        <HeroButtons />
      </div>
    </section>
  );
}
