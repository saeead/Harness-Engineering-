/**
 * AI Provider Registry
 * Allows dynamic registration and discovery of AI generation backends.
 */

import { AIProviderId, AIProviderInfo } from '../../../domain/models';
import { AIProvider } from './ai-provider.interface';
import { DeterministicAnalysisProvider } from './deterministic-analysis.provider';
import { GeminiAIProvider } from './gemini-ai.provider';
import { LocalModelProvider } from './local-model.provider';
import { CustomAPIProvider } from './custom-api.provider';

class AIProviderRegistry {
  private providers = new Map<AIProviderId, AIProvider>();
  private activeProviderId: AIProviderId = 'mock_harness_engine';

  constructor() {
    this.register(new DeterministicAnalysisProvider());
    this.register(new GeminiAIProvider());
    this.register(new LocalModelProvider());
    this.register(new CustomAPIProvider());
  }

  register(provider: AIProvider): void {

    this.providers.set(provider.id, provider);
  }

  get(id: AIProviderId): AIProvider | undefined {
    return this.providers.get(id);
  }

  getActiveProvider(): AIProvider {
    const provider = this.providers.get(this.activeProviderId);
    if (!provider) {
      return new DeterministicAnalysisProvider();
    }
    return provider;
  }

  setActiveProvider(id: AIProviderId): boolean {
    if (this.providers.has(id)) {
      this.activeProviderId = id;
      return true;
    }
    return false;
  }

  listAvailableProviders(): AIProviderInfo[] {
    return Array.from(this.providers.values()).map((p) => p.getInfo());
  }
}

export const aiProviderRegistry = new AIProviderRegistry();
