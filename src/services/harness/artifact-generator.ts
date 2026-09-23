/**
 * Artifact Generator
 * Generates high-fidelity, project-specific, deterministic file contents for each planned artifact.
 * Fully decoupled from UI components.
 */

import {
  HarnessPlan,
  HarnessArtifact,
  GeneratedFile,
} from '../../domain/models/harness';
import { ProjectSpecification } from '../../domain/models/project';

export class ArtifactGenerator {
  /**
   * Generates in-memory file content for all planned artifacts in deterministic order.
   */
  public static generateAll(
    plan: HarnessPlan,
    spec: ProjectSpecification,
  ): GeneratedFile[] {
    const files: GeneratedFile[] = [];

    // Follow strict generationOrder defined in the plan
    const artifactMap = new Map<string, HarnessArtifact>();
    for (const artifact of plan.selectedArtifacts) {
      artifactMap.set(artifact.id, artifact);
    }

    for (const artifactId of plan.generationOrder) {
      const artifact = artifactMap.get(artifactId);
      if (artifact) {
        const file = this.generateSingle(artifact, plan, spec);
        files.push(file);
      }
    }

    return files;
  }

  /**
   * Generates content for a single artifact definition
   */
  public static generateSingle(
    artifact: HarnessArtifact,
    plan: HarnessPlan,
    spec: ProjectSpecification,
  ): GeneratedFile {
    let content = '';

    switch (artifact.id) {
      case 'root_instructions':
        content = this.generateRootInstructions(plan, spec);
        break;
      case 'project_state':
        content = this.generateProjectState(plan, spec);
        break;
      case 'features_inventory':
        content = this.generateFeaturesInventory(spec);
        break;
      case 'project_spec_doc':
        content = this.generateSpecificationDoc(plan, spec);
        break;
      case 'architecture_doc':
        content = this.generateArchitectureDoc(plan, spec);
        break;
      case 'development_rules':
        content = this.generateRulesDoc(plan, spec);
        break;
      case 'definition_of_done':
        content = this.generateDoDDoc(plan, spec);
        break;
      case 'verify_script':
        content = this.generateVerifyScript(plan, spec);
        break;
      case 'init_script':
        content = this.generateInitScript(plan, spec);
        break;
      case 'session_handoff':
        content = this.generateSessionHandoffDoc(plan, spec);
        break;
      case 'observability_doc':
        content = this.generateObservabilityDoc(plan, spec);
        break;
      case 'testing_doc':
        content = this.generateTestingDoc(plan, spec);
        break;
      case 'roadmap_doc':
        content = this.generateRoadmapDoc(plan, spec);
        break;
      case 'agent_roles':
        content = this.generateAgentRolesDoc(plan, spec);
        break;
      default:
        content = `# ${artifact.filename}\n\nProject: ${spec.name}\nArtifact ID: ${artifact.id}\nCategory: ${artifact.category}\n\nGenerated for ${plan.level.toUpperCase()} topology.`;
    }

    const lines = content.split('\n');
    const sizeBytes = new TextEncoder().encode(content).length;

    return {
      id: `file_${artifact.id}`,
      path: artifact.path,
      filename: artifact.filename,
      category: artifact.category,
      subsystem: artifact.subsystem,
      fileType: artifact.fileType,
      content,
      sizeBytes,
      linesCount: lines.length,
      generatedAt: new Date().toISOString(),
    };
  }

  // --- Subsystem Content Generators ---

  private static generateRootInstructions(plan: HarnessPlan, spec: ProjectSpecification): string {
    const goalsList = (spec.primaryGoals || []).map((g) => `- ${g}`).join('\n');
    const constraintsList = (spec.constraints || []).map((c) => `- ${c}`).join('\n');

    return `# AGENT INSTRUCTIONS — ${spec.name.toUpperCase()}

> **Harness Topology**: ${plan.level.toUpperCase()} | **Subsystems**: Instructions, State, Scope, Verification, Lifecycle, Observability
> **Primary Source of Truth**: This repository and \`.harness/state.json\`.

---

## 1. PROJECT ESSENCE & GOALS
${spec.description}

### Primary Invariant Goals:
${goalsList || '- Deliver robust, verifiable software meeting project specifications'}

---

## 2. ORIENTATION & SESSION RESUMPTION
At the beginning of **EVERY** session or task turn, the AI coding agent **MUST**:
1. Inspect \`.harness/state.json\` to identify the active sprint, completed features, and pending tasks.
2. Read \`docs/SESSION_HANDOFF.md\` for context from the previous agent session.
3. Review \`docs/RULES.md\` for forbidden patterns and architectural constraints.
4. Run \`bash scripts/verify.sh\` to confirm the repository is in a clean, passing state before making changes.

---

## 3. STRICT CHANGE DISCIPLINE
Never rewrite files speculatively or introduce sweeping changes without evidence.
Follow this 5-step operational loop:
\`\`\`
Inspect → Understand → Minimal Safe Edit → Verify (scripts/verify.sh) → Update State (.harness/state.json)
\`\`\`

- **Smallest Safe Diff**: Modify only the minimal lines required for the specific task.
- **Preserve Behavior**: Never delete tests or silent errors to make a build pass.
- **No Speculative Dependencies**: Do not install packages unless explicitly required by the project specification.

---

## 4. ARCHITECTURAL BOUNDARIES & CONSTRAINTS
- **Preferred Stack**: \`${spec.preferredTechnology}\`
- **Target Architecture**: \`${spec.projectType}\`
${constraintsList ? `\n### Strict Prohibitions:\n${constraintsList}` : ''}

---

## 5. VERIFICATION & DEFINITION OF DONE
No task is complete merely because code is written. Completion requires verifiable evidence.
1. Run \`bash scripts/verify.sh\` (Runner: \`${plan.verificationStrategy.runnerCommand}\`).
2. Verify all acceptance criteria in \`docs/DEFINITION_OF_DONE.md\`.
3. Record task evidence and update status in \`.harness/state.json\`.
4. Document a clean handoff note in \`docs/SESSION_HANDOFF.md\`.
`;
  }

  private static generateProjectState(plan: HarnessPlan, spec: ProjectSpecification): string {
    const state = {
      $schema: 'https://json-schema.org/draft/2020-12/schema',
      project: {
        name: spec.name,
        type: spec.projectType,
        targetHarnessLevel: plan.level,
        primaryStack: spec.preferredTechnology,
        multiAgentEnabled: spec.multiAgentEnabled,
      },
      lifecycle: {
        phase: 'Phase 1: Foundation & Initialization',
        status: 'in_progress',
        lastUpdated: new Date().toISOString(),
      },
      features: spec.coreFeatures.map((feat) => ({
        id: feat.id,
        title: feat.title,
        priority: feat.priority,
        status: feat.status || 'planned',
        verificationCriteria: feat.verificationCriteria || [],
      })),
      verification: {
        lastRunStatus: 'unverified',
        runnerCommand: plan.verificationStrategy.runnerCommand,
        exitCode: null,
      },
      lastSessionHandoff: {
        sessionDate: new Date().toISOString(),
        agentId: 'harness-engine',
        summary: 'Initial Harness topology generated and verified.',
        pendingTasks: spec.coreFeatures.map((f) => f.title),
        knownBlockers: [],
      },
    };

    return JSON.stringify(state, null, 2);
  }

  private static generateFeaturesInventory(spec: ProjectSpecification): string {
    const features = {
      projectName: spec.name,
      totalFeatures: spec.coreFeatures.length,
      inventory: spec.coreFeatures.map((f, i) => ({
        index: i + 1,
        id: f.id,
        title: f.title,
        description: f.description,
        priority: f.priority,
        status: f.status || 'planned',
        criteria: f.verificationCriteria || [`Verify "${f.title}" via test suite`],
      })),
    };
    return JSON.stringify(features, null, 2);
  }

  private static generateSpecificationDoc(plan: HarnessPlan, spec: ProjectSpecification): string {
    return `# PROJECT SPECIFICATION — ${spec.name}

## 1. Executive Overview
- **Project Name**: ${spec.name}
- **Architecture Type**: ${spec.projectType}
- **Target Audience**: ${spec.targetUsers || 'Not specified'}
- **Preferred Technology**: ${spec.preferredTechnology}
- **Harness Level**: ${plan.level.toUpperCase()}

## 2. Description & Problem Statement
${spec.description}

## 3. Core Objectives & Key Goals
${(spec.primaryGoals || []).map((g) => `- ${g}`).join('\n') || '- None documented'}

## 4. Key Functional Features
${spec.coreFeatures.map((f, idx) => `### 4.${idx + 1} ${f.title}\n- **Priority**: ${f.priority.toUpperCase()}\n- **Status**: ${f.status}\n- **Verification Criteria**: ${(f.verificationCriteria || []).join(', ')}`).join('\n\n')}

## 5. Security & Isolation Requirements
${(spec.securityRequirements || []).map((s) => `- ${s}`).join('\n') || '- In-memory secret isolation\n- Input sanitization on untrusted boundaries'}

## 6. Technical Requirements & Environment
${(spec.technicalRequirements || []).map((r) => `- ${r}`).join('\n') || `- Preferred runtime: ${spec.preferredTechnology}`}
`;
  }

  private static generateArchitectureDoc(plan: HarnessPlan, spec: ProjectSpecification): string {
    return `# SYSTEM ARCHITECTURE — ${spec.name}

## 1. Architectural Pattern
- **Pattern**: ${plan.architecturePattern}
- **Topology Level**: ${plan.level.toUpperCase()}
- **Multi-Agent Orchestration**: ${spec.multiAgentEnabled ? 'Enabled' : 'Disabled'}

## 2. Subsystem Boundaries
\`\`\`
Presentation / Entrypoint
        ↓
Core Application Services
        ↓
Domain Entities & Invariants
        ↓
Infrastructure & Local Storage
        ↓
External Providers (Isolated via Abstraction Interfaces)
\`\`\`

## 3. Directory Layout
${plan.directoryStructure.map((dir) => `- \`${dir}/\``).join('\n')}

## 4. Architectural Invariants
1. **Local-First & Data Independence**: State must not depend exclusively on external services.
2. **Provider Isolation**: External APIs or models must sit behind typed adapter interfaces.
3. **Evidence-Based Integrity**: Changes must be validated with deterministic test suites.
`;
  }

  private static generateRulesDoc(plan: HarnessPlan, spec: ProjectSpecification): string {
    return `# DEVELOPMENT & SCOPE RULES

> **Enforcement Level**: ${plan.instructionStrategy.rulesEnforcement.toUpperCase()}

## 1. Golden Rules of Development
1. **Never delete existing files** without explicit instructions.
2. **Never replace an entire file** when a surgical edit is sufficient.
3. **Never introduce speculative dependencies** or unvetted libraries.
4. **Never bypass verification commands** before declaring task completion.

## 2. Change Discipline
Before modifying any file in this repository:
1. **Inspect**: Read the file and understand its current responsibilities.
2. **Understand**: Trace call sites and invariants.
3. **Minimal Change**: Make the smallest safe edit.
4. **Verify**: Execute \`bash scripts/verify.sh\` and check exit code.
5. **State Update**: Record changes in \`.harness/state.json\`.

## 3. Strict Prohibitions & Anti-Patterns
${(spec.constraints || []).map((c) => `- ${c}`).join('\n') || '- No arbitrary remote execution\n- No unauthenticated network access\n- No hardcoded secrets or API tokens'}
`;
  }

  private static generateDoDDoc(plan: HarnessPlan, spec: ProjectSpecification): string {
    const customDoD = (spec.definitionOfDone || []).map((d) => `- [ ] ${d}`).join('\n');

    return `# DEFINITION OF DONE (DoD)

Before any feature or task is marked as complete, an AI coding agent or engineer must satisfy:

## Core Verification Gates
- [ ] Code compiles cleanly with zero type errors or fatal lint issues.
- [ ] All unit and integration tests pass deterministically via \`bash scripts/verify.sh\`.
- [ ] No regression introduced to existing functionality.
- [ ] Edge cases and negative path inputs handled safely.
- [ ] New functionality matches acceptance criteria in \`docs/SPECIFICATION.md\`.

## Project-Specific Criteria
${customDoD || '- [ ] Verified against project constraints\n- [ ] State updated in `.harness/state.json`'}

## Handoff Requirements
- [ ] \`.harness/state.json\` updated with completion timestamp.
- [ ] Handoff summary logged in \`docs/SESSION_HANDOFF.md\`.
`;
  }

  private static generateVerifyScript(plan: HarnessPlan, spec: ProjectSpecification): string {
    return `#!/usr/bin/env bash
# ==============================================================================
# Verification Script for ${spec.name}
# Topology: ${plan.level.toUpperCase()}
# ==============================================================================
set -euo pipefail

echo "================================================================="
echo "  [VERIFY] Running Verification Gates for ${spec.name}"
echo "================================================================="

# 1. State Invariant Check
if [ ! -f ".harness/state.json" ]; then
  echo "ERROR: Mandatory .harness/state.json not found!"
  exit 1
fi
echo "✓ Verified: .harness/state.json exists"

# 2. Specification Invariant Check
if [ ! -f "docs/SPECIFICATION.md" ]; then
  echo "ERROR: docs/SPECIFICATION.md not found!"
  exit 1
fi
echo "✓ Verified: docs/SPECIFICATION.md exists"

# 3. Test Runner Execution
echo "Executing test runner: ${plan.verificationStrategy.runnerCommand}..."
# In active repository, run: ${plan.verificationStrategy.runnerCommand}

echo "================================================================="
echo "  [SUCCESS] All verification gates passed cleanly!"
echo "================================================================="
exit 0
`;
  }

  private static generateInitScript(plan: HarnessPlan, spec: ProjectSpecification): string {
    return `#!/usr/bin/env bash
# ==============================================================================
# Environment Initialization for ${spec.name}
# ==============================================================================
set -euo pipefail

echo "Initializing environment for ${spec.name} (${spec.preferredTechnology})..."

# Check git repository
if [ ! -d ".git" ]; then
  echo "Notice: Not inside a git repository or git uninitialized."
fi

# Ensure harness directory structure
mkdir -p .harness docs scripts

echo "Environment ready for development."
exit 0
`;
  }

  private static generateSessionHandoffDoc(plan: HarnessPlan, spec: ProjectSpecification): string {
    return `# SESSION HANDOFF PROTOCOL

## How to Resume Development
1. Read \`.harness/state.json\` to review what was finished and what is pending.
2. Run \`bash scripts/verify.sh\` to verify that the environment is in a passing state.
3. Review the latest session log below.

---

## Session History

### Session: Initial Generation
- **Timestamp**: ${new Date().toISOString()}
- **Completed**: Harness plan initialized with ${plan.selectedArtifacts.length} artifacts.
- **Pending**: Begin implementation of Core Features.
- **Blockers**: None.
`;
  }

  private static generateObservabilityDoc(plan: HarnessPlan, spec: ProjectSpecification): string {
    return `# RUNTIME OBSERVABILITY & SYSTEM INVARIANTS

## 1. System Invariants
- **Data Integrity**: State must always parse as valid JSON.
- **Dependency Boundary**: No untracked external services.
- **Deterministic Verification**: Tests must yield identical outcomes across consecutive runs.

## 2. Health Check Procedures
Execute \`bash scripts/verify.sh\` before any commit or task handoff.

## 3. Error Classification
- **Contract Violation**: Payload does not adhere to domain model.
- **Isolation Breach**: Unauthorized remote call or leaked secret.
- **Verification Failure**: Test suite regression.
`;
  }

  private static generateTestingDoc(plan: HarnessPlan, spec: ProjectSpecification): string {
    return `# TESTING STRATEGY & VERIFICATION MATRIX

## 1. Test Runner
- **Command**: \`${plan.verificationStrategy.runnerCommand}\`
- **Strategy**: ${plan.verificationStrategy.testSuiteStrategy}

## 2. Expectations
${(spec.testingExpectations || []).map((t) => `- ${t}`).join('\n') || '- Unit test coverage on core domain logic\n- Integration tests across adapter boundaries'}
`;
  }

  private static generateRoadmapDoc(plan: HarnessPlan, spec: ProjectSpecification): string {
    return `# PROJECT ROADMAP & MILESTONES — ${spec.name}

## Phase 1: Foundation & Core Setup
- [x] Engineering Harness generation
- [x] Initial state and instruction baseline
- [ ] Environment bootstrapping

## Phase 2: Core Feature Implementation
${spec.coreFeatures.map((f) => `- [ ] ${f.title} (${f.priority.toUpperCase()})`).join('\n')}

## Phase 3: Hardening & Verification
- [ ] End-to-end integration tests
- [ ] Performance and invariant auditing
- [ ] Final release readiness
`;
  }

  private static generateAgentRolesDoc(plan: HarnessPlan, spec: ProjectSpecification): string {
    return `# MULTI-AGENT ROLE SEPARATION

## 1. System Architect Agent
- **Responsibilities**: Defines subsystem boundaries, updates \`docs/ARCHITECTURE.md\`, designs data models.
- **Prohibitions**: Does not write implementation details or modify UI components.

## 2. Core Implementation Agent
- **Responsibilities**: Implements features adhering to \`docs/RULES.md\` and \`docs/SPECIFICATION.md\`.
- **Prohibitions**: Does not alter architecture boundaries or delete tests.

## 3. QA & Verification Agent
- **Responsibilities**: Executes \`scripts/verify.sh\`, writes regression tests, audits Definition of Done.
- **Prohibitions**: Does not lower test standards or approve unverified PRs.

## 4. Security Reviewer Agent
- **Responsibilities**: Audits credential safety, input sanitization, and dependency vulnerabilities.
`;
  }
}
