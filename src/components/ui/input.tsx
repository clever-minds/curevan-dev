'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';

import { cn } from '@/lib/utils';

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<'input'>>(
  ({ className, type, value, ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    
    // For file inputs, we should not pass the value prop for security reasons,
    // as it can only be programmatically set to an empty string.
    // React Hook Form handles file input state internally.
    const inputProps = type === 'file' ? { ...props } : { ...props, value: value === null ? '' : value };

    const isPassword = type === 'password';

    return (
      <div className="relative w-full">
        <input
          type={isPassword && showPassword ? 'text' : type}
          className={cn(
            'flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-base',
            isPassword && 'pr-10',
            className
          )}
          ref={ref}
          {...inputProps}
        />
        {isPassword && (
          <button
            type="button"
            onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors focus:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
          >
            {showPassword ? (
              <EyeOff className="h-4 w-4" />
            ) : (
              <Eye className="h-4 w-4" />
            )}
          </button>
        )}
      </div>
    );
  }
);
Input.displayName = 'Input';

export { Input };
