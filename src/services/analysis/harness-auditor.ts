/**
 * Harness Maturity Auditor
 * Evaluates repository inventory against the 6 core engineering subsystems:
 * Instructions, State, Scope, Verification, Session Lifecycle, Observability.
 * Evidence-based: assigns statuses (present, partial, missing) based on concrete findings.
 */

import {
  ProjectInventory,
  HarnessAuditDimension,
  HarnessMaturityAudit,
  HarnessMaturityLevel,
} from '../../domain/models/repository-analysis';

export class HarnessAuditor {
  /**
   * Conducts a rigorous audit of the project inventory
   */
  public static audit(inventory: ProjectInventory): HarnessMaturityAudit {
    const instructions = this.auditInstructions(inventory);
    const state = this.auditState(inventory);
    const scope = this.auditScope(inventory);
    const verification = this.auditVerification(inventory);
    const lifecycle = this.auditLifecycle(inventory);
    const observability = this.auditObservability(inventory);

    const dimensions = {
      instructions,
      state,
      scope,
      verification,
      lifecycle,
      observability,
    };

    // Calculate weighted maturity score (0-100)
    const weights = [
      instructions.scoreWeight * 0.25,
      state.scoreWeight * 0.20,
      scope.scoreWeight * 0.15,
      verification.scoreWeight * 0.20,
      lifecycle.scoreWeight * 0.10,
      observability.scoreWeight * 0.10,
    ];
    const maturityScore = Math.round(weights.reduce((a, b) => a + b, 0));

    let overallLevel: HarnessMaturityLevel = 'none';
    if (maturityScore >= 85) overallLevel = 'advanced';
    else if (maturityScore >= 65) overallLevel = 'medium';
    else if (maturityScore >= 40) overallLevel = 'basic';
    else if (maturityScore >= 20) overallLevel = 'ad_hoc';
    else overallLevel = 'none';

    const { strengths, gaps, risks, recommendations } = this.compileFindings(dimensions, inventory);

    return {
      overallLevel,
      maturityScore,
      dimensions,
      strengths,
      gaps,
      risks,
      recommendations,
      auditedAt: new Date().toISOString(),
    };
  }

  // --- Dimension Evaluators ---

  private static auditInstructions(inv: ProjectInventory): HarnessAuditDimension {
    const hasRootAgent = inv.agentInstructionFiles.some(
      (f) => f.toLowerCase() === 'agent.md' || f.toLowerCase() === 'claude.md',
    );
    const hasCursorRules = inv.agentInstructionFiles.some(
      (f) => f.includes('.cursorrules') || f.includes('.windsurfrules'),
    );
    const hasReadme = inv.documentationFiles.some((f) => f.toLowerCase().includes('readme'));

    if (hasRootAgent) {
      return {
        dimension: 'instructions',
        dimensionName: 'Agent Instructions',
        status: 'present',
        scoreWeight: 100,
        evidence: [
          `Dedicated root agent instructions found: ${inv.agentInstructionFiles.join(', ')}`,
        ],
        findings: ['Root agent instructions exist to guide AI coding assistants.'],
        risksIfMissing: [],
      };
    }

    if (hasCursorRules || hasReadme) {
      return {
        dimension: 'instructions',
        dimensionName: 'Agent Instructions',
        status: 'partial',
        scoreWeight: 45,
        evidence: [
          hasCursorRules
            ? 'Tool-specific rules file found (.cursorrules/.windsurfrules), but no vendor-neutral AGENT.md.'
            : 'Human README documentation exists, but lacks explicit AI agent guidance and rules.',
        ],
        findings: [
          'Instructions are fragmented or coupled to a specific editor rather than being durable across different AI models.',
        ],
        risksIfMissing: [
          'AI agents lack clear project boundaries and orientation, causing hallucinated conventions.',
        ],
      };
    }

    return {
      dimension: 'instructions',
      dimensionName: 'Agent Instructions',
      status: 'missing',
      scoreWeight: 0,
      evidence: ['No AGENT.md, CLAUDE.md, or agent prompt instruction files detected.'],
      findings: ['Repository completely lacks agent instruction documentation.'],
      risksIfMissing: [
        'AI coding agents operate without grounding, causing destructive file replacements and architectural drift.',
      ],
    };
  }

  private static auditState(inv: ProjectInventory): HarnessAuditDimension {
    const hasHarnessState = inv.stateFiles.some((f) => f.includes('.harness/state.json'));
    const hasTodo = inv.stateFiles.some((f) => f.toLowerCase().includes('todo'));

    if (hasHarnessState) {
      return {
        dimension: 'state',
        dimensionName: 'Project State & Invariants',
        status: 'present',
        scoreWeight: 100,
        evidence: ['Durable machine-readable state found at .harness/state.json.'],
        findings: ['Durable source of truth tracks project status and features.'],
        risksIfMissing: [],
      };
    }

    if (hasTodo) {
      return {
        dimension: 'state',
        dimensionName: 'Project State & Invariants',
        status: 'partial',
        scoreWeight: 35,
        evidence: [`Unstructured markdown task list found: ${inv.stateFiles.join(', ')}`],
        findings: ['Tasks are tracked informally in text files without machine-readable schema.'],
        risksIfMissing: [
          'Agent sessions cannot deterministically query feature completion status or active blockers.',
        ],
      };
    }

    return {
      dimension: 'state',
      dimensionName: 'Project State & Invariants',
      status: 'missing',
      scoreWeight: 0,
      evidence: ['Zero project state or task tracking files detected in repository.'],
      findings: ['No persistent machine-readable state exists.'],
      risksIfMissing: [
        'Each AI session starts completely blind to previous progress and active work.',
      ],
    };
  }

  private static auditScope(inv: ProjectInventory): HarnessAuditDimension {
    const hasRulesDoc = inv.scopeRuleFiles.some(
      (f) => f.includes('RULES') || f.includes('boundaries'),
    );
    const hasContributing = inv.scopeRuleFiles.some((f) => f.includes('CONTRIBUTING'));
    const hasLinters = inv.detectedStack.linters.length > 0;

    if (hasRulesDoc) {
      return {
        dimension: 'scope',
        dimensionName: 'Scope Controls & Change Discipline',
        status: 'present',
        scoreWeight: 100,
        evidence: [`Explicit scope rules documentation found: ${inv.scopeRuleFiles.join(', ')}`],
        findings: ['Formal development rules and boundary guardrails are documented.'],
        risksIfMissing: [],
      };
    }

    if (hasContributing || hasLinters) {
      return {
        dimension: 'scope',
        dimensionName: 'Scope Controls & Change Discipline',
        status: 'partial',
        scoreWeight: 40,
        evidence: [
          hasContributing ? 'CONTRIBUTING.md guidelines detected.' : '',
          hasLinters ? `Linter configuration detected (${inv.detectedStack.linters.join(', ')}).` : '',
        ].filter(Boolean),
        findings: [
          'Stylistic linter rules exist, but explicit architectural boundaries and anti-pattern prohibitions are missing.',
        ],
        risksIfMissing: [
          'Agents may over-engineer, add unwanted packages, or violate intended boundaries.',
        ],
      };
    }

    return {
      dimension: 'scope',
      dimensionName: 'Scope Controls & Change Discipline',
      status: 'missing',
      scoreWeight: 0,
      evidence: ['No development rules, boundaries, or CONTRIBUTING guidelines detected.'],
      findings: ['Repository lacks scope guardrails and change discipline definitions.'],
      risksIfMissing: [
        'Unchecked speculative feature generation and indiscriminate dependency installation.',
      ],
    };
  }

  private static auditVerification(inv: ProjectInventory): HarnessAuditDimension {
    const hasVerifyScript = inv.verificationScripts.some((f) => f.includes('verify'));
    const hasTests = inv.testingFiles.length > 0 || inv.detectedStack.testRunners.length > 0;
    const hasDoD = inv.documentationFiles.some((f) => f.includes('DEFINITION_OF_DONE'));

    if (hasVerifyScript && hasDoD) {
      return {
        dimension: 'verification',
        dimensionName: 'Verification & Definition of Done',
        status: 'present',
        scoreWeight: 100,
        evidence: [
          `Verification script present: ${inv.verificationScripts.join(', ')}`,
          'Definition of Done documented.',
        ],
        findings: ['Holistic single-command verification gate and DoD checklist exist.'],
        risksIfMissing: [],
      };
    }

    if (hasTests || hasVerifyScript) {
      return {
        dimension: 'verification',
        dimensionName: 'Verification & Definition of Done',
        status: 'partial',
        scoreWeight: 50,
        evidence: [
          hasTests
            ? `Test suites detected (${inv.testingFiles.length} test files, runner: ${inv.detectedStack.testRunners.join(', ') || 'npm test'}).`
            : '',
          hasVerifyScript ? `Script detected: ${inv.verificationScripts.join(', ')}` : '',
          !hasDoD ? 'Missing explicit Definition of Done checklist.' : '',
        ].filter(Boolean),
        findings: [
          'Unit tests or runners exist, but there is no unified verification gate ensuring all checks pass before declaration of completion.',
        ],
        risksIfMissing: [
          'AI agents declare completion without evidence, leaving broken builds and subtle regressions.',
        ],
      };
    }

    return {
      dimension: 'verification',
      dimensionName: 'Verification & Definition of Done',
      status: 'missing',
      scoreWeight: 0,
      evidence: ['Zero test files, test runners, or verification scripts detected.'],
      findings: ['No automated testing or verification capability discovered.'],
      risksIfMissing: [
        'Completely unverified changes; impossible to detect regressions automatically.',
      ],
    };
  }

  private static auditLifecycle(inv: ProjectInventory): HarnessAuditDimension {
    const hasHandoff = inv.lifecycleFiles.some((f) => f.includes('handoff'));
    const hasInit = inv.lifecycleFiles.some((f) => f.includes('init') || f.includes('setup'));

    if (hasHandoff && hasInit) {
      return {
        dimension: 'lifecycle',
        dimensionName: 'Session Lifecycle & Restartability',
        status: 'present',
        scoreWeight: 100,
        evidence: [
          `Session handoff documentation found: ${inv.lifecycleFiles.filter((f) => f.includes('handoff')).join(', ')}`,
          `Environment init script found: ${inv.lifecycleFiles.filter((f) => f.includes('init') || f.includes('setup')).join(', ')}`,
        ],
        findings: ['Clean restartability protocol and session handoff tracking in place.'],
        risksIfMissing: [],
      };
    }

    if (hasHandoff || hasInit) {
      return {
        dimension: 'lifecycle',
        dimensionName: 'Session Lifecycle & Restartability',
        status: 'partial',
        scoreWeight: 40,
        evidence: [
          hasHandoff
            ? 'Session handoff note present, but environment initialization script missing.'
            : 'Setup script present, but session handoff log missing.',
        ],
        findings: ['Partial session transition protocol.'],
        risksIfMissing: ['Context loss between distinct agent sessions and developers.'],
      };
    }

    return {
      dimension: 'lifecycle',
      dimensionName: 'Session Lifecycle & Restartability',
      status: 'missing',
      scoreWeight: 0,
      evidence: ['No session handoff or environment initialization mechanisms detected.'],
      findings: ['Zero session continuity tracking.'],
      risksIfMissing: [
        'New sessions must reinvent context from scratch, frequently re-implementing or undoing work.',
      ],
    };
  }

  private static auditObservability(inv: ProjectInventory): HarnessAuditDimension {
    const hasObservabilityDoc = inv.observabilityFiles.length > 0;

    if (hasObservabilityDoc) {
      return {
        dimension: 'observability',
        dimensionName: 'Runtime Observability & Invariants',
        status: 'present',
        scoreWeight: 100,
        evidence: [`Observability documentation detected: ${inv.observabilityFiles.join(', ')}`],
        findings: ['Runtime health checks and invariant monitoring documented.'],
        risksIfMissing: [],
      };
    }

    return {
      dimension: 'observability',
      dimensionName: 'Runtime Observability & Invariants',
      status: 'missing',
      scoreWeight: 0,
      evidence: ['No runtime invariant documentation or diagnostic procedures detected.'],
      findings: ['No formal observability or health diagnostics documented.'],
      risksIfMissing: ['Silent data integrity decay and untracked contract violations.'],
    };
  }

  // --- Aggregate Findings ---

  private static compileFindings(
    dims: Record<string, HarnessAuditDimension>,
    inv: ProjectInventory,
  ): {
    strengths: string[];
    gaps: string[];
    risks: string[];
    recommendations: string[];
  } {
    const strengths: string[] = [];
    const gaps: string[] = [];
    const risks: string[] = [];
    const recommendations: string[] = [];

    // Evaluate Strengths
    if (inv.detectedStack.primaryLanguage !== 'Unknown') {
      strengths.push(
        `Clear technical stack: ${inv.detectedStack.primaryLanguage} with ${inv.detectedStack.frameworks.join(', ') || 'standard tooling'}.`,
      );
    }
    if (inv.testingFiles.length > 0) {
      strengths.push(`Active test suite detected (${inv.testingFiles.length} test files).`);
    }
    if (inv.documentationFiles.length > 0) {
      strengths.push(`Base documentation present (${inv.documentationFiles.join(', ')}).`);
    }

    // Evaluate Gaps & Recommendations
    for (const d of Object.values(dims)) {
      if (d.status === 'missing') {
        gaps.push(`Missing Subsystem: ${d.dimensionName}`);
        risks.push(...d.risksIfMissing);
      } else if (d.status === 'partial') {
        gaps.push(`Incomplete Subsystem: ${d.dimensionName}`);
        risks.push(...d.risksIfMissing);
      }
    }

    // Formulate Recommendations
    if (dims.instructions.status !== 'present') {
      recommendations.push(
        'Generate vendor-neutral AGENT.md root instruction file to provide durable agent orientation.',
      );
    }
    if (dims.state.status !== 'present') {
      recommendations.push(
        'Establish .harness/state.json to make project phase, feature inventory, and blockers machine-readable.',
      );
    }
    if (dims.scope.status !== 'present') {
      recommendations.push(
        'Establish docs/RULES.md with explicit change discipline (Inspect -> Understand -> Minimal Change -> Verify).',
      );
    }
    if (dims.verification.status !== 'present') {
      recommendations.push(
        'Establish scripts/verify.sh and docs/DEFINITION_OF_DONE.md for deterministic, evidence-based completion.',
      );
    }
    if (dims.lifecycle.status !== 'present') {
      recommendations.push(
        'Introduce docs/SESSION_HANDOFF.md to preserve context across multiple sessions and AI models.',
      );
    }
    if (dims.observability.status !== 'present') {
      recommendations.push(
        'Document runtime health checks and invariant verifications in docs/OBSERVABILITY.md.',
      );
    }

    return { strengths, gaps, risks, recommendations };
  }
}
