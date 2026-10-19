'use client';

import { cn } from '@remark/lib/utils';
import { type HTMLMotionProps, motion } from 'motion/react';

export function FadeIn({ children, className, ...props }: HTMLMotionProps<'div'>) {
  return (
    <motion.div
      animate={{ opacity: 1 }}
      className={cn('flex', className)}
      initial={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
