/**
 * Local AI Model Provider
 * Connects to local runner environments (Ollama, LM Studio, LocalAI) without cloud transmission.
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
import { AIProvider } from './ai-provider.interface';
import { DeterministicAnalysisProvider } from './deterministic-analysis.provider';

export interface LocalModelConfig {
  endpoint: string;
  model: string;
  temperature?: number;
  maxTokens?: number;
}

export class LocalModelProvider implements AIProvider {
  readonly id: AIProviderId = 'local_model';
  readonly name = 'Local Model (Ollama / LocalAI / LM Studio)';

  private config: LocalModelConfig = {
    endpoint: 'http://localhost:11434',
    model: 'qwen2.5-coder:latest',
    temperature: 0.2,
    maxTokens: 4096,
  };

  private detailedStatus: DetailedProviderStatus = 'not_configured';
  private statusMessage = 'Local endpoint not tested yet.';
  private lastLatencyMs?: number;
  private fallbackProvider = new DeterministicAnalysisProvider();

  constructor() {
    this.loadSavedConfig();
  }

  private loadSavedConfig(): void {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const raw = window.localStorage.getItem('harness_gen:config:local_model');
        if (raw) {
          const parsed = JSON.parse(raw);
          this.config = { ...this.config, ...parsed };
          this.detailedStatus = 'configured';
          this.statusMessage = `Configured for ${this.config.endpoint} (${this.config.model})`;
        }
      } catch {
        // Ignore storage read error
      }
    }
  }

  saveConfig(newConfig: Partial<LocalModelConfig>): void {
    this.config = { ...this.config, ...newConfig };
    this.detailedStatus = 'configured';
    this.statusMessage = `Configured for ${this.config.endpoint} (${this.config.model})`;
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem('harness_gen:config:local_model', JSON.stringify(this.config));
      } catch {
        // Ignore storage write error
      }
    }
  }

  getConfig(): LocalModelConfig {
    return { ...this.config };
  }

  getInfo(): AIProviderInfo {
    return {
      id: this.id,
      name: this.name,
      description: 'Local-first inference running on your machine with zero data egress.',
      capabilities: {
        supportsStreaming: true,
        supportsContextCaching: false,
        requiresAuth: false,
        isLocalOnly: true,
        maxContextTokens: 32768,
      },
      isConfigured: this.detailedStatus === 'configured' || this.detailedStatus === 'connected',
      status:
        this.detailedStatus === 'connected'
          ? 'available'
          : this.detailedStatus === 'failed'
          ? 'error'
          : 'unconfigured',
      detailedStatus: this.detailedStatus,
      statusMessage: this.statusMessage,
      latencyMs: this.lastLatencyMs,
    };
  }

  async isReady(): Promise<boolean> {
    return this.detailedStatus === 'connected';
  }

  /**
   * Tests connection to local server and measures latency
   */
  async testConnection(customEndpoint?: string, customModel?: string): Promise<{
    success: boolean;
    models: string[];
    latencyMs: number;
    error?: string;
  }> {
    const endpoint = (customEndpoint || this.config.endpoint).replace(/\/+$/, '');
    const model = customModel || this.config.model;
    const start = performance.now();
    this.detailedStatus = 'testing';
    this.statusMessage = 'Connecting to local endpoint...';

    try {
      // First try Ollama tags API
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(`${endpoint}/api/tags`, {
        signal: controller.signal,
      }).catch(async () => {
        // Fallback check: OpenAI compatible /v1/models (LM Studio, LocalAI)
        return await fetch(`${endpoint}/v1/models`, { signal: controller.signal });
      });

      clearTimeout(timeoutId);

      const latencyMs = Math.round(performance.now() - start);
      this.lastLatencyMs = latencyMs;

      if (!res.ok) {
        this.detailedStatus = 'failed';
        this.statusMessage = `Server responded with HTTP ${res.status}`;
        return {
          success: false,
          models: [],
          latencyMs,
          error: `Server responded with status ${res.status}`,
        };
      }

      const data = await res.json();
      let modelsList: string[] = [];

      if (Array.isArray(data.models)) {
        // Ollama response format
        modelsList = data.models.map((m: { name?: string }) => m.name || '').filter(Boolean);
      } else if (Array.isArray(data.data)) {
        // OpenAI compatible format
        modelsList = data.data.map((m: { id?: string }) => m.id || '').filter(Boolean);
      }

      this.detailedStatus = 'connected';
      this.statusMessage = `Connected to ${endpoint}. Available models: ${modelsList.length || 'default'}`;

      if (customEndpoint || customModel) {
        this.saveConfig({
          endpoint,
          model: modelsList.includes(model) ? model : modelsList[0] || model,
        });
      }

      return {
        success: true,
        models: modelsList,
        latencyMs,
      };
    } catch (err: unknown) {
      const latencyMs = Math.round(performance.now() - start);
      this.detailedStatus = 'failed';
      const msg = (err as Error).message || 'Connection refused';
      this.statusMessage = `Could not reach ${endpoint}. Is Ollama or LM Studio running? (${msg})`;
      return {
        success: false,
        models: [],
        latencyMs,
        error: `Could not connect to ${endpoint}. Check if your local model server is running.`,
      };
    }
  }

  async analyzeSpecification(spec: ProjectSpecification): Promise<ProjectAnalysis> {
    if (this.detailedStatus === 'connected') {
      try {
        const prompt = `Analyze this software project specification and return a structured JSON evaluation:
Project: ${spec.name} (${spec.projectType})
Description: ${spec.description}
Constraints: ${(spec.constraints || []).join('; ')}
Technical: ${(spec.technicalRequirements || []).join('; ')}`;

        const res = await fetch(`${this.config.endpoint}/api/generate`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            model: this.config.model,
            prompt,
            stream: false,
            format: 'json',
          }),
        });

        if (res.ok) {
          const json = await res.json();
          const parsed = JSON.parse(json.response || '{}');
          if (parsed.understoodRequirements) {
            return {
              ...parsed,
              analyzedAt: new Date().toISOString(),
              providerId: this.id,
              confidenceScore: 0.9,
            };
          }
        }
      } catch {
        // Fallback to deterministic provider if local call fails
      }
    }
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
