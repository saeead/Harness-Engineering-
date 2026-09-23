/**
 * AI Provider Interface
 * Abstraction layer for AI models and generation engines.
 * Future providers (Gemini, Local Models, Anthropic, Custom LLM) implement this interface.
 */

import {
  AIProviderId,
  AIProviderInfo,
  HarnessArtifact,
  HarnessLevel,
  HarnessPlan,
  ProjectAnalysis,
  ProjectSpecification,
} from '../../../domain/models';

export interface AIProvider {
  readonly id: AIProviderId;
  readonly name: string;

  getInfo(): AIProviderInfo;
  isReady(): Promise<boolean>;

  analyzeSpecification(
    spec: ProjectSpecification,
  ): Promise<ProjectAnalysis>;

  planHarness(
    spec: ProjectSpecification,
    level: HarnessLevel,
  ): Promise<HarnessPlan>;

  generateArtifactContent(
    artifact: HarnessArtifact,
    spec: ProjectSpecification,
    plan: HarnessPlan,
  ): Promise<string>;
}

