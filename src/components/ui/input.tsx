import * as React from 'react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, value, ...props }, ref) => {
    // For file inputs, we should not pass the value prop for security reasons,
    // as it can only be programmatically set to an empty string.
    // React Hook Form handles file input state internally.
    const inputProps = type === 'file' ? { ...props } : { ...props, value: value === null ? '' : value };

    return (
      <input
        type={type}
        className={cn(
          'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-base',
          className
        )}
        ref={ref}
        {...inputProps}
      />
    );
  }
);
Input.displayName = 'Input';

export { Input };
