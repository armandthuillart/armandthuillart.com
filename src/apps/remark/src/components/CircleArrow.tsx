'use client';

import { cn } from '@remark/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import { useAnimate } from 'motion/react';
import React from 'react';

const getRotationClass = (direction: CircleArrowProps['direction']) => {
  switch (direction) {
    case 'left':
      return 'rotate-180';
    case 'right':
      return '';
    case 'up-left':
      return '-rotate-135';
    case 'up-right':
      return '-rotate-45';
  }
};

interface CircleArrowProps extends VariantProps<typeof circleArrowVariants> {
  className?: string;
  direction: 'left' | 'right' | 'up-left' | 'up-right';
  isHovering: boolean;
}

export function CircleArrow({ className, direction, isHovering, variant }: CircleArrowProps) {
  const [arrow1, animate1] = useAnimate();
  const [arrow2, animate2] = useAnimate();

  React.useEffect(() => {
    if (!isHovering) {
      // Reset positions instantly when not hovering
      animate1(arrow1.current, { translateX: 0 }, { duration: 0 });
      animate2(arrow2.current, { translateX: 0 }, { duration: 0 });
      return;
    }

    // Animate the paths
    const isForward = direction === 'right' || direction === 'up-right';
    void Promise.all([
      animate1(
        arrow1.current,
        { x: isForward ? [0, 20] : [-20, 0] },
        {
          duration: 0.22,
          ease: 'easeOut',
        },
      ),
      animate2(
        arrow2.current,
        { x: isForward ? [-20, 0] : [0, 20] },
        {
          duration: 0.22,
          ease: 'easeOut',
        },
      ),
    ]);
  }, [isHovering, animate1, animate2, arrow1, arrow2, direction]);

  const rotationClass = getRotationClass(direction);

  return (
    <svg
      className={cn(circleArrowVariants({ variant }), className)}
      fill="none"
      height="16"
      viewBox="0 0 16 16"
      width="16"
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>A circle arrow</title>
      <rect height={16} rx={8} width={16} />
      <path
        className={rotationClass}
        d="M4.75 8L11.25 8M11.25 8L8.75 5.5M11.25 8L8.75 10.5"
        ref={arrow1}
        stroke="var(--muted-foreground)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={0.8}
        strokeWidth={1.5}
        style={{ transformOrigin: '50% 50%' }}
      />
      <path
        className={rotationClass}
        d="M4.75 8L11.25 8M11.25 8L8.75 5.5M11.25 8L8.75 10.5"
        ref={arrow2}
        stroke="var(--muted-foreground)"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeOpacity={0.8}
        strokeWidth={1.5}
        style={{ transformOrigin: '50% 50%' }}
      />
    </svg>
  );
}

const circleArrowVariants = cva('overflow-hidden rounded-full', {
  defaultVariants: { variant: 'default' },
  variants: {
    variant: {
      default: '[&_path]:stroke-primary-foreground [&_rect]:fill-primary-foreground/10',
      destructive:
        '[&_path]:stroke-destructive/60 group-hover/button:[&_path]:stroke-destructive [&_rect]:fill-destructive/6 group-hover/button:[&_rect]:fill-destructive/12',
      outline:
        '[&_path]:stroke-primary/30 group-hover/button:[&_path]:stroke-primary/60 [&_rect]:fill-primary/3 group-hover/button:[&_rect]:fill-primary/6',
    },
  },
});
