/**
 * Harness Planner
 * Analyzes ProjectSpecification and deterministically produces a structured HarnessPlan.
 * Enforces the 6 core subsystems: Instructions, State, Scope, Verification, Session Lifecycle, Observability.
 */

import {
  HarnessPlan,
  HarnessLevel,
  HarnessArtifact,
  InstructionStrategy,
  StateStrategy,
  ScopeStrategy,
  VerificationStrategy,
  LifecycleStrategy,
  ObservabilityStrategy,
} from '../../domain/models/harness';
import { ProjectSpecification } from '../../domain/models/project';

export class HarnessPlanner {
  /**
   * Plans the Harness structure tailored proportionally to project complexity.
   */
  public static plan(
    spec: ProjectSpecification,
    requestedLevel?: HarnessLevel,
  ): HarnessPlan {
    const level = requestedLevel || spec.targetHarnessLevel || 'medium';
    const effectiveLevel = level === 'dynamic' ? this.evaluateDynamicLevel(spec) : level;

    const directories = this.determineDirectories(effectiveLevel, spec);
    const artifacts = this.determineArtifacts(effectiveLevel, spec);
    const generationOrder = this.determineGenerationOrder(artifacts);

    const instructionStrategy = this.buildInstructionStrategy(effectiveLevel, spec);
    const stateStrategy = this.buildStateStrategy(effectiveLevel);
    const scopeStrategy = this.buildScopeStrategy(effectiveLevel, spec);
    const verificationStrategy = this.buildVerificationStrategy(spec);
    const lifecycleStrategy = this.buildLifecycleStrategy(effectiveLevel, spec);
    const observabilityStrategy = this.buildObservabilityStrategy(effectiveLevel, spec);

    const rationale = this.generateRationale(effectiveLevel, spec, artifacts.length);

    return {
      id: `plan_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      projectId: spec.name.toLowerCase().replace(/[^a-z0-9]/g, '_'),
      projectName: spec.name,
      level,
      rationale,
      directoryStructure: directories,
      selectedArtifacts: artifacts,
      instructionStrategy,
      stateStrategy,
      scopeStrategy,
      verificationStrategy,
      lifecycleStrategy,
      observabilityStrategy,
      generationOrder,
      customRules: this.extractCustomRules(spec),
      architecturePattern: `${spec.projectType.toUpperCase()} — ${effectiveLevel.toUpperCase()} Topology`,
      generatedAt: new Date().toISOString(),
    };
  }

  /**
   * Evaluates dynamic level based on project characteristics
   */
  private static evaluateDynamicLevel(spec: ProjectSpecification): 'basic' | 'medium' | 'advanced' {
    let score = 0;
    if (spec.multiAgentEnabled) score += 3;
    if (spec.coreFeatures.length > 5) score += 2;
    if ((spec.securityRequirements || []).length > 2) score += 2;
    if ((spec.constraints || []).length > 2) score += 1;
    if (spec.projectType === 'service' || spec.projectType === 'api') score += 1;

    if (score >= 5) return 'advanced';
    if (score >= 2) return 'medium';
    return 'basic';
  }

  /**
   * Determine required directory structure
   */
  private static determineDirectories(
    level: 'basic' | 'medium' | 'advanced',
    spec: ProjectSpecification,
  ): string[] {
    const base = ['.harness', 'docs', 'scripts'];
    if (level === 'advanced' || spec.multiAgentEnabled) {
      base.push('.harness/instructions');
    }
    return base;
  }

  /**
   * Select required artifacts proportionally
   */
  private static determineArtifacts(
    level: 'basic' | 'medium' | 'advanced',
    spec: ProjectSpecification,
  ): HarnessArtifact[] {
    const artifacts: HarnessArtifact[] = [
      // 1. Root Instructions (Universal)
      {
        id: 'root_instructions',
        path: 'AGENT.md',
        filename: 'AGENT.md',
        category: 'instruction',
        subsystem: 'instructions',
        targetLevel: 'basic',
        purpose: 'Master root instructions for AI coding agents with strict boundary rules, change discipline, and verification workflow.',
        fileType: 'markdown',
        isRequired: true,
      },
      // 2. Machine-readable State (Universal)
      {
        id: 'project_state',
        path: '.harness/state.json',
        filename: 'state.json',
        category: 'state',
        subsystem: 'state',
        targetLevel: 'basic',
        purpose: 'Durable machine-readable project state tracking active phase, features inventory, invariants, and session handoff.',
        fileType: 'json',
        isRequired: true,
      },
      // 3. Project Specification (Universal)
      {
        id: 'project_spec_doc',
        path: 'docs/SPECIFICATION.md',
        filename: 'SPECIFICATION.md',
        category: 'specification',
        subsystem: 'scope',
        targetLevel: 'basic',
        purpose: 'Formal engineering specification detailing requirements, target audience, tech stack, and user constraints.',
        fileType: 'markdown',
        isRequired: true,
      },
      // 4. Definition of Done (Universal)
      {
        id: 'definition_of_done',
        path: 'docs/DEFINITION_OF_DONE.md',
        filename: 'DEFINITION_OF_DONE.md',
        category: 'verification',
        subsystem: 'verification',
        targetLevel: 'basic',
        purpose: 'Evidence-based completion gates and checklists required before any agent may declare a task complete.',
        fileType: 'markdown',
        isRequired: true,
      },
      // 5. Verification Script (Universal)
      {
        id: 'verify_script',
        path: 'scripts/verify.sh',
        filename: 'verify.sh',
        category: 'verification',
        subsystem: 'verification',
        targetLevel: 'basic',
        purpose: 'Deterministic POSIX executable script validating type checks, unit tests, and system invariants.',
        fileType: 'script',
        isRequired: true,
      },
    ];

    // Medium & Advanced Additions
    if (level === 'medium' || level === 'advanced') {
      artifacts.push(
        {
          id: 'architecture_doc',
          path: 'docs/ARCHITECTURE.md',
          filename: 'ARCHITECTURE.md',
          category: 'architecture',
          subsystem: 'instructions',
          targetLevel: 'medium',
          purpose: 'Layered architecture model, module boundaries, directory layout, and architectural decision record (ADR).',
          fileType: 'markdown',
          isRequired: true,
        },
        {
          id: 'development_rules',
          path: 'docs/RULES.md',
          filename: 'RULES.md',
          category: 'rule',
          subsystem: 'scope',
          targetLevel: 'medium',
          purpose: 'Strict change discipline (Inspect -> Understand -> Minimal Change -> Verify) and anti-pattern prohibitions.',
          fileType: 'markdown',
          isRequired: true,
        },
        {
          id: 'session_handoff',
          path: 'docs/SESSION_HANDOFF.md',
          filename: 'SESSION_HANDOFF.md',
          category: 'lifecycle',
          subsystem: 'lifecycle',
          targetLevel: 'medium',
          purpose: 'Session handoff protocol and state-transfer documentation for cross-session and cross-agent continuity.',
          fileType: 'markdown',
          isRequired: true,
        },
        {
          id: 'init_script',
          path: 'scripts/init.sh',
          filename: 'init.sh',
          category: 'lifecycle',
          subsystem: 'lifecycle',
          targetLevel: 'medium',
          purpose: 'Environment initialization script verifying runtime tools, package managers, and configuration presence.',
          fileType: 'script',
          isRequired: false,
        },
      );
    }

    // Advanced Additions
    if (level === 'advanced') {
      artifacts.push(
        {
          id: 'features_inventory',
          path: '.harness/features.json',
          filename: 'features.json',
          category: 'state',
          subsystem: 'state',
          targetLevel: 'advanced',
          purpose: 'Granular machine-readable inventory of feature status, priority, dependencies, and evidence hashes.',
          fileType: 'json',
          isRequired: true,
        },
        {
          id: 'observability_doc',
          path: 'docs/OBSERVABILITY.md',
          filename: 'OBSERVABILITY.md',
          category: 'observability',
          subsystem: 'observability',
          targetLevel: 'advanced',
          purpose: 'Runtime health checks, invariant monitoring, error categorization, and diagnostic tracing procedures.',
          fileType: 'markdown',
          isRequired: true,
        },
        {
          id: 'testing_doc',
          path: 'docs/TESTING.md',
          filename: 'TESTING.md',
          category: 'verification',
          subsystem: 'verification',
          targetLevel: 'advanced',
          purpose: 'Deep testing strategy covering unit, integration, mock-boundary isolation, and test flakiness prevention.',
          fileType: 'markdown',
          isRequired: false,
        },
        {
          id: 'roadmap_doc',
          path: 'docs/ROADMAP.md',
          filename: 'ROADMAP.md',
          category: 'specification',
          subsystem: 'lifecycle',
          targetLevel: 'advanced',
          purpose: 'Phased development milestones, dependency graph, and planned delivery horizons.',
          fileType: 'markdown',
          isRequired: false,
        },
      );

      if (spec.multiAgentEnabled) {
        artifacts.push({
          id: 'agent_roles',
          path: '.harness/instructions/agent-roles.md',
          filename: 'agent-roles.md',
          category: 'instruction',
          subsystem: 'instructions',
          targetLevel: 'advanced',
          purpose: 'Multi-agent role separation: Architect, Core Engineer, QA / Verification Engineer, Security Reviewer.',
          fileType: 'markdown',
          isRequired: true,
        });
      }
    }

    return artifacts;
  }

  /**
   * Deterministic generation order
   */
  private static determineGenerationOrder(artifacts: HarnessArtifact[]): string[] {
    // Order priority: state -> spec -> architecture -> rules -> dod -> scripts -> root instructions (last)
    const priorityMap: Record<string, number> = {
      project_state: 1,
      features_inventory: 2,
      project_spec_doc: 3,
      architecture_doc: 4,
      development_rules: 5,
      definition_of_done: 6,
      testing_doc: 7,
      observability_doc: 8,
      roadmap_doc: 9,
      session_handoff: 10,
      init_script: 11,
      verify_script: 12,
      agent_roles: 13,
      root_instructions: 99, // Root instructions generated last to reference all finalized artifacts
    };

    return [...artifacts]
      .sort((a, b) => (priorityMap[a.id] || 50) - (priorityMap[b.id] || 50))
      .map((a) => a.id);
  }

  // --- Subsystem Strategy Builders ---

  private static buildInstructionStrategy(
    level: 'basic' | 'medium' | 'advanced',
    spec: ProjectSpecification,
  ): InstructionStrategy {
    const domainPaths = level === 'advanced' && spec.multiAgentEnabled
      ? ['.harness/instructions/agent-roles.md', 'docs/ARCHITECTURE.md', 'docs/RULES.md']
      : level === 'medium'
      ? ['docs/ARCHITECTURE.md', 'docs/RULES.md']
      : [];

    return {
      rootInstructionPath: 'AGENT.md',
      progressiveDisclosureEnabled: level !== 'basic',
      domainInstructionsPaths: domainPaths,
      rulesEnforcement: level === 'advanced' ? 'strict' : level === 'medium' ? 'standard' : 'minimal',
    };
  }

  private static buildStateStrategy(level: 'basic' | 'medium' | 'advanced'): StateStrategy {
    return {
      stateFilePath: '.harness/state.json',
      format: 'json',
      trackFeatures: level !== 'basic',
      trackSprintOrPhase: true,
      progressLogPath: level === 'advanced' ? 'docs/PROGRESS.md' : undefined,
    };
  }

  private static buildScopeStrategy(
    level: 'basic' | 'medium' | 'advanced',
    spec: ProjectSpecification,
  ): ScopeStrategy {
    return {
      strictBoundariesDocPath: 'docs/RULES.md',
      prohibitedPatterns: spec.constraints || [
        'Do not introduce unvetted third-party dependencies',
        'Do not commit sensitive tokens or credentials',
        'Do not bypass verification scripts before task signoff',
      ],
      enforceNoSpeculativeFeatures: true,
      changeDiscipline: 'Inspect -> Understand -> Minimal Safe Edit -> Verify -> Update State',
    };
  }

  private static buildVerificationStrategy(spec: ProjectSpecification): VerificationStrategy {
    const tech = (spec.preferredTechnology || '').toLowerCase();
    let runner = 'npm test';

    if (tech.includes('python')) {
      runner = 'pytest';
    } else if (tech.includes('go') || tech.includes('golang')) {
      runner = 'go test ./...';
    } else if (tech.includes('rust') || tech.includes('cargo')) {
      runner = 'cargo test';
    } else if (tech.includes('bun')) {
      runner = 'bun test';
    } else if (tech.includes('pnpm')) {
      runner = 'pnpm test';
    }

    return {
      verificationScriptPath: 'scripts/verify.sh',
      runnerCommand: runner,
      definitionOfDoneDocPath: 'docs/DEFINITION_OF_DONE.md',
      evidenceBasedSignoffRequired: true,
      testSuiteStrategy: 'Unit tests + Invariant sanity checks + Static type assertion',
    };
  }

  private static buildLifecycleStrategy(
    level: 'basic' | 'medium' | 'advanced',
    spec: ProjectSpecification,
  ): LifecycleStrategy {
    return {
      sessionHandoffPath: 'docs/SESSION_HANDOFF.md',
      environmentInitScriptPath: level !== 'basic' ? 'scripts/init.sh' : undefined,
      restartabilityProtocol: 'Inspect .harness/state.json, run scripts/verify.sh, review session handoff note, execute pending task.',
      cleanHandoffChecklist: [
        'All current edits compile cleanly with zero errors',
        'Verification script executed and returned exit code 0',
        '.harness/state.json updated with completed tasks and active blockers',
        'Handoff note documented in docs/SESSION_HANDOFF.md',
      ],
    };
  }

  private static buildObservabilityStrategy(
    level: 'basic' | 'medium' | 'advanced',
    spec: ProjectSpecification,
  ): ObservabilityStrategy {
    return {
      observabilityDocPath: level === 'advanced' ? 'docs/OBSERVABILITY.md' : undefined,
      invariantsCheckScriptPath: level === 'advanced' ? 'scripts/verify.sh' : undefined,
      healthMonitoringEnabled: level === 'advanced',
      runtimeChecks: [
        'State integrity check (valid JSON schema in .harness/state.json)',
        'Dependency isolation check (zero hardcoded secrets)',
        'Build and test reproducibility check',
      ],
    };
  }

  private static extractCustomRules(spec: ProjectSpecification): string[] {
    const rules: string[] = [];
    if (spec.constraints && spec.constraints.length > 0) {
      rules.push(...spec.constraints);
    }
    if (spec.securityRequirements && spec.securityRequirements.length > 0) {
      rules.push(...spec.securityRequirements);
    }
    return rules;
  }

  private static generateRationale(
    level: 'basic' | 'medium' | 'advanced',
    spec: ProjectSpecification,
    artifactCount: number,
  ): string {
    return `Selected ${level.toUpperCase()} topology tailored for "${spec.name}" (${spec.projectType}). Plans ${artifactCount} artifacts across 6 core subsystems to guarantee agent reproducibility without redundant overhead. Multi-agent isolation is ${spec.multiAgentEnabled ? 'enabled' : 'disabled'}.`;
  }
}
