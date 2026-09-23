/**
 * Harness Engine Service Facade
 * Master coordinator separating:
 * Artifact Definition (Plan) -> Artifact Generator -> Artifact Validation -> In-Memory Generated Files
 */

import {
  HarnessPlan,
  HarnessLevel,
  GeneratedFile,
  HarnessValidationReport,
} from '../../domain/models/harness';
import { ProjectSpecification } from '../../domain/models/project';
import { HarnessPlanner } from './harness-planner';
import { ArtifactGenerator } from './artifact-generator';
import { HarnessPlanValidator } from '../../core/validation/harness-plan.validator';

export interface HarnessExecutionResult {
  plan: HarnessPlan;
  files: GeneratedFile[];
  validation: HarnessValidationReport;
  summary: {
    totalFiles: number;
    totalSizeBytes: number;
    totalLines: number;
    subsystemsCovered: string[];
    isValid: boolean;
  };
}

export class HarnessEngine {
  /**
   * Plans the Harness topology for the given specification.
   */
  public static plan(
    spec: ProjectSpecification,
    level?: HarnessLevel,
  ): HarnessPlan {
    return HarnessPlanner.plan(spec, level);
  }

  /**
   * Generates file contents for all planned artifacts.
   */
  public static generateArtifacts(
    plan: HarnessPlan,
    spec: ProjectSpecification,
  ): GeneratedFile[] {
    return ArtifactGenerator.generateAll(plan, spec);
  }

  /**
   * Validates the plan and generated files against the 7 validation invariants.
   */
  public static validate(
    plan: HarnessPlan,
    spec: ProjectSpecification,
    files: GeneratedFile[] = [],
  ): HarnessValidationReport {
    return HarnessPlanValidator.validate(plan, spec, files);
  }

  /**
   * Complete end-to-end execution pipeline:
   * Specification -> Plan -> Generate -> Validate (all in-memory)
   */
  public static execute(
    spec: ProjectSpecification,
    level?: HarnessLevel,
  ): HarnessExecutionResult {
    // 1. Plan
    const plan = this.plan(spec, level);

    // 2. Generate in-memory files
    const files = this.generateArtifacts(plan, spec);

    // 3. Validate
    const validation = this.validate(plan, spec, files);

    // 4. Calculate summary metrics
    const totalSizeBytes = files.reduce((acc, f) => acc + f.sizeBytes, 0);
    const totalLines = files.reduce((acc, f) => acc + f.linesCount, 0);
    const subsystemsCovered = Array.from(new Set(files.map((f) => f.subsystem)));

    return {
      plan,
      files,
      validation,
      summary: {
        totalFiles: files.length,
        totalSizeBytes,
        totalLines,
        subsystemsCovered,
        isValid: validation.isValid,
      },
    };
  }
}
