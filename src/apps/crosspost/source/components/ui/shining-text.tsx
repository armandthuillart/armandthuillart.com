'use client';

import { motion } from 'motion/react';

export function ShiningText({ text }: { text: string }) {
  return (
    <motion.p
      animate={{ backgroundPosition: '-200% 0' }}
      className="font-regular w-fit bg-[linear-gradient(110deg,var(--color-muted-foreground),35%,var(--color-background),50%,var(--color-muted-foreground),75%,var(--color-muted-foreground))] bg-[length:200%_100%] bg-clip-text text-base text-transparent"
      initial={{ backgroundPosition: '200% 0' }}
      transition={{
        duration: 2,
        ease: 'linear',
        repeat: Infinity,
      }}
    >
      {text}
    </motion.p>
  );
}
