/**
 * Divider Primitive
 * Subtle hairline divider for content separation.
 */

import React from 'react';

export interface DividerProps {
  className?: string;
  orientation?: 'horizontal' | 'vertical';
}

export const Divider: React.FC<DividerProps> = ({
  className = '',
  orientation = 'horizontal',
}) => {
  if (orientation === 'vertical') {
    return (
      <div
        className={`w-[1px] self-stretch bg-neutral-800 shrink-0 ${className}`}
        aria-hidden="true"
      />
    );
  }

  return (
    <hr
      className={`border-0 border-t border-neutral-800/80 my-4 w-full shrink-0 ${className}`}
      aria-hidden="true"
    />
  );
};
