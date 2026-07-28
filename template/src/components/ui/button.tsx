// Trimmed vendored copy of propfirm's packages/ui/src/components/ui/button.tsx —
// core variants only (default/secondary/outline/destructive/ghost/link + the
// brand pfmGradient CTA). ~20 campaign-specific gradient variants
// (black-friday, cyber-monday, christmas, valentines, awards...) dropped —
// not relevant outside the marketing site.
import * as React from 'react';

import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const buttonVariants = cva(
  [
    'inline-flex items-center cursor-pointer justify-center whitespace-nowrap text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2',
    'disabled:pointer-events-none disabled:bg-dark-disabled disabled:border disabled:text-foreground-disabled disabled:border-border-secondary',
  ].join(' '),
  {
    variants: {
      variant: {
        default:
          'bg-primary-theme border-primary-theme text-primary-theme-foreground border hover:bg-primary-hover hover:border-primary-hover focus:bg-primary-focus focus:border-primary-focus',
        pfmGradient:
          'text-white text-sm bg-[image:var(--pfm-gradient)] hover:opacity-90 disabled:text-foreground-disabled disabled:bg-background-secondary disabled:bg-none border-none transition-all',
        secondary:
          'bg-dark text-foreground hover:bg-dark-hover focus:bg-dark-focus disabled:border-0',
        outline:
          'border border-dark text-foreground hover:bg-dark-hover hover:border-dark-hover hover:text-foreground focus:bg-dark-focus focus:border-dark-focus focus:text-foreground',
        destructive:
          'bg-red-theme text-foreground hover:bg-red-hover focus:bg-red-focus disabled:border-0',
        ghost: 'hover:bg-background-secondary',
        link: 'text-primary-theme underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3 [&_svg]:w-3 [&_svg]:h-3',
        default: 'h-10 px-5 py-2 [&_svg]:w-3.5 [&_svg]:h-3.5',
        lg: 'h-12 px-5 [&_svg]:w-4 [&_svg]:h-4',
        icon: 'size-8.5 p-2.5',
      },
      rounded: {
        default: 'rounded-md',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
      rounded: 'default',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean;
}

const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, rounded, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        className={cn(buttonVariants({ variant, size, rounded, className }))}
        ref={ref}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
