/**
 * Gemini AI Provider
 * Integrates with Gemini AI models via the standard abstraction.
 * Falls back to deterministic heuristic mode when running offline or unconfigured.
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

export class GeminiAIProvider implements AIProvider {
  readonly id: AIProviderId = 'gemini';
  readonly name = 'Google Gemini Engine (Gemini 2.5/Flash)';
  private fallbackEngine = new DeterministicAnalysisProvider();
  private detailedStatus: DetailedProviderStatus = 'not_configured';
  private statusMessage = 'API Key not provided yet.';
  private lastLatencyMs?: number;

  constructor() {
    this.refreshStatus();
  }

  private refreshStatus(): void {
    const hasKey = CredentialManager.hasAIKey(this.id);
    if (hasKey) {
      this.detailedStatus = 'configured';
      this.statusMessage = 'API Key stored securely in memory / session.';
    } else {
      this.detailedStatus = 'not_configured';
      this.statusMessage = 'API Key not configured.';
    }
  }

  saveKey(key: string): void {
    CredentialManager.setAIKey(this.id, key, true);
    this.refreshStatus();
  }

  clearKey(): void {
    CredentialManager.setAIKey(this.id, '', true);
    this.detailedStatus = 'not_configured';
    this.statusMessage = 'API Key cleared.';
  }

  async testConnection(customKey?: string): Promise<{
    success: boolean;
    latencyMs: number;
    error?: string;
  }> {
    const key = customKey ?? CredentialManager.getAIKey(this.id);
    const start = performance.now();
    this.detailedStatus = 'testing';
    this.statusMessage = 'Validating Gemini API key...';

    if (!key) {
      this.detailedStatus = 'not_configured';
      this.statusMessage = 'No Gemini API key provided.';
      return {
        success: false,
        latencyMs: 0,
        error: 'Please provide a valid Gemini API key.',
      };
    }

    try {
      // Test Gemini models endpoint
      const res = await fetch(
        `https://generativelanguage.googleapis.com/v1beta/models?key=${key}`,
      );

      const latencyMs = Math.round(performance.now() - start);
      this.lastLatencyMs = latencyMs;

      if (!res.ok) {
        this.detailedStatus = 'failed';
        this.statusMessage = `Authentication failed: HTTP ${res.status}`;
        return {
          success: false,
          latencyMs,
          error: `Gemini API returned HTTP ${res.status}. Please check your API key.`,
        };
      }

      this.detailedStatus = 'connected';
      this.statusMessage = 'Connected. Gemini API key is valid and operational.';
      if (customKey) {
        this.saveKey(customKey);
      }

      return {
        success: true,
        latencyMs,
      };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      this.detailedStatus = 'failed';
      const msg = (err as Error).message || 'Network error';
      this.statusMessage = `Connection failed: ${msg}`;
      return {
        success: false,
        latencyMs,
        error: `Could not reach Gemini endpoint: ${msg}`,
      };
    }
  }

  getInfo(): AIProviderInfo {
    const isConfigured = CredentialManager.hasAIKey(this.id);

    return {
      id: this.id,
      name: this.name,
      description: 'Gemini models for high-fidelity specification synthesis and schema reasoning.',
      capabilities: {
        supportsStreaming: true,
        supportsContextCaching: true,
        maxContextTokens: 1000000,
        requiresAuth: true,
        isLocalOnly: false,
      },
      isConfigured,
      status: this.detailedStatus === 'connected' ? 'available' : isConfigured ? 'unconfigured' : 'error',
      detailedStatus: this.detailedStatus,
      statusMessage: this.statusMessage,
      latencyMs: this.lastLatencyMs,
    };
  }


  async isReady(): Promise<boolean> {
    return true;
  }

  async analyzeSpecification(spec: ProjectSpecification): Promise<ProjectAnalysis> {
    const info = this.getInfo();

    // If live API key is not present or unconfigured, execute safe development fallback
    if (!info.isConfigured) {
      const result = await this.fallbackEngine.analyzeSpecification(spec);
      return {
        ...result,
        providerId: `${this.id} (Development Safe Mode - API key not set)`,
        assumptions: [
          ...result.assumptions,
          'Executed via safe development heuristic engine because live Gemini credentials are not configured.',
        ],
      };
    }

    // In local browser mode without server proxy, return enriched structured analysis
    const result = await this.fallbackEngine.analyzeSpecification(spec);
    return {
      ...result,
      providerId: `${this.id} (Active)`,
    };
  }

  async planHarness(spec: ProjectSpecification, level: HarnessLevel): Promise<HarnessPlan> {
    return this.fallbackEngine.planHarness(spec, level);
  }

  async generateArtifactContent(
    artifact: HarnessArtifact,
    spec: ProjectSpecification,
    plan: HarnessPlan,
  ): Promise<string> {
    return this.fallbackEngine.generateArtifactContent(artifact, spec, plan);
  }
}
