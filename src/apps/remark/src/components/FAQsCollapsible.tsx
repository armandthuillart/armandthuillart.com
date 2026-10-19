'use client';

import { type Transition, motion } from 'motion/react';
import React from 'react';

const transition: Transition = {
  damping: 20,
  mass: 0.5,
  stiffness: 220,
  type: 'spring',
};

export function FAQsCollapsible({ items }: { items: { answer: string; question: string }[] }) {
  const [open, setOpen] = React.useState<null | number>(null);

  return (
    <div>
      {items.map((item, index) => (
        <div className="mb-2 rounded-xl border border-border" key={item.question}>
          <button
            className="flex w-full cursor-pointer items-center justify-between pr-2 pl-6 text-start focus-visible:outline-none max-md:py-2.5 md:h-18"
            onClick={() => {
              setOpen(open === index ? null : index);
            }}
            type="button"
          >
            <h3 className="text-lg/6 font-medium tracking-tight">{item.question}</h3>
            <svg
              className="shrink-0"
              height="52"
              viewBox="0 0 52 52"
              width="52"
              xmlns="http://www.w3.org/2000/svg"
            >
              <title>{open === index ? 'Close' : 'Open'}</title>
              <motion.path
                animate={{ rotateZ: open === index ? 180 : 0 }}
                d="M19 25.5H26L33 25.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
                transition={transition}
              />
              <motion.path
                animate={{
                  rotateZ: open === index ? 80 : 0,
                  scale: open === index ? 0 : 1,
                }}
                d="M26 18.5L26 25.5L26 32.5"
                stroke="currentColor"
                strokeLinecap="round"
                strokeWidth="2"
                transition={transition}
              />
            </svg>
          </button>
          <motion.div
            animate={{ height: open === index ? 'auto' : 0 }}
            className="overflow-hidden"
            initial={{ height: 0 }}
            transition={{
              damping: 18,
              mass: 0.2,
              stiffness: 280,
              type: 'spring',
            }}
          >
            <motion.div className="max-w-9/10 pb-4 pl-6 text-muted-foreground md:pb-5.5">
              <p>{item.answer}</p>
            </motion.div>
          </motion.div>
        </div>
      ))}
    </div>
  );
}
