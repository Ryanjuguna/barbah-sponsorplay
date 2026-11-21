import React from 'react';
import { cn } from '@/lib/utils';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helper?: string;
}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, helper, id, ...props }, ref) => {
    const inputId = id || `input-${Math.random().toString(36).slice(2)}`;

    return (
      <div className="space-y-1 w-full">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-sm font-semibold text-[hsl(var(--foreground))] tracking-wide"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={cn(
            'd-input',
            error && 'border-red-500/50 focus:border-red-500 focus:ring-red-500/30',
            className
          )}
          {...props}
        />
        {error && (
          <p className="text-[11px] font-medium text-red-400">{error}</p>
        )}
        {helper && !error && (
          <p className="text-[11px] text-[hsl(var(--muted-foreground))]">{helper}</p>
        )}
      </div>
    );
  }
);

Input.displayName = 'Input';