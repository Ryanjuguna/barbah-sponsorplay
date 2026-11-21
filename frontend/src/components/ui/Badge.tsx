import React from 'react';
import { cn } from '@/lib/utils';

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'terracotta' | 'green' | 'gold' | 'slate';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant = 'slate', children, ...props }, ref) => {
    const variants = {
      terracotta: 'd-badge d-badge-terracotta',
      green: 'd-badge d-badge-green',
      gold: 'd-badge d-badge-gold',
      slate: 'd-badge d-badge-slate',
    };

    return (
      <span ref={ref} className={cn(variants[variant], className)} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';