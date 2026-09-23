/**
 * Textarea Primitive
 * Accessible multi-line input with auto-layout, validation status, and direction awareness.
 */

import React, { useId } from 'react';

export interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string;
  helperText?: string;
  errorText?: string;
}

export const Textarea = React.forwardRef<HTMLTextAreaElement, TextareaProps>(
  ({ label, helperText, errorText, id, className = '', disabled, rows = 3, ...props }, ref) => {
    const generatedId = useId();
    const inputId = id || generatedId;
    const hasError = Boolean(errorText);

    return (
      <div className="w-full space-y-1.5 text-start">
        {label && (
          <label
            htmlFor={inputId}
            className="block text-xs font-medium text-neutral-300 select-none"
          >
            {label}
          </label>
        )}

        <textarea
          ref={ref}
          id={inputId}
          rows={rows}
          disabled={disabled}
          aria-invalid={hasError}
          aria-describedby={
            hasError
              ? `${inputId}-error`
              : helperText
              ? `${inputId}-helper`
              : undefined
          }
          className={`w-full rounded-lg bg-neutral-900 border text-neutral-100 text-sm p-3 transition-colors placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-1 focus-visible:ring-offset-neutral-950 disabled:opacity-50 disabled:cursor-not-allowed resize-y ${
            hasError
              ? 'border-rose-500/80 focus-visible:ring-rose-500'
              : 'border-neutral-800 hover:border-neutral-700 focus-visible:ring-neutral-400'
          } ${className}`}
          {...props}
        />

        {hasError && (
          <p id={`${inputId}-error`} className="text-xs text-rose-400 font-medium">
            {errorText}
          </p>
        )}

        {!hasError && helperText && (
          <p id={`${inputId}-helper`} className="text-xs text-neutral-500">
            {helperText}
          </p>
        )}
      </div>
    );
  },
);

Textarea.displayName = 'Textarea';
