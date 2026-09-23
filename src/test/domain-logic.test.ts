/**
 * Phase 7 Unit Test Suite: Domain Logic, Invariants & State Transitions
 */

import { ProjectSpecification, HarnessLevel } from '../domain/models';
import { HarnessEngine } from '../services/harness/harness-engine';
import { HarnessPlanner } from '../services/harness/harness-planner';
import { ArtifactGenerator } from '../services/harness/artifact-generator';
import { HarnessPlanValidator } from '../core/validation/harness-plan.validator';
import { Validator } from '../core/validation/validator';
import { AIResponseValidator } from '../services/validation/ai-response.validator';

export interface TestResultSummary {
  suiteName: string;
  passed: number;
  failed: number;
  errors: string[];
}

export function runDomainLogicTests(): TestResultSummary {
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
    name: 'Reliability Test Harness',
    projectType: 'web',
    description: 'Autonomous micro-agent harness with multi-subsystem contract verification.',
    targetUsers: 'Systems Engineers',
    primaryGoals: ['Zero drift', 'Deterministic handoff'],
    coreFeatures: [
      {
        id: 'f1',
        title: 'State Tracking',
        description: 'Machine-readable state preservation across runs',
        priority: 'high',
        status: 'planned',
        verificationCriteria: ['State file exists', 'Valid JSON'],
      },
    ],
    expectedPlatforms: ['web', 'cli'],
    preferredTechnology: 'TypeScript / React',
    constraints: ['No plain secrets', 'Local-first persistence'],
    technicalRequirements: ['Node 20+'],
    securityRequirements: ['Strict secret scrubbing'],
    testingExpectations: ['Unit and failure-mode validation'],
    definitionOfDone: ['Zero linter errors', 'All tests passing'],
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
    // 1. Validator Rules on ProjectSpecification
    const specValidation = AIResponseValidator.validateSpecification(sampleSpec);
    assert(specValidation.isValid, 'Sample spec should pass AIResponseValidator.validateSpecification');

    const emptyNameSpec: ProjectSpecification = { ...sampleSpec, name: '' };
    const emptyValidation = AIResponseValidator.validateSpecification(emptyNameSpec);
    assert(!emptyValidation.isValid, 'Empty project name should fail specification validation');
    assert(
      emptyValidation.issues.some((i) => i.includes('Project name')),
      'Validation issues should cite empty project name',
    );

    // 2. Contradictory Configuration Checks
    const contradictorySpec: ProjectSpecification = {
      ...sampleSpec,
      multiAgentEnabled: true,
      targetHarnessLevel: 'basic',
    };
    const contraValidation = AIResponseValidator.validateSpecification(contradictorySpec);
    assert(!contraValidation.isValid, 'multiAgentEnabled with basic harness level should fail as contradictory');

    // 3. Harness Planner Subsystems by Level
    const basicPlan = HarnessPlanner.plan(sampleSpec, 'basic');
    assert(basicPlan.level === 'basic', 'Planner should generate basic level plan');
    assert(basicPlan.selectedArtifacts.length >= 4, 'Basic plan should have at least 4 artifacts');

    const mediumPlan = HarnessPlanner.plan(sampleSpec, 'medium');
    assert(mediumPlan.level === 'medium', 'Planner should generate medium level plan');
    assert(
      mediumPlan.selectedArtifacts.length > basicPlan.selectedArtifacts.length,
      'Medium plan should have more artifacts than basic plan',
    );

    const advancedPlan = HarnessPlanner.plan(sampleSpec, 'advanced');
    assert(advancedPlan.level === 'advanced', 'Planner should generate advanced level plan');
    assert(
      advancedPlan.selectedArtifacts.length > mediumPlan.selectedArtifacts.length,
      'Advanced plan should have more artifacts than medium plan',
    );

    // 4. Artifact Generator Determinism & Structure
    const generatedFiles = ArtifactGenerator.generateAll(mediumPlan, sampleSpec);
    assert(
      generatedFiles.length === mediumPlan.selectedArtifacts.length,
      'Artifact generator should produce one file per planned artifact',
    );

    const agentMd = generatedFiles.find((f) => f.path === 'AGENT.md');
    assert(Boolean(agentMd), 'AGENT.md must exist in generated artifacts');
    assert(
      agentMd!.content.includes('AGENT INSTRUCTIONS'),
      'AGENT.md must contain root agent instructions header',
    );
    assert(
      agentMd!.content.toLowerCase().includes(sampleSpec.name.toLowerCase()),
      'AGENT.md must reference the project name',
    );

    // 5. 7-Invariant Validation Check on Clean Execution
    const validationReport = HarnessPlanValidator.validate(mediumPlan, sampleSpec, generatedFiles);
    assert(validationReport.isValid, 'Clean plan must pass all 7 validation invariants');
    assert(validationReport.errors.length === 0, 'Clean plan must have zero validation errors');

    // 6. State Lifecycle Integrity
    const engineResult = HarnessEngine.execute(sampleSpec, 'medium');
    assert(engineResult.summary.isValid, 'HarnessEngine.execute should return valid summary');
    assert(engineResult.files.length >= 8, 'HarnessEngine should produce >= 8 files for medium level');

    // Ensure state file exists and is valid JSON
    const stateFile = engineResult.files.find((f) => f.path.includes('state') && f.path.endsWith('.json'));
    assert(Boolean(stateFile), 'A machine-readable state JSON file must be generated');
    if (stateFile) {
      let parsedOk = false;
      try {
        JSON.parse(stateFile.content);
        parsedOk = true;
      } catch {
        parsedOk = false;
      }
      assert(parsedOk, 'State artifact must be valid JSON');
    }
  } catch (err) {
    failed++;
    errors.push(`Domain logic exception: ${String(err)}`);
  }

  return {
    suiteName: 'Unit: Domain Logic & Harness Planning',
    passed,
    failed,
    errors,
  };
}
