/**
 * Custom API / OpenAI-Compatible Provider
 * Supports connecting to custom API endpoints or OpenAI/Claude proxies with secure credential handling.
 */

import {
  AIProviderId,
  AIProviderInfo,
  DetailedProviderStatus,
  HarnessArtifact,
  HarnessLevel,
  HarnessPlan,
  ProjectAnalysis,
  ProjectSpecification,
} from '../../../domain/models';
import { CredentialManager } from '../../../config/provider-config';
import { AIProvider } from './ai-provider.interface';
import { DeterministicAnalysisProvider } from './deterministic-analysis.provider';

export interface CustomAPIConfig {
  endpoint: string;
  model: string;
  hasCustomKey: boolean;
}

export class CustomAPIProvider implements AIProvider {
  readonly id: AIProviderId = 'custom_api';
  readonly name = 'Custom API / OpenAI-Compatible';

  private config: CustomAPIConfig = {
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
    hasCustomKey: false,
  };

  private detailedStatus: DetailedProviderStatus = 'not_configured';
  private statusMessage = 'API endpoint and key not configured.';
  private lastLatencyMs?: number;
  private fallbackProvider = new DeterministicAnalysisProvider();

  constructor() {
    this.loadSavedConfig();
  }

  private loadSavedConfig(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem('harness_gen:config:custom_api');
        if (raw) {
          const parsed = JSON.parse(raw);
          this.config = { ...this.config, ...parsed };
          const hasKey = CredentialManager.hasAIKey(this.id);
          this.config.hasCustomKey = hasKey;
          if (hasKey) {
            this.detailedStatus = 'configured';
            this.statusMessage = `Configured for ${this.config.endpoint} (${this.config.model})`;
          }
        }
      } catch {
        // Ignore storage error
      }
    }
  }

  saveConfig(newConfig: Partial<CustomAPIConfig>, apiKey?: string): void {
    this.config = { ...this.config, ...newConfig };
    if (apiKey !== undefined) {
      CredentialManager.setAIKey(this.id, apiKey, true);
      this.config.hasCustomKey = Boolean(apiKey.trim());
    }
    this.detailedStatus = this.config.hasCustomKey ? 'configured' : 'not_configured';
    this.statusMessage = this.config.hasCustomKey
      ? `Configured for ${this.config.endpoint} (${this.config.model})`
      : 'API key is required';

    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(
          'harness_gen:config:custom_api',
          JSON.stringify({ endpoint: this.config.endpoint, model: this.config.model }),
        );
      } catch {
        // Ignore storage error
      }
    }
  }

  getConfig(): CustomAPIConfig {
    return {
      ...this.config,
      hasCustomKey: CredentialManager.hasAIKey(this.id),
    };
  }

  getInfo(): AIProviderInfo {
    const hasKey = CredentialManager.hasAIKey(this.id);
    return {
      id: this.id,
      name: this.name,
      description: 'Connect to any OpenAI-compatible or custom gateway endpoint.',
      capabilities: {
        supportsStreaming: true,
        supportsContextCaching: true,
        requiresAuth: true,
        isLocalOnly: false,
        maxContextTokens: 128000,
      },
      isConfigured: hasKey,
      status: this.detailedStatus === 'connected' ? 'available' : hasKey ? 'unconfigured' : 'error',
      detailedStatus: this.detailedStatus,
      statusMessage: this.statusMessage,
      latencyMs: this.lastLatencyMs,
    };
  }

  async isReady(): Promise<boolean> {
    return this.detailedStatus === 'connected';
  }

  async testConnection(customEndpoint?: string, customKey?: string, customModel?: string): Promise<{
    success: boolean;
    models: string[];
    latencyMs: number;
    error?: string;
  }> {
    const endpoint = (customEndpoint || this.config.endpoint).replace(/\/+$/, '');
    const key = customKey ?? CredentialManager.getAIKey(this.id);
    const start = performance.now();
    this.detailedStatus = 'testing';
    this.statusMessage = 'Connecting to custom endpoint...';

    if (!key) {
      this.detailedStatus = 'not_configured';
      this.statusMessage = 'Missing API Key';
      return {
        success: false,
        models: [],
        latencyMs: 0,
        error: 'Please provide an API key to test the connection.',
      };
    }

    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 6000);

      const res = await fetch(`${endpoint}/models`, {
        signal: controller.signal,
        headers: {
          Authorization: `Bearer ${key}`,
        },
      });

      clearTimeout(timeoutId);
      const latencyMs = Math.round(performance.now() - start);
      this.lastLatencyMs = latencyMs;

      if (!res.ok) {
        this.detailedStatus = 'failed';
        this.statusMessage = `HTTP ${res.status}: ${res.statusText}`;
        return {
          success: false,
          models: [],
          latencyMs,
          error: `API responded with HTTP ${res.status}: ${res.statusText}`,
        };
      }

      const data = await res.json();
      const modelsList: string[] = Array.isArray(data.data)
        ? data.data.map((m: { id?: string }) => m.id || '').filter(Boolean)
        : [];

      this.detailedStatus = 'connected';
      this.statusMessage = `Connected. Verified access to ${modelsList.length} models.`;

      if (customEndpoint || customModel) {
        this.saveConfig({
          endpoint,
          model: customModel || this.config.model,
        }, customKey);
      }

      return {
        success: true,
        models: modelsList,
        latencyMs,
      };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      this.detailedStatus = 'failed';
      const msg = (err as Error).message || 'Connection failed';
      this.statusMessage = `Failed to connect: ${msg}`;
      return {
        success: false,
        models: [],
        latencyMs,
        error: `Connection error: ${msg}`,
      };
    }
  }

  async analyzeSpecification(spec: ProjectSpecification): Promise<ProjectAnalysis> {
    return this.fallbackProvider.analyzeSpecification(spec);
  }

  async planHarness(spec: ProjectSpecification, level: HarnessLevel): Promise<HarnessPlan> {
    return this.fallbackProvider.planHarness(spec, level);
  }

  async generateArtifactContent(
    artifact: HarnessArtifact,
    spec: ProjectSpecification,
    plan: HarnessPlan,
  ): Promise<string> {
    return this.fallbackProvider.generateArtifactContent(artifact, spec, plan);
  }
}
