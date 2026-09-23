/**
 * Project Domain Models
 * Defines Project entities, specifications, state, features, and analysis models.
 */

import { HarnessLevel, HarnessPlan } from './harness';

export type ProjectType =
  | 'web'
  | 'desktop'
  | 'mobile'
  | 'api'
  | 'cli'
  | 'library'
  | 'service'
  | 'other';

export type PlatformTarget =
  | 'web'
  | 'desktop'
  | 'service'
  | 'mobile'
  | 'cli'
  | 'library'
  | 'monorepo';

export type FeaturePriority = 'critical' | 'high' | 'medium' | 'low';

export type FeatureStatus =
  | 'draft'
  | 'planned'
  | 'in_progress'
  | 'verified'
  | 'blocked';

export interface Feature {
  id: string;
  title: string;
  description: string;
  priority: FeaturePriority;
  status: FeatureStatus;
  verificationCriteria: string[];
  dependencies?: string[];
}

export interface AnalysisQuestion {
  id: string;
  question: string;
  category: 'scope' | 'architecture' | 'security' | 'testing' | 'stack' | 'deployment';
  suggestedAnswer?: string;
  options?: string[];
  userAnswer?: string;
  context?: string;
  isBlocking?: boolean;
  impact?: string;
}

export interface FeatureRecommendation {
  id: string;
  title: string;
  description: string;
  rationale: string;
  impact: 'critical' | 'high' | 'medium' | 'low';
  subsystemAffected: string;
  suggestedByAI: boolean;
  accepted: boolean;
}

export interface ArchitectureSuggestion {
  id: string;
  topic: string;
  recommendation: string;
  pros: string[];
  cons: string[];
  applied: boolean;
}

export interface SuggestedField {
  field: string;
  label: string;
  currentValue?: string;
  suggestedValue: string;
  rationale: string;
}

export interface ProjectAnalysis {
  understoodRequirements: string[];
  missingInformation: string[];
  ambiguities: string[];
  assumptions: string[];
  suggestedFields: SuggestedField[];
  followUpQuestions: AnalysisQuestion[];
  recommendedLevel: HarnessLevel;
  confidenceScore: number; // 0 - 100
  analyzedAt: string;
  providerId: string;
  // Extended fields for validation & compatibility
  specId?: string;
  questions?: AnalysisQuestion[];
  recommendedHarnessLevel?: HarnessLevel;
  recommendations?: FeatureRecommendation[];
  suggestions?: ArchitectureSuggestion[];
  risks?: string[];
}

export interface ProjectSpecification {
  name: string;
  projectType: ProjectType;
  description: string;
  targetUsers: string;
  primaryGoals: string[];
  coreFeatures: Feature[];
  expectedPlatforms: PlatformTarget[];
  preferredTechnology: string;
  constraints: string[];
  technicalRequirements: string[];
  securityRequirements: string[];
  testingExpectations: string[];
  definitionOfDone: string[];
  targetHarnessLevel: HarnessLevel;
  multiAgentEnabled: boolean;
  existingRepoUrl?: string;
  // Backward compatibility / convenience aliases:
  targetPlatform?: PlatformTarget;
  primaryLanguage?: string;
  frameworkOrStack?: string;
  coreObjectives?: string[];
  architecturalConstraints?: string[];
  testingRequirements?: string[];
  features?: Feature[];
}

export type ProjectLifecyclePhase =
  | 'draft'
  | 'analyzed'
  | 'planned'
  | 'generating'
  | 'completed'
  | 'failed';

export interface ProjectState {
  phase: ProjectLifecyclePhase;
  currentSprintOrPhase?: string;
  completionPercentage: number;
  blockers: string[];
  activeAgentsCount?: number;
  lastHandoffNote?: string;
  updatedAt: string;
}

export interface Project {
  id: string;
  specification: ProjectSpecification;
  state: ProjectState;
  analysis?: ProjectAnalysis;
  plan?: HarnessPlan;
  createdAt: string;
  updatedAt: string;
}
