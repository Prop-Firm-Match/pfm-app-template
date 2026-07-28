// Trimmed vendored copy of propfirm's packages/ui/src/components/ui/input.tsx —
// dropped the dynamic left/right inner-content padding measurement and the
// clearable/loading affordances (need extra icon components we don't vendor).
// Core sizes + left/right icon slots kept, since forms need those constantly.
import * as React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';

import { cn } from '../../lib/utils';

const inputVariants = cva(
  [
    'block transition-colors bg-background-secondary w-full border px-3 py-1.5 focus:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:[color-scheme:dark]',
    'border-dark text-foreground focus:border-primary-theme placeholder:text-foreground-tertiary/50',
  ].join(' '),
  {
    variants: {
      size: {
        sm: 'h-9 text-sm',
        default: 'h-10 text-sm',
        lg: 'h-12 text-base',
      },
      rounded: {
        default: 'rounded-md',
        full: 'rounded-full',
      },
    },
    defaultVariants: {
      size: 'default',
      rounded: 'default',
    },
  },
);

export interface InputProps
  extends
    Omit<React.InputHTMLAttributes<HTMLInputElement>, 'size'>,
    VariantProps<typeof inputVariants> {
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  wrapperClassName?: string;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  (
    { className, wrapperClassName, type = 'text', size, rounded, leftIcon, rightIcon, ...props },
    ref,
  ) => (
    <div className={cn('relative flex min-w-0', wrapperClassName)}>
      {leftIcon && (
        <span className="pointer-events-none absolute inset-y-0 left-0 flex items-center pl-3 text-foreground-secondary [&_svg]:h-4 [&_svg]:w-4">
          {leftIcon}
        </span>
      )}
      <input
        type={type}
        className={cn(
          inputVariants({ size, rounded }),
          leftIcon && 'pl-10',
          rightIcon && 'pr-10',
          className,
        )}
        ref={ref}
        {...props}
      />
      {rightIcon && (
        <span className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-foreground-secondary [&_svg]:h-4 [&_svg]:w-4">
          {rightIcon}
        </span>
      )}
    </div>
  ),
);
Input.displayName = 'Input';

export { Input };
