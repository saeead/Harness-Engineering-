/**
 * Provider Domain Models
 * Defines provider types, capabilities, identification, and status.
 */

export type ProviderType = 'ai' | 'repository' | 'storage' | 'exporter';

export type AIProviderId =
  | 'gemini'
  | 'local_model'
  | 'mock_harness_engine'
  | 'custom_api';

export type RepositoryProviderId = 'github' | 'local_fs' | 'mock_repo';

export type StorageProviderId = 'browser_local' | 'memory';

export type ExporterId = 'zip_exporter' | 'github_exporter' | 'json_exporter';

export interface ProviderCapabilities {
  supportsStreaming?: boolean;
  supportsContextCaching?: boolean;
  maxContextTokens?: number;
  requiresAuth: boolean;
  isLocalOnly: boolean;
  supportedFormats?: string[];
}

export type ProviderStatus = 'available' | 'unconfigured' | 'offline' | 'error';

export type DetailedProviderStatus =
  | 'not_configured'
  | 'configured'
  | 'testing'
  | 'connected'
  | 'failed'
  | 'disabled';

export interface AIProviderInfo {
  id: AIProviderId;
  name: string;
  description: string;
  capabilities: ProviderCapabilities;
  isConfigured: boolean;
  status: ProviderStatus;
  detailedStatus?: DetailedProviderStatus;
  statusMessage?: string;
  latencyMs?: number;
}

export interface RepositoryProviderInfo {
  id: RepositoryProviderId;
  name: string;
  description: string;
  capabilities: ProviderCapabilities;
  isConfigured: boolean;
  status: ProviderStatus;
  detailedStatus?: DetailedProviderStatus;
  statusMessage?: string;
  authenticatedUser?: string;
}


export interface StorageProviderInfo {
  id: StorageProviderId;
  name: string;
  isSupported: boolean;
}
