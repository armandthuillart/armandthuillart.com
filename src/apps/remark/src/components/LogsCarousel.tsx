'use client';

import { Badge } from '@remark/components/ui/Badge';
import {
  Carousel,
  type CarouselApi,
  CarouselContent,
  CarouselItem,
} from '@remark/components/ui/Carousel';
import { cn } from '@remark/lib/utils';
import Autoplay from 'embla-carousel-autoplay';
import { AnimatePresence, motion } from 'motion/react';
import React from 'react';

interface Log {
  method: 'DELETE' | 'PATCH' | 'POST';
  status: 200 | 403 | 500;
  uuid: string;
}

const logs: Log[] = [
  {
    method: 'POST',
    status: 403,
    uuid: 'a1b2c3d4-e5f6-4a5b-8c7d-9e0f1a2b3c4d',
  },
  {
    method: 'POST',
    status: 200,
    uuid: 'f5e4d3c2-b1a0-4f3e-8d7c-6b5a4c3d2e1f',
  },
  {
    method: 'PATCH',
    status: 500,
    uuid: '9e8d7c6b-5a4c-3d2e-1f0a-9b8c7d6e5f4a',
  },
  {
    method: 'DELETE',
    status: 200,
    uuid: '3c2d1e0f-9a8b-7c6d-5e4f-3a2b1c0d9e8f',
  },
  {
    method: 'PATCH',
    status: 403,
    uuid: '7b6a5c4d-3e2f-1a0b-9c8d-7e6f5a4b3c2d',
  },
  {
    method: 'POST',
    status: 200,
    uuid: '2e1f0a9b-8c7d-6e5f-4a3b-2c1d0e9f8a7b',
  },
];

export function LogsCarousel() {
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
      className="select-none before:absolute before:inset-0 before:top-auto before:z-1 before:h-4 before:bg-linear-to-t before:from-background before:to-transparent after:absolute after:inset-0 after:bottom-auto after:z-1 after:h-4 after:bg-linear-to-b after:from-background after:to-transparent before:md:h-10 after:md:h-10"
      onMouseLeave={() => {
        plugin.play();
      }}
      opts={{
        align: 'center',
        loop: true,
      }}
      orientation="vertical"
      plugins={[plugin]}
      setApi={handleApi}
    >
      <CarouselContent className="-mt-1.5 h-52 px-6 md:-mt-2 md:h-64 md:px-10">
        <AnimatePresence>
          {logs.map((log, index) => (
            <CarouselItem className="basis-10 pt-2 md:basis-14 md:pt-4" key={log.uuid}>
              <motion.div
                animate={{ opacity: 1 }}
                className={cn(
                  'flex items-center gap-2 rounded-xl border px-2 py-2 transition-shadow',
                  current - 1 !== index && 'shadow-none',
                )}
                initial={{ opacity: 0 }}
              >
                <Badge variant="secondary">{log.status}</Badge>
                <div className="overflow-hidden">
                  <p className="w-full truncate font-mono text-sm text-muted-foreground">
                    {`{ id: ${log.uuid} }`}
                  </p>
                </div>
              </motion.div>
            </CarouselItem>
          ))}
        </AnimatePresence>
      </CarouselContent>
    </Carousel>
  );
}
