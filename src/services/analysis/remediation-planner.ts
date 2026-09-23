/**
 * Remediation Planner
 * Translates project inventory and audit gaps into a prioritized RemediationPlan
 * and infers an engineering ProjectSpecification ready for Harness generation.
 */

import {
  ProjectInventory,
  HarnessMaturityAudit,
  RemediationPlan,
  RecommendedAddition,
} from '../../domain/models/repository-analysis';
import { ProjectSpecification } from '../../domain/models/project';
import { HarnessLevel, SubsystemType } from '../../domain/models/harness';

export class RemediationPlanner {
  /**
   * Plans actionable remediation items based on the audit
   */
  public static plan(
    sourceName: string,
    inventory: ProjectInventory,
    audit: HarnessMaturityAudit,
  ): RemediationPlan {
    const recommendedAdditions: RecommendedAddition[] = [];

    // 1. Instructions Remediation
    if (audit.dimensions.instructions.status !== 'present') {
      recommendedAdditions.push({
        id: 'rem_agent_md',
        path: 'AGENT.md',
        subsystem: 'instructions',
        purpose: 'Establish durable root instructions for AI coding agents with strict change discipline and boundary orientation.',
        priority: 'high',
        rationale: 'Without AGENT.md, AI models lack project grounding and can make sweeping destructive modifications.',
        targetLevel: 'basic',
      });
    }

    // 2. State Remediation
    if (audit.dimensions.state.status !== 'present') {
      recommendedAdditions.push({
        id: 'rem_state_json',
        path: '.harness/state.json',
        subsystem: 'state',
        purpose: 'Create machine-readable project state tracking active phase, features inventory, and blockers.',
        priority: 'high',
        rationale: 'Enables distinct agent sessions to resume cleanly without conversational memory dependence.',
        targetLevel: 'basic',
      });
    }

    // 3. Scope Remediation
    if (audit.dimensions.scope.status !== 'present') {
      recommendedAdditions.push({
        id: 'rem_rules_md',
        path: 'docs/RULES.md',
        subsystem: 'scope',
        purpose: 'Define explicit anti-pattern rules, forbidden practices, and strict change discipline.',
        priority: 'high',
        rationale: 'Constrains AI agents to surgical edits and blocks unauthorized dependency additions.',
        targetLevel: 'medium',
      });
    }

    // 4. Verification Remediation
    if (audit.dimensions.verification.status !== 'present') {
      const runner = inventory.detectedStack.testRunners[0] || 'npm test';
      recommendedAdditions.push({
        id: 'rem_verify_sh',
        path: 'scripts/verify.sh',
        subsystem: 'verification',
        purpose: `Deterministic POSIX script executing "${runner}" and verifying state invariants with exit code 0.`,
        priority: 'high',
        rationale: 'Provides unambiguous pass/fail evidence before an agent or developer can declare completion.',
        targetLevel: 'basic',
      });

      recommendedAdditions.push({
        id: 'rem_dod_md',
        path: 'docs/DEFINITION_OF_DONE.md',
        subsystem: 'verification',
        purpose: 'Checklist of verified criteria required before any feature or refactor is signed off.',
        priority: 'medium',
        rationale: 'Enforces evidence-based task signoff over conversational claims of completion.',
        targetLevel: 'basic',
      });
    }

    // 5. Lifecycle Remediation
    if (audit.dimensions.lifecycle.status !== 'present') {
      recommendedAdditions.push({
        id: 'rem_handoff_md',
        path: 'docs/SESSION_HANDOFF.md',
        subsystem: 'lifecycle',
        purpose: 'Living document capturing recent changes, pending tasks, and active blockers for subsequent sessions.',
        priority: 'medium',
        rationale: 'Ensures zero context loss when switching developers or AI coding agents.',
        targetLevel: 'medium',
      });

      recommendedAdditions.push({
        id: 'rem_init_sh',
        path: 'scripts/init.sh',
        subsystem: 'lifecycle',
        purpose: 'Environment initialization script to verify runtime prerequisites and package setup.',
        priority: 'low',
        rationale: 'Assures new agent environments are correctly initialized before code execution.',
        targetLevel: 'medium',
      });
    }

    // 6. Observability Remediation (for medium/advanced projects)
    if (audit.dimensions.observability.status !== 'present' && inventory.totalFiles > 10) {
      recommendedAdditions.push({
        id: 'rem_observability_md',
        path: 'docs/OBSERVABILITY.md',
        subsystem: 'observability',
        purpose: 'Document system invariants, health checks, and diagnostic error classifications.',
        priority: 'low',
        rationale: 'Helps agents isolate runtime regressions and verify invariant contracts.',
        targetLevel: 'advanced',
      });
    }

    // Determine proposed Harness Level
    let proposedHarnessLevel: HarnessLevel = 'medium';
    if (inventory.totalFiles <= 5 && inventory.testingFiles.length === 0) {
      proposedHarnessLevel = 'basic';
    } else if (
      inventory.totalFiles > 20 ||
      inventory.architectureClues.some((c) => c.includes('Monorepo'))
    ) {
      proposedHarnessLevel = 'advanced';
    }

    // Infer ProjectSpecification from Repository Inventory
    const inferredSpecification = this.inferSpecification(sourceName, inventory, proposedHarnessLevel);

    const existingSummary = `Scanned ${inventory.totalFiles} files across ${inventory.totalDirectories} directories. Identified ${inventory.detectedStack.primaryLanguage} project with ${inventory.detectedStack.frameworks.join(', ') || 'standard tools'}. Current Harness maturity is "${audit.overallLevel.toUpperCase()}" (${audit.maturityScore}%).`;

    const remediationRationale = `Identified ${recommendedAdditions.length} missing harness artifacts. Adding these artifacts will raise harness maturity to 100% and provide AI coding agents with explicit boundaries, persistent state, and deterministic verification.`;

    return {
      existingSummary,
      criticalGapsCount: recommendedAdditions.filter((r) => r.priority === 'high').length,
      recommendedAdditions,
      proposedHarnessLevel,
      remediationRationale,
      inferredSpecification,
    };
  }

  /**
   * Automatically infers ProjectSpecification from repository scan
   */
  private static inferSpecification(
    sourceName: string,
    inv: ProjectInventory,
    proposedLevel: HarnessLevel,
  ): Partial<ProjectSpecification> {
    const stack = inv.detectedStack;

    let projectType: ProjectSpecification['projectType'] = 'web';
    if (stack.frameworks.includes('Express.js') || stack.frameworks.includes('FastAPI') || stack.frameworks.includes('Flask')) {
      projectType = 'api';
    } else if (inv.rawFiles.some((f) => f.path.startsWith('bin/') || f.path.includes('cli'))) {
      projectType = 'cli';
    } else if (inv.rawFiles.some((f) => f.path.startsWith('packages/') && inv.rawFiles.length < 15)) {
      projectType = 'library';
    } else if (stack.frameworks.includes('React') || stack.frameworks.includes('Next.js') || stack.frameworks.includes('Vue.js')) {
      projectType = 'web';
    }

    const preferredTech = [
      stack.primaryLanguage,
      stack.frameworks.join(' / '),
      stack.packageManagers.join(' / '),
    ]
      .filter(Boolean)
      .join(' · ') || 'TypeScript / Node.js';

    const testRunner = stack.testRunners[0] || (stack.primaryLanguage === 'Python' ? 'pytest' : 'npm test');

    const cleanName = sourceName
      .replace(/^.*[\\/]/, '')
      .replace(/\.[^/.]+$/, '')
      .replace(/[^a-zA-Z0-9_\-\s]/g, ' ')
      .trim() || 'Existing Repository';

    return {
      name: cleanName,
      projectType,
      description: `Analysis and Harness remediation for ${cleanName}. Stack: ${preferredTech}.`,
      targetUsers: 'Engineers, AI coding agents, and automated development workflows',
      preferredTechnology: preferredTech,
      primaryGoals: [
        `Preserve existing ${stack.primaryLanguage} functionality and architecture`,
        `Establish durable AI Harness boundaries and machine-readable state`,
        `Enforce deterministic verification via ${testRunner}`,
      ],
      coreFeatures: [
        {
          id: 'feat_existing_core',
          title: 'Existing Core Functionality',
          description: `Existing business logic in ${inv.detectedStack.primaryLanguage}`,
          priority: 'high',
          status: 'in_progress',
          verificationCriteria: [`Pass existing test runner (${testRunner})`],
        },
      ],
      constraints: [
        'Do not modify existing production code during Harness remediation',
        'Preserve directory structure and existing build tooling',
        'Never delete existing tests or silence compilation errors',
      ],
      securityRequirements: [
        'Isolate all credentials and environment secrets from repository commits',
        'Treat all external repository inputs as untrusted',
      ],
      testingExpectations: [
        `Execute ${testRunner} before task completion`,
        'Verify zero regressions across existing test suite',
      ],
      definitionOfDone: [
        'All changes verified via scripts/verify.sh',
        'Machine-readable state updated in .harness/state.json',
        'Clean session handoff logged in docs/SESSION_HANDOFF.md',
      ],
      targetHarnessLevel: proposedLevel,
      multiAgentEnabled: inv.architectureClues.some((c) => c.includes('Monorepo')),
    };
  }
}
