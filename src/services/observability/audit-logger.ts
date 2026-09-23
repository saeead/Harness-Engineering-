/**
 * Local-First Generation Audit & Operation Observability Service
 * Tracks lifecycle events, performance metrics, and validation states
 * with strict secret sanitization and local ring-buffer persistence.
 */

export type OperationType =
  | 'intake_validation'
  | 'ai_analysis'
  | 'spec_generation'
  | 'harness_planning'
  | 'artifact_generation'
  | 'zip_export'
  | 'github_export'
  | 'repo_audit'
  | 'provider_test'
  | 'system_self_test';

export type OperationResult = 'success' | 'failure' | 'warning';
export type ValidationState = 'validated' | 'fallback_sanitized' | 'invalid' | 'bypassed';

export interface AuditLogEntry {
  id: string;
  timestamp: string;
  operationType: OperationType;
  projectName: string;
  result: OperationResult;
  validationState: ValidationState;
  durationMs: number;
  details?: string;
  errorMessage?: string;
  retryable: boolean;
  metadata?: Record<string, string | number | boolean>;
}

export interface ActiveOperationHandle {
  id: string;
  operationType: OperationType;
  projectName: string;
  startTime: number;
  recordSuccess: (details?: string, metadata?: Record<string, string | number | boolean>) => AuditLogEntry;
  recordFailure: (
    error: unknown,
    retryable?: boolean,
    details?: string,
    metadata?: Record<string, string | number | boolean>,
  ) => AuditLogEntry;
  recordWarning: (
    warningMessage: string,
    details?: string,
    metadata?: Record<string, string | number | boolean>,
  ) => AuditLogEntry;
}

const STORAGE_KEY = 'agent_harness_audit_log_v1';
const MAX_LOG_ENTRIES = 100;

export class AuditLogger {
  private static memoryEntries: AuditLogEntry[] = [];
  private static subscribers: Set<(entries: AuditLogEntry[]) => void> = new Set();
  private static isInitialized = false;

  /**
   * Secret Sanitizer: Scrubs GitHub PATs, Gemini API keys, Bearer tokens, and auth headers
   */
  public static scrubSecrets(text: string): string {
    if (!text) return '';
    return text
      // GitHub classic and fine-grained PATs
      .replace(/ghp_[A-Za-z0-9_]{30,255}/g, '[REDACTED_GH_TOKEN]')
      .replace(/github_pat_[A-Za-z0-9_]{50,255}/g, '[REDACTED_GH_PAT]')
      .replace(/gho_[A-Za-z0-9_]{30,255}/g, '[REDACTED_GH_OAUTH]')
      .replace(/ghu_[A-Za-z0-9_]{30,255}/g, '[REDACTED_GH_USER]')
      .replace(/ghs_[A-Za-z0-9_]{30,255}/g, '[REDACTED_GH_SERVER]')
      // Google / Gemini API keys
      .replace(/AIzaSy[A-Za-z0-9_-]{33}/g, '[REDACTED_GEMINI_KEY]')
      // General Bearer / Auth tokens
      .replace(/Bearer\s+[A-Za-z0-9\-._~+/]+=*/gi, 'Bearer [REDACTED_TOKEN]')
      .replace(/(key|token|secret|password|apiKey)=([A-Za-z0-9\-._~+/]+)/gi, '$1=[REDACTED]');
  }

  /**
   * Initialize log from local storage
   */
  private static init(): void {
    if (this.isInitialized) return;
    this.isInitialized = true;
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        const raw = window.localStorage.getItem(STORAGE_KEY);
        if (raw) {
          const parsed = JSON.parse(raw);
          if (Array.isArray(parsed)) {
            this.memoryEntries = parsed.slice(0, MAX_LOG_ENTRIES);
          }
        }
      }
    } catch {
      // Ignore storage errors in restricted contexts
    }
  }

  /**
   * Start tracking a long-running or critical operation
   */
  public static startOperation(
    operationType: OperationType,
    projectName: string = 'Untitled Project',
  ): ActiveOperationHandle {
    const id = `op_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    const startTime = performance.now();

    return {
      id,
      operationType,
      projectName: this.scrubSecrets(projectName),
      startTime,
      recordSuccess: (details, metadata) => {
        const durationMs = Math.round(performance.now() - startTime);
        const entry: AuditLogEntry = {
          id,
          timestamp: new Date().toISOString(),
          operationType,
          projectName: this.scrubSecrets(projectName),
          result: 'success',
          validationState: 'validated',
          durationMs,
          details: details ? this.scrubSecrets(details) : undefined,
          retryable: false,
          metadata,
        };
        this.addEntry(entry);
        return entry;
      },
      recordFailure: (error, retryable = true, details, metadata) => {
        const durationMs = Math.round(performance.now() - startTime);
        const errString = error instanceof Error ? error.message : String(error);
        const entry: AuditLogEntry = {
          id,
          timestamp: new Date().toISOString(),
          operationType,
          projectName: this.scrubSecrets(projectName),
          result: 'failure',
          validationState: 'invalid',
          durationMs,
          errorMessage: this.scrubSecrets(errString),
          details: details ? this.scrubSecrets(details) : undefined,
          retryable,
          metadata,
        };
        this.addEntry(entry);
        return entry;
      },
      recordWarning: (warningMessage, details, metadata) => {
        const durationMs = Math.round(performance.now() - startTime);
        const entry: AuditLogEntry = {
          id,
          timestamp: new Date().toISOString(),
          operationType,
          projectName: this.scrubSecrets(projectName),
          result: 'warning',
          validationState: 'fallback_sanitized',
          durationMs,
          errorMessage: this.scrubSecrets(warningMessage),
          details: details ? this.scrubSecrets(details) : undefined,
          retryable: false,
          metadata,
        };
        this.addEntry(entry);
        return entry;
      },
    };
  }

  /**
   * Add entry to history and notify subscribers
   */
  public static addEntry(entry: AuditLogEntry): void {
    this.init();
    this.memoryEntries.unshift(entry);
    if (this.memoryEntries.length > MAX_LOG_ENTRIES) {
      this.memoryEntries = this.memoryEntries.slice(0, MAX_LOG_ENTRIES);
    }
    this.persist();
    this.notify();
  }

  /**
   * Retrieve all audit entries
   */
  public static getEntries(): AuditLogEntry[] {
    this.init();
    return [...this.memoryEntries];
  }

  /**
   * Clear all audit entries
   */
  public static clear(): void {
    this.memoryEntries = [];
    this.persist();
    this.notify();
  }

  /**
   * Subscribe to log changes
   */
  public static subscribe(listener: (entries: AuditLogEntry[]) => void): () => void {
    this.init();
    this.subscribers.add(listener);
    listener(this.getEntries());
    return () => {
      this.subscribers.delete(listener);
    };
  }

  private static persist(): void {
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(this.memoryEntries));
      }
    } catch {
      // LocalStorage full or quota exceeded
    }
  }

  private static notify(): void {
    const list = this.getEntries();
    this.subscribers.forEach((fn) => {
      try {
        fn(list);
      } catch (err) {
        console.error('AuditLogger subscriber error:', err);
      }
    });
  }
}
