/**
 * Harness Domain Models
 * Defines Harness Levels, Artifacts, Plans, Subsystem Strategies, and Generated Files.
 */

export type HarnessLevel = 'basic' | 'medium' | 'advanced' | 'dynamic';

export interface HarnessLevelDefinition {
  level: HarnessLevel;
  titleKey: string;
  descriptionKey: string;
  targetComplexity: 'low' | 'moderate' | 'high' | 'custom';
  recommendedFileCount: string;
  keyCapabilities: string[];
}

export type ArtifactCategory =
  | 'instruction'
  | 'specification'
  | 'architecture'
  | 'state'
  | 'rule'
  | 'verification'
  | 'lifecycle'
  | 'observability'
  | 'template';

export type ArtifactFileType = 'markdown' | 'json' | 'yaml' | 'script' | 'text';

export type SubsystemType =
  | 'instructions'
  | 'state'
  | 'scope'
  | 'verification'
  | 'lifecycle'
  | 'observability';

export interface HarnessArtifact {
  id: string;
  path: string;
  filename: string;
  category: ArtifactCategory;
  subsystem: SubsystemType;
  targetLevel: HarnessLevel;
  purpose: string;
  fileType: ArtifactFileType;
  isRequired: boolean;
  dependsOn?: string[]; // IDs of artifacts this depends upon
  contentTemplate?: string;
  description?: string;
}

export interface InstructionStrategy {
  rootInstructionPath: string;
  progressiveDisclosureEnabled: boolean;
  domainInstructionsPaths: string[];
  rulesEnforcement: 'strict' | 'standard' | 'minimal';
}

export interface StateStrategy {
  stateFilePath: string;
  format: 'json' | 'yaml';
  trackFeatures: boolean;
  trackSprintOrPhase: boolean;
  progressLogPath?: string;
}

export interface ScopeStrategy {
  strictBoundariesDocPath: string;
  prohibitedPatterns: string[];
  enforceNoSpeculativeFeatures: boolean;
  changeDiscipline: string;
}

export interface VerificationStrategy {
  verificationScriptPath: string;
  runnerCommand: string;
  definitionOfDoneDocPath: string;
  evidenceBasedSignoffRequired: boolean;
  testSuiteStrategy: string;
}

export interface LifecycleStrategy {
  sessionHandoffPath: string;
  environmentInitScriptPath?: string;
  restartabilityProtocol: string;
  cleanHandoffChecklist: string[];
}

export interface ObservabilityStrategy {
  observabilityDocPath?: string;
  invariantsCheckScriptPath?: string;
  healthMonitoringEnabled: boolean;
  runtimeChecks: string[];
}

export interface HarnessPlan {
  id: string;
  projectId: string;
  projectName: string;
  level: HarnessLevel;
  rationale: string;
  directoryStructure: string[];
  selectedArtifacts: HarnessArtifact[];
  instructionStrategy: InstructionStrategy;
  stateStrategy: StateStrategy;
  scopeStrategy: ScopeStrategy;
  verificationStrategy: VerificationStrategy;
  lifecycleStrategy: LifecycleStrategy;
  observabilityStrategy: ObservabilityStrategy;
  generationOrder: string[]; // Ordered list of artifact IDs
  customRules: string[];
  architecturePattern: string;
  generatedAt: string;
}

export interface GeneratedFile {
  id: string;
  path: string;
  filename: string;
  category: ArtifactCategory;
  subsystem: SubsystemType;
  fileType: ArtifactFileType;
  content: string;
  sizeBytes: number;
  linesCount: number;
  generatedAt: string;
  checksum?: string;
  isExecutable?: boolean;
}


export interface HarnessValidationIssue {
  code:
    | 'duplicate_file'
    | 'conflicting_instructions'
    | 'missing_required_artifact'
    | 'invalid_path'
    | 'invalid_reference'
    | 'contradictory_configuration'
    | 'unsupported_combination';
  message: string;
  artifactPath?: string;
  severity: 'error' | 'warning';
  rule: string;
}

export interface HarnessValidationReport {
  isValid: boolean;
  errors: HarnessValidationIssue[];
  warnings: HarnessValidationIssue[];
  totalChecked: number;
  checkedAt: string;
}

export interface HarnessStructure {
  directoryTree: string[];
  artifacts: HarnessArtifact[];
  totalFiles: number;
}
