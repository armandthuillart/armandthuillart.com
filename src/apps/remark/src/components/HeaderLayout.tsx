'use client';

import { type Transition, motion, useMotionValueEvent, useScroll } from 'motion/react';
import React from 'react';

const transition: Transition = {
  bounce: 0,
  duration: 0.45,
  type: 'spring',
};

export function HeaderLayout({ children }: { children: React.ReactNode }) {
  const { scrollY } = useScroll();
  const [hasScrolled, setHasScrolled] = React.useState(false);

  useMotionValueEvent(scrollY, 'change', (current) => {
    setHasScrolled(current > 0);
  });

  return (
    <motion.div
      animate={{ y: hasScrolled ? -24 : 0 }}
      className="fixed inset-0 bottom-auto z-50 bg-background max-md:transform-none!"
      transition={transition}
    >
      {children}
      <motion.hr
        animate={{ opacity: hasScrolled ? 1 : 0 }}
        className="absolute inset-x-0 bottom-0 mx-auto max-w-[calc(var(--container-5xl)+3rem)]"
        initial={{ opacity: 0 }}
        transition={{
          bounce: 0,
          duration: 0.45,
          type: 'spring',
        }}
      />
    </motion.div>
  );
}
