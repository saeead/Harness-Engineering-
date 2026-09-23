/**
 * Application Error Model
 * Distinct error categories, human-readable user messages, and expandable technical details.
 */

export type ErrorCategory =
  | 'validation'
  | 'provider'
  | 'authentication'
  | 'authorization'
  | 'network'
  | 'repository'
  | 'generation'
  | 'export'
  | 'unexpected';

export interface AppErrorOptions {
  category: ErrorCategory;
  userMessage: string;
  technicalDetails?: unknown;
  isRecoverable?: boolean;
  code?: string;
  originalError?: Error;
}

export class AppError extends Error {
  public readonly category: ErrorCategory;
  public readonly userMessage: string;
  public readonly technicalDetails?: unknown;
  public readonly isRecoverable: boolean;
  public readonly code?: string;
  public readonly timestamp: string;

  constructor(options: AppErrorOptions) {
    super(options.userMessage);
    this.name = 'AppError';
    this.category = options.category;
    this.userMessage = options.userMessage;
    this.technicalDetails = options.technicalDetails || options.originalError?.message;
    this.isRecoverable = options.isRecoverable ?? true;
    this.code = options.code;
    this.timestamp = new Date().toISOString();

    if (options.originalError?.stack) {
      this.stack = options.originalError.stack;
    }
  }

  static isAppError(err: unknown): err is AppError {
    return err instanceof AppError;
  }
}

/**
 * Format any error into a standardized human-readable representation.
 */
export function formatErrorForUser(err: unknown): {
  userMessage: string;
  category: ErrorCategory;
  details?: string;
  isRecoverable: boolean;
} {
  if (AppError.isAppError(err)) {
    return {
      userMessage: err.userMessage,
      category: err.category,
      details: err.technicalDetails
        ? typeof err.technicalDetails === 'string'
          ? err.technicalDetails
          : JSON.stringify(err.technicalDetails, null, 2)
        : undefined,
      isRecoverable: err.isRecoverable,
    };
  }

  if (err instanceof Error) {
    return {
      userMessage: err.message || 'An unexpected operational error occurred.',
      category: 'unexpected',
      details: err.stack,
      isRecoverable: true,
    };
  }

  return {
    userMessage: 'An unknown system condition was encountered.',
    category: 'unexpected',
    details: String(err),
    isRecoverable: true,
  };
}

// Convenient factory helpers
export const createValidationError = (message: string, details?: unknown) =>
  new AppError({ category: 'validation', userMessage: message, technicalDetails: details });

export const createProviderError = (message: string, details?: unknown) =>
  new AppError({ category: 'provider', userMessage: message, technicalDetails: details });

export const createAuthError = (message: string, details?: unknown) =>
  new AppError({ category: 'authentication', userMessage: message, technicalDetails: details });

export const createNetworkError = (message: string, details?: unknown) =>
  new AppError({ category: 'network', userMessage: message, technicalDetails: details });

export const createRepositoryError = (message: string, details?: unknown) =>
  new AppError({ category: 'repository', userMessage: message, technicalDetails: details });

export const createGenerationError = (message: string, details?: unknown) =>
  new AppError({ category: 'generation', userMessage: message, technicalDetails: details });

export const createExportError = (message: string, details?: unknown) =>
  new AppError({ category: 'export', userMessage: message, technicalDetails: details });
