/**
 * Deterministic AI Analysis Provider (Hermetic Local Engine)
 * Analyzes project specifications without external API dependencies.
 * Produces structured understanding, missing information, ambiguities, assumptions, and targeted questions.
 */

import {
  AIProviderId,
  AIProviderInfo,
  AnalysisQuestion,
  HarnessArtifact,
  HarnessLevel,
  HarnessPlan,
  ProjectAnalysis,
  ProjectSpecification,
  SuggestedField,
} from '../../../domain/models';
import { AIProvider } from './ai-provider.interface';

import { HarnessPlanner } from '../../harness/harness-planner';
import { ArtifactGenerator } from '../../harness/artifact-generator';

export class DeterministicAnalysisProvider implements AIProvider {

  readonly id: AIProviderId = 'mock_harness_engine';
  readonly name = 'Hermetic Heuristic Engine (Offline / Safe)';

  getInfo(): AIProviderInfo {
    return {
      id: this.id,
      name: this.name,
      description: 'Zero-API local heuristic engine adhering strictly to software engineering principles and harness topology rules.',
      capabilities: {
        supportsStreaming: false,
        supportsContextCaching: false,
        requiresAuth: false,
        isLocalOnly: true,
      },
      isConfigured: true,
      status: 'available',
    };
  }

  async isReady(): Promise<boolean> {
    return true;
  }

  async analyzeSpecification(spec: ProjectSpecification): Promise<ProjectAnalysis> {
    // Artificial slight delay for realistic async workflow feedback
    await new Promise((resolve) => setTimeout(resolve, 600));

    const understoodRequirements: string[] = [];
    const missingInformation: string[] = [];
    const ambiguities: string[] = [];
    const assumptions: string[] = [];
    const suggestedFields: SuggestedField[] = [];
    const followUpQuestions: AnalysisQuestion[] = [];

    // 1. Analyze Understood Requirements
    if (spec.name) {
      understoodRequirements.push(`Project Identifier: "${spec.name}" target product.`);
    }
    understoodRequirements.push(`Product Category: ${spec.projectType.toUpperCase()} architecture.`);
    if (spec.targetUsers) {
      understoodRequirements.push(`Target Demographic / Audience: ${spec.targetUsers}.`);
    } else {
      understoodRequirements.push('Target Demographic: General developer / end-user persona (implicit).');
    }
    if (spec.preferredTechnology) {
      understoodRequirements.push(`Technology Stack Baseline: ${spec.preferredTechnology}.`);
    }
    if (spec.primaryGoals && spec.primaryGoals.length > 0) {
      spec.primaryGoals.forEach((goal) => {
        understoodRequirements.push(`Primary Goal: ${goal}`);
      });
    }
    if (spec.coreFeatures && spec.coreFeatures.length > 0) {
      spec.coreFeatures.forEach((f) => {
        understoodRequirements.push(`Feature [${f.priority.toUpperCase()}]: ${f.title}`);
      });
    }

    // 2. Detect Missing Information
    if (!spec.targetUsers || spec.targetUsers.trim().length === 0) {
      missingInformation.push('Target user personas and permission tiers (e.g. admin vs standard user) are unspecified.');
      suggestedFields.push({
        field: 'targetUsers',
        label: 'Target Users',
        suggestedValue: 'Developers, DevOps Engineers, and Project Leads requiring reproducible environments.',
        rationale: 'Clarifying user roles prevents agent confusion when building access control and UI flows.',
      });
    }

    if (!spec.securityRequirements || spec.securityRequirements.length === 0) {
      missingInformation.push('Security and data protection boundaries are not explicitly declared.');
      suggestedFields.push({
        field: 'securityRequirements',
        label: 'Security Requirements',
        suggestedValue: 'Local-first zero credential leakage, sanitize external inputs, no remote telemetry without consent.',
        rationale: 'AI coding agents require strict guardrails to avoid hardcoding secrets or creating insecure endpoints.',
      });
      followUpQuestions.push({
        id: 'q_security_boundary',
        category: 'security',
        question: 'Does this project handle sensitive user tokens, private data, or remote authentication?',
        options: [
          'Yes - Requires strict local credential isolation and no remote logging',
          'No - Purely local computation with public/sample data only',
          'Multi-tenant - Requires full RBAC role-based authorization',
        ],
        suggestedAnswer: 'Yes - Requires strict local credential isolation and no remote logging',
      });
    }

    if (!spec.testingExpectations || spec.testingExpectations.length === 0) {
      missingInformation.push('Automated testing strategy and test runner commands are not specified.');
      suggestedFields.push({
        field: 'testingExpectations',
        label: 'Testing Expectations',
        suggestedValue: 'Unit tests for core pure logic, integration tests for provider boundaries, strict type-checking.',
        rationale: 'Without explicit testing requirements, agents cannot produce evidence-based completion verification.',
      });
      followUpQuestions.push({
        id: 'q_testing_strategy',
        category: 'testing',
        question: 'What is the required verification gate before an agent declares a feature complete?',
        options: [
          'Static type checking + unit tests with minimum 80% coverage',
          'End-to-end integration tests and build verification',
          'Manual evidence checklist and clean linting output',
        ],
        suggestedAnswer: 'Static type checking + unit tests with minimum 80% coverage',
      });
    }

    if (!spec.constraints || spec.constraints.length === 0) {
      missingInformation.push('Architectural constraints and prohibited libraries or anti-patterns are undefined.');
      followUpQuestions.push({
        id: 'q_architectural_constraints',
        category: 'architecture',
        question: 'Are there specific libraries, heavy frameworks, or backend dependencies prohibited in this project?',
        options: [
          'Prohibit heavy backend databases; enforce local-first persistence',
          'No third-party UI component libraries (use pure Tailwind primitives)',
          'No restrictions; standard ecosystem packages permitted',
        ],
        suggestedAnswer: 'Prohibit heavy backend databases; enforce local-first persistence',
      });
    }

    if (!spec.definitionOfDone || spec.definitionOfDone.length === 0) {
      missingInformation.push('Explicit Definition of Done (DoD) checklist is absent.');
      suggestedFields.push({
        field: 'definitionOfDone',
        label: 'Definition of Done',
        suggestedValue: 'Code compiles, tests pass, state.json is updated, and session handoff note is written.',
        rationale: 'Durable AI agent handoffs require concrete evidence before concluding a task.',
      });
    }

    // 3. Detect Ambiguities
    const descLower = (spec.description || '').toLowerCase();
    if (descLower.includes('fast') || descLower.includes('scalable') || descLower.includes('modern')) {
      ambiguities.push('Vague descriptors ("fast", "modern") used without quantitative benchmarks or SLA limits.');
    }
    if (!spec.preferredTechnology || spec.preferredTechnology.trim().length === 0) {
      ambiguities.push('Primary programming language or runtime ecosystem is not firmly locked down.');
      followUpQuestions.push({
        id: 'q_runtime_ecosystem',
        category: 'stack',
        question: 'Which primary runtime and language ecosystem should be enforced across agent sessions?',
        options: [
          'TypeScript / React / Node.js (Vite baseline)',
          'Python 3.12+ (Type hinted / Poetry / Pytest)',
          'Rust 2021 Edition (Cargo / Clippy)',
          'Go 1.22+ (Standard library / Go modules)',
        ],
        suggestedAnswer: 'TypeScript / React / Node.js (Vite baseline)',
      });
    }

    // 4. Document Assumptions
    assumptions.push('The repository itself will act as the durable source of truth (no external cloud DB required).');
    assumptions.push('Multiple coding agents or human developers may alternate between development sessions.');
    if (spec.multiAgentEnabled) {
      assumptions.push('Multi-agent role separation is enabled; individual agents require distinct sub-system boundaries.');
    } else {
      assumptions.push('Single sequential agent or developer session model assumed.');
    }

    // 5. Determine Recommended Harness Level
    let complexityScore = 20; // base
    if (spec.projectType === 'service' || spec.projectType === 'api' || spec.projectType === 'web') {
      complexityScore += 25;
    }
    if (spec.multiAgentEnabled) {
      complexityScore += 30;
    }
    if ((spec.coreFeatures || []).length > 3) {
      complexityScore += 20;
    }
    if (missingInformation.length > 2) {
      complexityScore += 10;
    }

    let recommendedLevel: HarnessLevel = 'medium';
    if (complexityScore < 35 && !spec.multiAgentEnabled) {
      recommendedLevel = 'basic';
    } else if (complexityScore > 75 || spec.multiAgentEnabled) {
      recommendedLevel = 'advanced';
    } else {
      recommendedLevel = 'medium';
    }

    return {
      understoodRequirements,
      missingInformation,
      ambiguities,
      assumptions,
      suggestedFields,
      followUpQuestions,
      recommendedLevel,
      confidenceScore: Math.min(95, Math.max(65, 100 - ambiguities.length * 10 - missingInformation.length * 5)),
      analyzedAt: new Date().toISOString(),
      providerId: this.id,
    };
  }

  async planHarness(spec: ProjectSpecification, level: HarnessLevel): Promise<HarnessPlan> {
    return HarnessPlanner.plan(spec, level);
  }

  async generateArtifactContent(
    artifact: HarnessArtifact,
    spec: ProjectSpecification,
    plan?: HarnessPlan,
  ): Promise<string> {
    const effectivePlan = plan || HarnessPlanner.plan(spec, artifact.targetLevel);
    return ArtifactGenerator.generateSingle(artifact, effectivePlan, spec).content;
  }


}
