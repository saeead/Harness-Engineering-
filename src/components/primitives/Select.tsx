/**
 * Select Primitive
 * Accessible dropdown selector.
 */

import React, { useId } from 'react';

export interface SelectOption {
  value: string;
  label: string;
  disabled?: boolean;
}

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string;
  options: SelectOption[];
  helperText?: string;
  errorText?: string;
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ label, options, helperText, errorText, id, className = '', disabled, ...props }, ref) => {
    const generatedId = useId();
    const selectId = id || generatedId;
    const hasError = Boolean(errorText);

    return (
      <div className="w-full space-y-1.5 text-start">
        {label && (
          <label
            htmlFor={selectId}
            className="block text-xs font-medium text-neutral-300 select-none"
          >
            {label}
          </label>
        )}

        <div className="relative">
          <select
            ref={ref}
            id={selectId}
            disabled={disabled}
            aria-invalid={hasError}
            aria-describedby={
              hasError
                ? `${selectId}-error`
                : helperText
                ? `${selectId}-helper`
                : undefined
            }
            className={`w-full appearance-none rounded-lg bg-neutral-900 border text-neutral-100 text-sm px-3.5 py-2 pe-10 transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-950 disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer ${
              hasError
                ? 'border-rose-500/80 focus-visible:ring-rose-500'
                : 'border-neutral-800 hover:border-neutral-700 focus-visible:ring-neutral-400'
            } ${className}`}
            {...props}
          >
            {options.map((opt) => (
              <option key={opt.value} value={opt.value} disabled={opt.disabled} className="bg-neutral-900 text-neutral-100 py-1">
                {opt.label}
              </option>
            ))}
          </select>

          <div className="pointer-events-none absolute end-3 top-1/2 -translate-y-1/2 text-neutral-400">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </div>
        </div>

        {hasError && (
          <p id={`${selectId}-error`} className="text-xs text-rose-400 font-medium">
            {errorText}
          </p>
        )}

        {!hasError && helperText && (
          <p id={`${selectId}-helper`} className="text-xs text-neutral-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Select.displayName = 'Select';
