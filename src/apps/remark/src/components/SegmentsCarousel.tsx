'use client';

import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@remark/components/ui/Carousel';
import { cn } from '@remark/lib/utils';
import Autoplay from 'embla-carousel-autoplay';
import { AnimatePresence, type Transition, type Variants, motion } from 'motion/react';
import React from 'react';

const segments = [
  {
    count: 41,
    items: [
      {
        backgroundColor: 'var(--color-sky-400)',
        count: 1304,
        title: 'Free',
      },
      {
        backgroundColor: 'var(--color-purple-400)',
        count: 304,
        title: 'Plus',
      },
    ],

    title: 'Engagement',
  },
  {
    count: 98,
    items: [
      {
        backgroundColor: 'var(--color-green-400)',
        count: 408,
        title: 'Popover',
      },
      {
        backgroundColor: 'var(--color-blue-400)',
        count: 10,
        title: 'Form',
      },
    ],

    title: 'Source',
  },
  {
    count: 14,
    items: [
      {
        backgroundColor: 'var(--color-red-400)',
        count: 30,
        title: 'Free',
      },
      {
        backgroundColor: 'var(--color-yellow-400)',
        count: 3,
        title: 'Plus',
      },
    ],

    title: 'Requests',
  },
];

const pingVariants: Variants = {
  animate: {
    opacity: [0, 0.25, 0],
    scale: [1, 2, 1],
  },
};

const pingTransition = (index: number): Transition => ({
  delay: index * 50,
  duration: 3,
  ease: 'easeOut',
  repeat: Infinity,
  repeatDelay: 0,
});

export function SegmentsCarousel() {
  const [current, setCurrent] = React.useState(0);

  const [plugin] = React.useState(() =>
    Autoplay({
      delay: 3000,
      stopOnInteraction: true,
      stopOnMouseEnter: true,
    }),
  );

  const handleApi = React.useCallback((api: CarouselApi) => {
    if (!api) return;

    setCurrent(api.selectedScrollSnap() + 1);
    api.on('select', () => {
      setCurrent(api.selectedScrollSnap() + 1);
    });
  }, []);

  return (
    <Carousel
      className="relative before:absolute before:inset-0 before:left-auto before:z-1 before:w-4 before:bg-linear-to-l before:from-background before:to-transparent after:absolute after:inset-0 after:right-auto after:z-1 after:w-4 after:bg-linear-to-r after:from-background after:to-transparent before:md:w-10 after:md:w-10"
      onMouseLeave={() => {
        plugin.play();
      }}
      opts={{
        align: 'center',
        loop: true,
      }}
      plugins={[plugin]}
      setApi={handleApi}
    >
      <CarouselContent className="h-50 py-6 md:h-64 md:py-10">
        <AnimatePresence>
          {segments.map(({ count, items, title }, index) => (
            <CarouselItem
              className="basis-[calc(100%-3rem)] md:basis-[calc(100%-5rem)]"
              key={title}
            >
              <motion.div
                animate={{ opacity: 1 }}
                className={cn(
                  'relative flex h-full flex-col justify-between overflow-hidden rounded-2xl border px-6 py-5 text-xs',
                  current - 1 !== index && 'shadow-none',
                )}
                initial={{ opacity: 0 }}
                key={title}
              >
                <div className="pointer-events-none absolute inset-0 -z-1">
                  <div
                    className={cn(
                      'from-muted-foreground to-muted absolute -top-3 -right-3 aspect-square w-28 rounded-full bg-linear-to-b opacity-75 blur-2xl',
                    )}
                  />
                  <div className="absolute inset-0 bg-linear-to-tl from-background/5" />
                  <div className="absolute inset-0 bg-linear-to-b from-background/60 backdrop-filter" />
                </div>

                <div className="space-y-1.5 md:space-y-3">
                  <h3 className="text-xs font-medium tracking-wide uppercase">{title}</h3>
                  <p className="text-2xl/6 font-medium md:text-3xl/6">{count}%</p>
                </div>

                <motion.div className="mt-auto">
                  {items.map(({ count, title }, index) => (
                    <React.Fragment key={title}>
                      <div
                        className="text-slate-12 flex w-full items-center justify-between pt-3 not-last:pb-3"
                        key={title}
                      >
                        <div className="inline-flex items-center gap-3">
                          <div className="relative size-2">
                            <div className="absolute inset-0 rounded-full bg-muted-foreground/50" />
                            {['ping-outer', 'ping-inner'].map((key) => (
                              <motion.div
                                animate="animate"
                                className="absolute inset-0 rounded-full bg-muted-foreground/50"
                                key={key}
                                transition={pingTransition(index)}
                                variants={pingVariants}
                              />
                            ))}
                          </div>
                          <span>{title}</span>
                        </div>
                        <span className="opacity-80">{count}</span>
                      </div>

                      {index !== items.length - 1 && <hr />}
                    </React.Fragment>
                  ))}
                </motion.div>
              </motion.div>
            </CarouselItem>
          ))}
        </AnimatePresence>
      </CarouselContent>
    </Carousel>
  );
}
