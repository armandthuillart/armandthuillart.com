'use client';

import { cn } from '@remark/lib/utils';
import { motion } from 'motion/react';
import React from 'react';

type CSSVariables = React.CSSProperties & Record<`--${string}`, string>;

function ShimmerComponent({
  children,
  className,
  duration = 2,
  spread = 2,
}: {
  children: string;
  className?: string;
  duration?: number;
  spread?: number;
}) {
  const dynamicSpread = React.useMemo(() => {
    return children.length * spread;
  }, [children, spread]);

  const style: CSSVariables = {
    '--spread': `${dynamicSpread}px`,
    backgroundImage: 'var(--bg), linear-gradient(var(--base-color), var(--base-color))',
  };

  return (
    <motion.p
      animate={{ backgroundPosition: '0% center' }}
      className={cn(
        'relative inline-block [background-image:var(--bg),linear-gradient(var(--base-color),var(--base-color))] bg-size-[250%_100%] bg-clip-text bg-no-repeat text-transparent [--base-color:var(--color-muted-foreground)] [--bg:linear-gradient(90deg,transparent_calc(50%-var(--spread)),var(--gradient-color),transparent_calc(50%+var(--spread)))] [--gradient-color:var(--color-foreground)]',
        className,
      )}
      initial={{ backgroundPosition: '100% center' }}
      style={style}
      transition={{
        duration,
        ease: 'linear',
        repeat: Number.POSITIVE_INFINITY,
      }}
    >
      {children}
    </motion.p>
  );
}

export const TextShimmer = React.memo(ShimmerComponent);
