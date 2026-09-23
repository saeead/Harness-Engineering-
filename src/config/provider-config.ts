/**
 * Provider Configuration & Credential Store
 * Isolates sensitive credentials from UI, logs, and generated files.
 * Provides explicit clearing mechanisms.
 */

import { AIProviderId, RepositoryProviderId } from '../domain/models';

export interface AIProviderConfig {
  providerId: AIProviderId;
  modelName?: string;
  temperature?: number;
  apiEndpoint?: string;
  hasCustomKey: boolean;
}

export interface RepositoryProviderConfig {
  providerId: RepositoryProviderId;
  defaultBranch: string;
  hasCustomToken: boolean;
  defaultOwner?: string;
}

// In-memory credential cache to minimize storage exposure
const SENSITIVE_CREDENTIALS_STORE: {
  aiKeys: Partial<Record<AIProviderId, string>>;
  repoTokens: Partial<Record<RepositoryProviderId, string>>;
} = {
  aiKeys: {},
  repoTokens: {},
};

const CREDENTIAL_STORAGE_PREFIX = 'harness_gen:creds:';

export class CredentialManager {
  /**
   * Safely set an AI API Key without leaking to logs or UI.
   */
  static setAIKey(providerId: AIProviderId, key: string, persistInSession = false): void {
    const trimmed = key.trim();
    if (!trimmed) {
      delete SENSITIVE_CREDENTIALS_STORE.aiKeys[providerId];
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(`${CREDENTIAL_STORAGE_PREFIX}ai_${providerId}`);
      }
      return;
    }

    SENSITIVE_CREDENTIALS_STORE.aiKeys[providerId] = trimmed;
    if (persistInSession && typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(`${CREDENTIAL_STORAGE_PREFIX}ai_${providerId}`, trimmed);
      } catch {
        // Fallback to in-memory only
      }
    }
  }

  /**
   * Get an AI Key internally for service calls only. Never log this value!
   */
  static getAIKey(providerId: AIProviderId): string | undefined {
    if (SENSITIVE_CREDENTIALS_STORE.aiKeys[providerId]) {
      return SENSITIVE_CREDENTIALS_STORE.aiKeys[providerId];
    }
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const stored = window.sessionStorage.getItem(`${CREDENTIAL_STORAGE_PREFIX}ai_${providerId}`);
        if (stored) {
          SENSITIVE_CREDENTIALS_STORE.aiKeys[providerId] = stored;
          return stored;
        }
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  /**
   * Check if a key exists without exposing the key value.
   */
  static hasAIKey(providerId: AIProviderId): boolean {
    return Boolean(this.getAIKey(providerId));
  }

  /**
   * Set Repository Token safely.
   */
  static setRepoToken(providerId: RepositoryProviderId, token: string, persistInSession = false): void {
    const trimmed = token.trim();
    if (!trimmed) {
      delete SENSITIVE_CREDENTIALS_STORE.repoTokens[providerId];
      if (typeof window !== 'undefined' && window.sessionStorage) {
        window.sessionStorage.removeItem(`${CREDENTIAL_STORAGE_PREFIX}repo_${providerId}`);
      }
      return;
    }

    SENSITIVE_CREDENTIALS_STORE.repoTokens[providerId] = trimmed;
    if (persistInSession && typeof window !== 'undefined' && window.sessionStorage) {
      try {
        window.sessionStorage.setItem(`${CREDENTIAL_STORAGE_PREFIX}repo_${providerId}`, trimmed);
      } catch {
        // Fallback to in-memory only
      }
    }
  }

  static getRepoToken(providerId: RepositoryProviderId): string | undefined {
    if (SENSITIVE_CREDENTIALS_STORE.repoTokens[providerId]) {
      return SENSITIVE_CREDENTIALS_STORE.repoTokens[providerId];
    }
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const stored = window.sessionStorage.getItem(`${CREDENTIAL_STORAGE_PREFIX}repo_${providerId}`);
        if (stored) {
          SENSITIVE_CREDENTIALS_STORE.repoTokens[providerId] = stored;
          return stored;
        }
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  static hasRepoToken(providerId: RepositoryProviderId): boolean {
    return Boolean(this.getRepoToken(providerId));
  }

  /**
   * Clear all sensitive credentials from memory and session storage.
   */
  static clearAllCredentials(): void {
    SENSITIVE_CREDENTIALS_STORE.aiKeys = {};
    SENSITIVE_CREDENTIALS_STORE.repoTokens = {};
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        const keysToRemove: string[] = [];
        for (let i = 0; i < window.sessionStorage.length; i++) {
          const k = window.sessionStorage.key(i);
          if (k && k.startsWith(CREDENTIAL_STORAGE_PREFIX)) {
            keysToRemove.push(k);
          }
        }
        keysToRemove.forEach((k) => window.sessionStorage.removeItem(k));
      } catch {
        // Ignore
      }
    }
  }
}
