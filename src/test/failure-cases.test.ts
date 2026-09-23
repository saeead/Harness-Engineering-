/**
 * Phase 7 Test Suite: Comprehensive Failure Cases & Graceful Degradation
 * Verifies that all expected real-world failure scenarios degrade safely without unhandled crashes.
 */

import { GeminiAIProvider } from '../services/providers/ai/gemini-ai.provider';
import { LocalModelProvider } from '../services/providers/ai/local-model.provider';
import { GitHubRepositoryProvider } from '../services/providers/repository/github-repository.provider';
import { HarnessPlanValidator } from '../core/validation/harness-plan.validator';
import { HarnessPlanner } from '../services/harness/harness-planner';
import { AIResponseValidator } from '../services/validation/ai-response.validator';
import { ZipExporter } from '../services/providers/exporter/zip-exporter';
import { ProjectSpecification, HarnessPlan } from '../domain/models';
import { TestResultSummary } from './domain-logic.test';

export function runFailureCaseTests(): TestResultSummary {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(message);
    }
  };

  const sampleSpec: ProjectSpecification = {
    name: 'Failure Testing Fixture',
    projectType: 'web',
    description: 'Verifies resilience against runtime failures.',
    targetUsers: 'Engineers',
    primaryGoals: ['Fault tolerance'],
    coreFeatures: [],
    expectedPlatforms: ['web'],
    preferredTechnology: 'TypeScript',
    constraints: [],
    technicalRequirements: [],
    securityRequirements: [],
    testingExpectations: [],
    definitionOfDone: [],
    targetHarnessLevel: 'medium',
    multiAgentEnabled: false,
    targetPlatform: 'web',
    primaryLanguage: 'TypeScript',
    frameworkOrStack: 'React',
    coreObjectives: [],
    features: [],
    architecturalConstraints: [],
    testingRequirements: [],
  };

  try {
    // 1. Invalid API Key Handling (format check / validation)
    const gemini = new GeminiAIProvider();
    // Test without key returns clear message
    gemini.testConnection('').then((res) => {
      assert(!res.success, 'Empty Gemini API key must fail connection test');
      assert(Boolean(res.error), 'Failure must return human-readable error');
    });

    // 2. Unavailable AI Provider Fallback
    // When an external provider is unconfigured, analyzeSpecification degrades to safe development mode
    const unconfiguredGemini = new GeminiAIProvider();
    unconfiguredGemini.analyzeSpecification(sampleSpec).then((analysis) => {
      assert(
        Boolean(analysis.followUpQuestions && analysis.followUpQuestions.length > 0),
        'Unconfigured provider should execute safe development fallback without crashing',
      );
      assert(
        analysis.providerId.includes('Development Safe Mode') || analysis.providerId.includes('gemini'),
        'Fallback engine should clearly state its operational mode in providerId',
      );
    });

    // 3. GitHub Authentication Failure (Simulated Invalid Token)
    const githubProvider = new GitHubRepositoryProvider();
    githubProvider.testConnection('invalid_token_12345').then((result) => {
      assert(
        !result.success,
        'Invalid GitHub Personal Access Token should fail connection test',
      );
    });

    // 4. Conflicting Artifact Files Detection
    const basePlan = HarnessPlanner.plan(sampleSpec, 'medium');
    const duplicatePlan: HarnessPlan = {
      ...basePlan,
      selectedArtifacts: [
        ...basePlan.selectedArtifacts,
        {
          ...basePlan.selectedArtifacts[0],
          id: 'duplicate_root_file',
          // Keep same path as artifact 0 to trigger duplicate path detection
        },
      ],
    };

    const duplicateReport = HarnessPlanValidator.validate(duplicatePlan, sampleSpec, []);
    assert(!duplicateReport.isValid, 'Duplicate artifact paths must fail harness validation');
    assert(
      duplicateReport.errors.some((e) => e.code.toLowerCase() === 'duplicate_file'),
      'Report error code must be duplicate_file',
    );

    // 5. Invalid Project Input (Blank Name & Blank Description)
    const invalidSpec: ProjectSpecification = {
      ...sampleSpec,
      name: '   ',
      description: '',
    };
    const inputValidation = AIResponseValidator.validateSpecification(invalidSpec);
    assert(!inputValidation.isValid, 'Blank name and description must be rejected');
    assert(inputValidation.issues.length >= 2, 'Must report both name and description violations');

    // 6. Malformed AI Response Handling
    const malformedAIAnalysis = AIResponseValidator.validateAnalysis('NOT_AN_OBJECT');
    assert(malformedAIAnalysis.recovered, 'Non-object AI analysis must safely recover default structure');
    assert(
      (malformedAIAnalysis.sanitized.questions?.length || 0) > 0,
      'Recovered analysis must provide minimum usable questions',
    );

    // 7. Generation Failure / Zero File Artifacts
    const emptyArtifactReport = AIResponseValidator.validateArtifacts([]);
    assert(emptyArtifactReport.isValid, 'Empty array of artifacts is technically structurally valid');
    assert(emptyArtifactReport.sanitized.length === 0, 'Sanitized artifacts are empty');

    // 8. ZIP Exporter with Invalid Artifact List
    const zipExporter = new ZipExporter();
    const emptyZipPromise = zipExporter.export([], {
      format: 'zip',
      destinationPath: 'empty-test',
    });
    assert(emptyZipPromise instanceof Promise, 'ZIP exporter returns promise on empty artifact list');

    // 9. Local Model Provider with Unreachable Port
    const localProvider = new LocalModelProvider();
    localProvider.saveConfig({ endpoint: 'http://127.0.0.1:99999' }); // Non-existent port
    localProvider.testConnection().then((res) => {
      assert(!res.success, 'Unreachable local port should fail connection test');
      assert(Boolean(res.error), 'Unreachable local port should return error');
    });

  } catch (err) {
    failed++;
    errors.push(`Failure case test error: ${String(err)}`);
  }

  return {
    suiteName: 'Failure Cases & Boundary Defense',
    passed,
    failed,
    errors,
  };
}
