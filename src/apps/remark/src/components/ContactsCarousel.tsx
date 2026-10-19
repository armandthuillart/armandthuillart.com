'use client';

import { Avatar, AvatarFallback } from '@remark/components/ui/Avatar';
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

interface Feedback {
  body: string;
  email: string;
  name: string;
  plan: 'enterprise' | 'free' | 'pro';
}

const feedbacks: Feedback[] = [
  {
    body: 'Love the app, but I wish there was an option to sort my items by date added. Would make organizing so much easier!',
    email: 'yuki.tanaka@example.org',
    name: 'Yuki',
    plan: 'pro',
  },
  {
    body: "Everything works great, but can you add a 'dark mode'? My eyes get tired using the bright interface after a while.",
    email: 'm.abdullah@fastmail.com',
    name: 'Mohammed',
    plan: 'free',
  },
  {
    body: "I'm missing a way to export my data as CSV or PDF. That feature would be really helpful for sharing reports.",
    email: 'isa.rodriguez@gmail.com',
    name: 'Isabella',
    plan: 'enterprise',
  },
  {
    body: "The new update is smooth, but sometimes notifications don't show up. Any chance of a fix in the next patch?",
    email: 'chenwei.liu@outlook.cn',
    name: 'Chen Wei',
    plan: 'free',
  },
  {
    body: "Could you add custom tags for items? I'd love more flexibility in how I categorize things.",
    email: 'aisha.patel@mail.com',
    name: 'Aisha',
    plan: 'free',
  },
  {
    body: 'App is fast, but syncing between devices is slow. Would appreciate an offline mode or faster sync.',
    email: 'kwame.mensah@inbox.gh',
    name: 'Kwame',
    plan: 'pro',
  },
  {
    body: 'The tutorial was helpful, but a contextual help button on each page would save time for new users.',
    email: 'sofia.kowalski@yahoo.com',
    name: 'Sofia',
    plan: 'free',
  },
];

export function ContactsCarousel() {
  const [current, setCurrent] = React.useState(0);

  const [plugin] = React.useState(() =>
    Autoplay({
      delay: 5000,
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
      className="relative select-none before:absolute before:inset-0 before:top-auto before:z-1 before:h-4 before:bg-linear-to-t before:from-background before:to-transparent after:absolute after:inset-0 after:bottom-auto after:z-1 after:h-4 after:bg-linear-to-b after:from-background after:to-transparent before:md:h-10 after:md:h-10"
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
      <CarouselContent className="h-52 px-6 md:h-64 md:px-10">
        <AnimatePresence>
          {feedbacks.map((contact, index) => (
            <CarouselItem className="basis-1/2" key={contact.name}>
              <FeedbackCard
                contact={contact}
                isActive={current - 1 === index}
                plan={contact.plan}
              />
            </CarouselItem>
          ))}
        </AnimatePresence>
      </CarouselContent>
    </Carousel>
  );
}

function FeedbackCard({
  contact,
  isActive,
  plan,
}: {
  contact: (typeof feedbacks)[0];
  isActive: boolean;
  plan: Feedback['plan'];
}) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className={cn('gap-2 rounded-xl border p-0 transition-shadow', !isActive && 'shadow-none')}
      initial={{ opacity: 0 }}
    >
      <div className="flex items-center gap-2 p-4 pb-0">
        <Avatar className="mt-0.5">
          <AvatarFallback>{contact.name.slice(0, 1)}</AvatarFallback>
        </Avatar>
        <div>
          <div className="inline-flex items-center gap-1 text-sm">
            {contact.name}
            <Badge className="rounded-sm text-[9px] uppercase" size="sm" variant="secondary">
              {plan}
            </Badge>
          </div>
          <div className="text-xs text-muted-foreground">{contact.email}</div>
        </div>
      </div>
      <div className="p-4 pt-0">
        <blockquote className="mt-2 border-l-2 pl-3 text-sm italic">
          &quot;{contact.body}&quot;
        </blockquote>
      </div>
    </motion.div>
  );
}
