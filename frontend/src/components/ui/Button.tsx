import React from 'react';
import { cn } from '@/lib/utils';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'ghost' | 'gold' | 'danger';
  size?: 'sm' | 'md' | 'lg';
  isLoading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', isLoading, leftIcon, rightIcon, disabled, ...props }, ref) => {
    const base = 'rounded-xl font-semibold transition-all duration-200 active:scale-95 disabled:opacity-50 disabled:pointer-events-none focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

    const variants = {
      primary: 'bg-[hsl(var(--primary))] text-[hsl(var(--primary-foreground))] hover:bg-[hsl(var(--primary))/90] hover:shadow-[var(--shadow-terracotta)] focus-visible:ring-[hsl(var(--ring))]',
      secondary:
        'border border-[hsl(var(--border))] bg-[hsl(var(--secondary))]/30 text-[hsl(var(--secondary-foreground))] hover:bg-[hsl(var(--secondary))]/50 hover:border-[hsl(var(--secondary))]/60 focus-visible:ring-[hsl(var(--ring))]',
      ghost:
        'text-[hsl(var(--muted-foreground))] hover:bg-[hsl(var(--muted))] active:scale-95 focus-visible:ring-[hsl(var(--ring))]',
      gold:
        'bg-[hsl(var(--accent))] text-[hsl(var(--accent-foreground))] font-bold tracking-wide hover:bg-[hsl(var(--accent))/90] hover:shadow-[var(--shadow-gold)] focus-visible:ring-[hsl(var(--ring))]',
      danger:
        'bg-red-900/20 text-red-300 border border-red-500/30 hover:bg-red-900/40 hover:border-red-500/50 focus-visible:ring-red-500/30',
    };

    const sizes = {
      sm: 'px-3 py-1.5 text-xs',
      md: 'px-6 py-3 text-sm',
      lg: 'px-8 py-4 text-base',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center gap-2',
          base,
          variants[variant],
          sizes[size],
          className
        )}
        disabled={disabled || isLoading}
        {...props}
      >
        {isLoading && (
          <svg
            className="animate-spin h-4 w-4"
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            ></circle>
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
            ></path>
          </svg>
        )}
        {leftIcon && !isLoading}
        {leftIcon && !isLoading && <span className="shrink-0">{leftIcon}</span>}
        {props.children}
        {rightIcon && <span className="shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = 'Button';