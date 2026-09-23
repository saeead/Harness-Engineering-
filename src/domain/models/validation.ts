/**
 * Validation Domain Models
 * Defines validation results, errors, warnings, and severity rules.
 */

export type ValidationSeverity = 'error' | 'warning' | 'info';

export interface ValidationError {
  field: string;
  message: string;
  rule: string;
  severity: ValidationSeverity;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
  warnings: ValidationError[];
  checkedAt: string;
}

export type ValidationRuleFn<T> = (value: T) => ValidationError | null;

export interface ValidationRule<T> {
  name: string;
  field: string;
  validate: ValidationRuleFn<T>;
}
