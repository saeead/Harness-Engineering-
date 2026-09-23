/**
 * Provider State
 * Tracks configured AI and Repository providers, discovery, and credential existence.
 * Does NOT hold raw secrets in React state.
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import {
  AIProviderId,
  AIProviderInfo,
  RepositoryProviderId,
  RepositoryProviderInfo,
} from '../domain/models';
import { CredentialManager } from '../config/provider-config';

interface ProviderContextValue {
  activeAIProviderId: AIProviderId;
  activeRepoProviderId: RepositoryProviderId;
  availableAIProviders: AIProviderInfo[];
  availableRepoProviders: RepositoryProviderInfo[];
  hasAICredential: (id: AIProviderId) => boolean;
  hasRepoCredential: (id: RepositoryProviderId) => boolean;
  setActiveAIProvider: (id: AIProviderId) => void;
  setActiveRepoProvider: (id: RepositoryProviderId) => void;
  clearAllCredentials: () => void;
}

const DEFAULT_AI_PROVIDERS: AIProviderInfo[] = [
  {
    id: 'gemini',
    name: 'Gemini Models (@google/genai)',
    description: 'Server-side / proxy-mediated Gemini model provider with structured JSON generation.',
    capabilities: {
      supportsStreaming: true,
      supportsContextCaching: true,
      maxContextTokens: 1000000,
      requiresAuth: true,
      isLocalOnly: false,
    },
    isConfigured: true,
    status: 'available',
  },
  {
    id: 'local_model',
    name: 'Local Model Endpoint (Ollama / LocalAI)',
    description: 'Direct local API provider for privacy-preserving offline harness engineering.',
    capabilities: {
      supportsStreaming: true,
      maxContextTokens: 32000,
      requiresAuth: false,
      isLocalOnly: true,
    },
    isConfigured: false,
    status: 'unconfigured',
  },
  {
    id: 'mock_harness_engine',
    name: 'Deterministic Harness Engine (Hermetic)',
    description: 'Zero-API local heuristic engine adhering strictly to phase rules and architectural templates.',
    capabilities: {
      supportsStreaming: false,
      requiresAuth: false,
      isLocalOnly: true,
    },
    isConfigured: true,
    status: 'available',
  },
];

const DEFAULT_REPO_PROVIDERS: RepositoryProviderInfo[] = [
  {
    id: 'github',
    name: 'GitHub Repository Provider',
    description: 'Exports pull requests or branches directly to remote GitHub repositories.',
    capabilities: {
      requiresAuth: true,
      isLocalOnly: false,
      supportedFormats: ['github_pr', 'github_direct'],
    },
    isConfigured: false,
    status: 'unconfigured',
  },
  {
    id: 'local_fs',
    name: 'Local Filesystem / Download Bundle',
    description: 'Packages harness artifacts into a local zip or directory archive without external network calls.',
    capabilities: {
      requiresAuth: false,
      isLocalOnly: true,
      supportedFormats: ['zip', 'directory_bundle', 'raw_json'],
    },
    isConfigured: true,
    status: 'available',
  },
];

const ProviderContext = createContext<ProviderContextValue | null>(null);

export function ProviderStateProvider({ children }: { children: React.ReactNode }) {
  const [activeAIProviderId, setActiveAIProviderId] = useState<AIProviderId>('gemini');
  const [activeRepoProviderId, setActiveRepoProviderId] = useState<RepositoryProviderId>('local_fs');
  const [credentialVersion, setCredentialVersion] = useState<number>(0);

  const availableAIProviders = useMemo(() => {
    return DEFAULT_AI_PROVIDERS.map((p) => ({
      ...p,
      isConfigured: p.capabilities.requiresAuth
        ? CredentialManager.hasAIKey(p.id) || p.id === 'gemini'
        : true,
    }));
  }, [credentialVersion]);

  const availableRepoProviders = useMemo(() => {
    return DEFAULT_REPO_PROVIDERS.map((p) => ({
      ...p,
      isConfigured: p.capabilities.requiresAuth
        ? CredentialManager.hasRepoToken(p.id)
        : true,
    }));
  }, [credentialVersion]);

  const hasAICredential = (id: AIProviderId): boolean => {
    return CredentialManager.hasAIKey(id);
  };

  const hasRepoCredential = (id: RepositoryProviderId): boolean => {
    return CredentialManager.hasRepoToken(id);
  };

  const clearAllCredentials = () => {
    CredentialManager.clearAllCredentials();
    setCredentialVersion((v) => v + 1);
  };

  const value = useMemo(
    () => ({
      activeAIProviderId,
      activeRepoProviderId,
      availableAIProviders,
      availableRepoProviders,
      hasAICredential,
      hasRepoCredential,
      setActiveAIProvider: setActiveAIProviderId,
      setActiveRepoProvider: setActiveRepoProviderId,
      clearAllCredentials,
    }),
    [activeAIProviderId, activeRepoProviderId, availableAIProviders, availableRepoProviders],
  );

  return (
    <ProviderContext.Provider value={value}>
      {children}
    </ProviderContext.Provider>
  );
}

export function useProviderState(): ProviderContextValue {
  const context = useContext(ProviderContext);
  if (!context) {
    throw new Error('useProviderState must be used within a ProviderStateProvider');
  }
  return context;
}
