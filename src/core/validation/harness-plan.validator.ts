/**
 * Harness Plan & Artifact Integrity Validator
 * Enforces the 7 required validation invariants:
 * 1. duplicate files
 * 2. conflicting instructions
 * 3. missing required artifacts
 * 4. invalid paths
 * 5. invalid references
 * 6. contradictory configuration
 * 7. unsupported artifact combinations
 */

import {
  HarnessPlan,
  GeneratedFile,
  HarnessValidationReport,
  HarnessValidationIssue,
} from '../../domain/models/harness';
import { ProjectSpecification } from '../../domain/models/project';

export class HarnessPlanValidator {
  /**
   * Performs full structural and content validation across the plan and generated files.
   */
  public static validate(
    plan: HarnessPlan,
    spec: ProjectSpecification,
    files: GeneratedFile[] = [],
  ): HarnessValidationReport {
    const errors: HarnessValidationIssue[] = [];
    const warnings: HarnessValidationIssue[] = [];

    // 1. Check for Duplicate Files
    this.checkDuplicateFiles(plan, files, errors);

    // 2. Check for Missing Required Artifacts
    this.checkMissingRequiredArtifacts(plan, errors);

    // 3. Check for Invalid Paths
    this.checkInvalidPaths(plan, files, errors);

    // 4. Check for Contradictory Configuration
    this.checkContradictoryConfiguration(plan, spec, errors, warnings);

    // 5. Check for Conflicting Instructions
    this.checkConflictingInstructions(plan, spec, files, errors, warnings);

    // 6. Check for Unsupported Artifact Combinations
    this.checkUnsupportedCombinations(plan, errors, warnings);

    // 7. Check for Invalid References in Generated Content
    if (files.length > 0) {
      this.checkInvalidReferences(plan, files, errors, warnings);
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      totalChecked: (plan.selectedArtifacts?.length || 0) + (files?.length || 0),
      checkedAt: new Date().toISOString(),
    };
  }

  /**
   * Invariant 1: No duplicate file paths in plan or generated artifacts
   */
  private static checkDuplicateFiles(
    plan: HarnessPlan,
    files: GeneratedFile[],
    errors: HarnessValidationIssue[],
  ): void {
    const seenPlanPaths = new Set<string>();
    for (const artifact of plan.selectedArtifacts || []) {
      const normalized = artifact.path.toLowerCase().replace(/^\/+/, '');
      if (seenPlanPaths.has(normalized)) {
        errors.push({
          code: 'duplicate_file',
          rule: 'HARNESS-VAL-001',
          severity: 'error',
          artifactPath: artifact.path,
          message: `Duplicate artifact path planned: "${artifact.path}" is registered more than once in the Harness Plan.`,
        });
      }
      seenPlanPaths.add(normalized);
    }

    const seenFilePaths = new Set<string>();
    for (const file of files || []) {
      const normalized = file.path.toLowerCase().replace(/^\/+/, '');
      if (seenFilePaths.has(normalized)) {
        errors.push({
          code: 'duplicate_file',
          rule: 'HARNESS-VAL-001B',
          severity: 'error',
          artifactPath: file.path,
          message: `Duplicate generated file: "${file.path}" was emitted multiple times.`,
        });
      }
      seenFilePaths.add(normalized);
    }
  }

  /**
   * Invariant 2: Required baseline artifacts for each harness level
   */
  private static checkMissingRequiredArtifacts(
    plan: HarnessPlan,
    errors: HarnessValidationIssue[],
  ): void {
    const plannedPaths = new Set((plan.selectedArtifacts || []).map((a) => a.path));

    // Universal baseline for all Harness levels
    const universalRequired: Array<{ path: string; name: string }> = [
      { path: 'AGENT.md', name: 'Root Instruction File' },
      { path: '.harness/state.json', name: 'Durable Machine-Readable State' },
      { path: 'docs/SPECIFICATION.md', name: 'Project Specification' },
      { path: 'scripts/verify.sh', name: 'Verification Runner Script' },
      { path: 'docs/DEFINITION_OF_DONE.md', name: 'Definition of Done' },
    ];

    for (const req of universalRequired) {
      if (!plannedPaths.has(req.path)) {
        errors.push({
          code: 'missing_required_artifact',
          rule: 'HARNESS-VAL-002',
          severity: 'error',
          artifactPath: req.path,
          message: `Missing mandatory baseline artifact: "${req.name}" (${req.path}) is required for all Harness topologies.`,
        });
      }
    }

    // Medium requirements
    if (plan.level === 'medium' || plan.level === 'advanced') {
      const mediumRequired = [
        { path: 'docs/RULES.md', name: 'Development & Scope Rules' },
        { path: 'docs/SESSION_HANDOFF.md', name: 'Session Handoff Protocol' },
      ];
      for (const req of mediumRequired) {
        if (!plannedPaths.has(req.path)) {
          errors.push({
            code: 'missing_required_artifact',
            rule: 'HARNESS-VAL-002M',
            severity: 'error',
            artifactPath: req.path,
            message: `Missing required Medium/Advanced artifact: "${req.name}" (${req.path}) must be present.`,
          });
        }
      }
    }

    // Advanced requirements
    if (plan.level === 'advanced') {
      const advancedRequired = [
        { path: 'docs/OBSERVABILITY.md', name: 'Runtime Observability & Invariants' },
        { path: '.harness/features.json', name: 'Machine-Readable Features State' },
      ];
      for (const req of advancedRequired) {
        if (!plannedPaths.has(req.path)) {
          errors.push({
            code: 'missing_required_artifact',
            rule: 'HARNESS-VAL-002A',
            severity: 'error',
            artifactPath: req.path,
            message: `Missing required Advanced artifact: "${req.name}" (${req.path}) must be present for advanced multi-agent topology.`,
          });
        }
      }
    }
  }

  /**
   * Invariant 3: Path sanitization and relative path enforcement
   */
  private static checkInvalidPaths(
    plan: HarnessPlan,
    files: GeneratedFile[],
    errors: HarnessValidationIssue[],
  ): void {
    const invalidCharRegex = /[:*?"<>|]/;

    const testPath = (path: string, source: string) => {
      if (!path || path.trim() === '') {
        errors.push({
          code: 'invalid_path',
          rule: 'HARNESS-VAL-003A',
          severity: 'error',
          artifactPath: path,
          message: `${source}: Artifact path cannot be empty.`,
        });
        return;
      }
      if (path.startsWith('/')) {
        errors.push({
          code: 'invalid_path',
          rule: 'HARNESS-VAL-003B',
          severity: 'error',
          artifactPath: path,
          message: `${source}: Absolute path "${path}" is forbidden. All paths must be relative to repository root.`,
        });
      }
      if (path.includes('..')) {
        errors.push({
          code: 'invalid_path',
          rule: 'HARNESS-VAL-003C',
          severity: 'error',
          artifactPath: path,
          message: `${source}: Directory traversal ".." in "${path}" is forbidden.`,
        });
      }
      if (path.includes('\\')) {
        errors.push({
          code: 'invalid_path',
          rule: 'HARNESS-VAL-003D',
          severity: 'error',
          artifactPath: path,
          message: `${source}: Windows backslash in "${path}" is forbidden. Use POSIX forward slash "/".`,
        });
      }
      if (invalidCharRegex.test(path)) {
        errors.push({
          code: 'invalid_path',
          rule: 'HARNESS-VAL-003E',
          severity: 'error',
          artifactPath: path,
          message: `${source}: Illegal characters detected in file path "${path}".`,
        });
      }
    };

    for (const artifact of plan.selectedArtifacts || []) {
      testPath(artifact.path, 'Harness Plan');
    }
    for (const file of files || []) {
      testPath(file.path, 'Generated File');
    }
  }

  /**
   * Invariant 4: Contradictory configuration detection
   */
  private static checkContradictoryConfiguration(
    plan: HarnessPlan,
    spec: ProjectSpecification,
    errors: HarnessValidationIssue[],
    warnings: HarnessValidationIssue[],
  ): void {
    // Check if multi-agent toggle contradicts artifacts
    const hasRoleInstructions = (plan.selectedArtifacts || []).some(
      (a) => a.path.includes('agent-roles') || a.id === 'agent_roles',
    );

    if (!spec.multiAgentEnabled && hasRoleInstructions && plan.level !== 'dynamic') {
      errors.push({
        code: 'contradictory_configuration',
        rule: 'HARNESS-VAL-004A',
        severity: 'error',
        artifactPath: '.harness/instructions/agent-roles.md',
        message: 'Contradiction: Multi-Agent support is disabled in specification, but multi-agent role instructions are scheduled.',
      });
    }

    // Check if runner command matches language ecosystem
    const tech = (spec.preferredTechnology || '').toLowerCase();
    const runner = (plan.verificationStrategy?.runnerCommand || '').toLowerCase();

    if (tech.includes('python') && runner && runner.includes('npm') && !runner.includes('pytest')) {
      warnings.push({
        code: 'contradictory_configuration',
        rule: 'HARNESS-VAL-004B',
        severity: 'warning',
        artifactPath: 'scripts/verify.sh',
        message: `Potential configuration mismatch: Tech stack specifies Python, but verification runner command is "${plan.verificationStrategy?.runnerCommand}".`,
      });
    }

    if (tech.includes('go') && runner && runner.includes('npm') && !runner.includes('go test')) {
      warnings.push({
        code: 'contradictory_configuration',
        rule: 'HARNESS-VAL-004C',
        severity: 'warning',
        artifactPath: 'scripts/verify.sh',
        message: `Potential configuration mismatch: Tech stack specifies Go, but verification runner command is "${plan.verificationStrategy?.runnerCommand}".`,
      });
    }
  }

  /**
   * Invariant 5: Conflicting instructions in rules and constraints
   */
  private static checkConflictingInstructions(
    plan: HarnessPlan,
    spec: ProjectSpecification,
    files: GeneratedFile[],
    errors: HarnessValidationIssue[],
    warnings: HarnessValidationIssue[],
  ): void {
    const constraintsLower = (spec.constraints || []).map((c) => c.toLowerCase());

    // Check if constraints forbid cloud/db, but spec has heavy cloud db features
    const forbidsDb = constraintsLower.some(
      (c) => c.includes('no database') || c.includes('no heavy database') || c.includes('local-first'),
    );
    const hasDbReq = (spec.technicalRequirements || []).some(
      (r) => r.toLowerCase().includes('postgresql') || r.toLowerCase().includes('dynamodb'),
    );

    if (forbidsDb && hasDbReq) {
      warnings.push({
        code: 'conflicting_instructions',
        rule: 'HARNESS-VAL-005A',
        severity: 'warning',
        message: 'Constraint conflict: Constraints emphasize local-first / no remote database, but technical requirements specify remote SQL/NoSQL services.',
      });
    }

    // Check rule enforcement level consistency
    if (plan.level === 'advanced' && plan.instructionStrategy?.rulesEnforcement === 'minimal') {
      errors.push({
        code: 'conflicting_instructions',
        rule: 'HARNESS-VAL-005B',
        severity: 'error',
        message: 'Instruction conflict: Advanced Harness topology requires "strict" rule enforcement, but strategy was set to "minimal".',
      });
    }
  }

  /**
   * Invariant 6: Unsupported artifact combinations
   */
  private static checkUnsupportedCombinations(
    plan: HarnessPlan,
    errors: HarnessValidationIssue[],
    warnings: HarnessValidationIssue[],
  ): void {
    const plannedPaths = new Set((plan.selectedArtifacts || []).map((a) => a.path));

    // If observability docs exist, verify script must exist
    if (plannedPaths.has('docs/OBSERVABILITY.md') && !plannedPaths.has('scripts/verify.sh')) {
      errors.push({
        code: 'unsupported_combination',
        rule: 'HARNESS-VAL-006A',
        severity: 'error',
        artifactPath: 'docs/OBSERVABILITY.md',
        message: 'Unsupported combination: Observability requires a runnable verification script (scripts/verify.sh) to execute health checks.',
      });
    }

    // Directory structure completeness
    for (const artifact of plan.selectedArtifacts || []) {
      const parts = artifact.path.split('/');
      if (parts.length > 1) {
        const dir = parts.slice(0, -1).join('/');
        if (plan.directoryStructure && !plan.directoryStructure.includes(dir)) {
          // Add warning or auto-correct
          warnings.push({
            code: 'unsupported_combination',
            rule: 'HARNESS-VAL-006B',
            severity: 'warning',
            artifactPath: artifact.path,
            message: `Parent directory "${dir}" was not declared in directoryStructure for artifact "${artifact.path}".`,
          });
        }
      }
    }
  }

  /**
   * Invariant 7: Invalid references between generated artifacts
   */
  private static checkInvalidReferences(
    plan: HarnessPlan,
    files: GeneratedFile[],
    errors: HarnessValidationIssue[],
    warnings: HarnessValidationIssue[],
  ): void {
    const filePaths = new Set(files.map((f) => f.path));

    // Scan AGENT.md for references to scripts and docs
    const rootFile = files.find((f) => f.path === 'AGENT.md');
    if (rootFile) {
      // Find paths mentioned in markdown code ticks or links like `scripts/verify.sh` or `docs/RULES.md`
      const matches = rootFile.content.match(/`([a-zA-Z0-9_\-./]+\.[a-zA-Z0-9]+)`/g) || [];
      for (const m of matches) {
        const cleanRef = m.replace(/`/g, '').trim();
        if (
          (cleanRef.startsWith('docs/') || cleanRef.startsWith('scripts/') || cleanRef.startsWith('.harness/')) &&
          !cleanRef.includes('*')
        ) {
          if (!filePaths.has(cleanRef)) {
            warnings.push({
              code: 'invalid_reference',
              rule: 'HARNESS-VAL-007',
              severity: 'warning',
              artifactPath: 'AGENT.md',
              message: `AGENT.md references "${cleanRef}", but this file is not included in the generated artifacts set.`,
            });
          }
        }
      }
    }
  }
}
