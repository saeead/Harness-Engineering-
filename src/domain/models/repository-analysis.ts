/**
 * Repository Intelligence & Analysis Domain Models
 * Defines structures for Safe Scanner, Project Inventory, Harness Maturity Audits, and Remediation Plans.
 */

import { HarnessLevel, SubsystemType } from './harness';
import { ProjectSpecification } from './project';

export type FileCategory =
  | 'code'
  | 'config'
  | 'documentation'
  | 'test'
  | 'script'
  | 'state'
  | 'instructions'
  | 'asset'
  | 'other';

export interface ScannedFile {
  path: string;
  filename: string;
  extension: string;
  sizeBytes?: number;
  category: FileCategory;
  contentSample?: string; // Read-only safe snippet, never executed
}

export interface DetectedStack {
  primaryLanguage: string;
  languages: string[];
  frameworks: string[];
  packageManagers: string[];
  buildTools: string[];
  testRunners: string[];
  linters: string[];
  runtimes: string[];
}

export interface ProjectInventory {
  totalFiles: number;
  totalDirectories: number;
  directoryMap: string[];
  detectedStack: DetectedStack;
  architectureClues: string[];
  documentationFiles: string[];
  testingFiles: string[];
  agentInstructionFiles: string[];
  stateFiles: string[];
  verificationScripts: string[];
  lifecycleFiles: string[];
  scopeRuleFiles: string[];
  observabilityFiles: string[];
  rawFiles: ScannedFile[];
}

export type AuditDimensionStatus = 'present' | 'partial' | 'missing' | 'not_applicable';

export interface HarnessAuditDimension {
  dimension: SubsystemType;
  dimensionName: string;
  status: AuditDimensionStatus;
  scoreWeight: number; // 0 to 100
  evidence: string[];
  findings: string[];
  risksIfMissing: string[];
}

export type HarnessMaturityLevel =
  | 'none'
  | 'ad_hoc'
  | 'basic'
  | 'medium'
  | 'advanced';

export interface HarnessMaturityAudit {
  overallLevel: HarnessMaturityLevel;
  maturityScore: number; // 0 to 100
  dimensions: Record<SubsystemType, HarnessAuditDimension>;
  strengths: string[];
  gaps: string[];
  risks: string[];
  recommendations: string[];
  auditedAt: string;
}

export interface RecommendedAddition {
  id: string;
  path: string;
  subsystem: SubsystemType;
  purpose: string;
  priority: 'high' | 'medium' | 'low';
  rationale: string;
  targetLevel: HarnessLevel;
}

export interface RemediationPlan {
  existingSummary: string;
  criticalGapsCount: number;
  recommendedAdditions: RecommendedAddition[];
  proposedHarnessLevel: HarnessLevel;
  remediationRationale: string;
  inferredSpecification: Partial<ProjectSpecification>;
}

export interface RepositoryAnalysisReport {
  id: string;
  sourceType: 'local_files' | 'github_repo' | 'sample_fixture';
  sourceName: string;
  sourceUrl?: string;
  analyzedAt: string;
  inventory: ProjectInventory;
  audit: HarnessMaturityAudit;
  remediationPlan: RemediationPlan;
}
