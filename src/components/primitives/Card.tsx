/**
 * Card Primitive
 * Single-elevation container with hairline border and disciplined spatial math.
 */

import React from 'react';

export interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ padding = 'md', hoverable = false, className = '', children, ...props }, ref) => {
    const paddingStyles = {
      none: '',
      sm: 'p-4',
      md: 'p-6',
      lg: 'p-8',
    };

    return (
      <div
        ref={ref}
        className={`bg-neutral-900/60 border border-neutral-800/80 rounded-xl ${paddingStyles[padding]} ${
          hoverable ? 'hover:border-neutral-700/80 transition-colors' : ''
        } ${className}`}
        {...props}
      >
        {children}
      </div>
    );
  },
);

Card.displayName = 'Card';
