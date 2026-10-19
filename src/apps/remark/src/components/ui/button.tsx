import { Slot, Slottable } from '@radix-ui/react-slot';
import { cn } from '@remark/lib/utils';
import { type VariantProps, cva } from 'class-variance-authority';
import { Loader2Icon } from 'lucide-react';

const buttonVariants = cva(
  "group/button inline-flex items-center gap-2 whitespace-nowrap rounded-md font-medium text-sm outline-none transition-[color,box-shadow] focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none justify-center disabled:opacity-50 [&_svg:not([class*='size-'])]:size-4 [&_svg]:pointer-events-none [&_svg]:shrink-0",
  {
    compoundVariants: [
      {
        className: 'h-9 px-4 py-2',
        size: 'default',
        variant: ['ghost', 'default', 'outline', 'secondary', 'destructive'],
      },
    ],
    defaultVariants: {
      size: 'default',
      variant: 'default',
    },
    variants: {
      loading: { true: 'text-transparent! has-[>svg:is(.loading)]:[&_svg]:not-first:opacity-0' },
      size: {
        default: '',
        icon: 'size-9',
        lg: 'h-10 rounded-md px-8',
        sm: 'h-8 rounded-lg px-3',
      },
      variant: {
        default: 'bg-primary text-primary-foreground shadow-xs hover:bg-primary/90',
        destructive:
          'bg-destructive text-white shadow-xs hover:bg-destructive/90 focus-visible:ring-destructive/20 dark:bg-destructive/60 dark:focus-visible:ring-destructive/30 dark:hover:bg-destructive/70',
        ghost: 'hover:bg-accent hover:text-accent-foreground',
        link: 'whitespace-nowrap text-foreground',
        outline:
          'border border-input bg-background shadow-xs hover:bg-accent hover:text-accent-foreground',
        secondary: 'bg-secondary text-secondary-foreground shadow-xs hover:bg-secondary/80',
      },
    },
  },
);

interface ButtonProps extends React.ComponentProps<'button'> {
  asChild?: boolean;
  loading?: boolean;
  size?: VariantProps<typeof buttonVariants>['size'];
  variant?: VariantProps<typeof buttonVariants>['variant'];
}

function Button({
  asChild,
  children,
  className,
  disabled,
  loading,
  size,
  variant,
  ...props
}: ButtonProps) {
  const Comp = asChild ? Slot : 'button';

  return (
    <Comp
      className={cn(
        buttonVariants({
          className,
          loading,
          size,
          variant,
        }),
      )}
      data-slot="button"
      disabled={disabled ?? loading}
      {...props}
    >
      {loading && (
        <Loader2Icon
          className={cn(
            'text-primary-foreground absolute animate-spin',
            variant === 'outline' && 'text-muted-foreground',
            // Used for conditional styling when button is loading
            'loading',
          )}
          size={20}
        />
      )}
      <Slottable>{children}</Slottable>
    </Comp>
  );
}

export { Button, buttonVariants };
