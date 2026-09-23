/**
 * Generation Domain Models
 * Defines generation lifecycle, jobs, steps, and options.
 */

export type GenerationStatus =
  | 'idle'
  | 'analyzing'
  | 'planning'
  | 'generating'
  | 'validating'
  | 'completed'
  | 'failed';

export type StepStatus = 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';

export interface GenerationStep {
  id: string;
  name: string;
  status: StepStatus;
  message?: string;
  startedAt?: string;
  completedAt?: string;
}

export interface GenerationJob {
  id: string;
  projectId: string;
  status: GenerationStatus;
  progress: number; // 0 to 100
  steps: GenerationStep[];
  currentStepIndex: number;
  error?: string;
  startedAt: string;
  completedAt?: string;
}

export interface GenerationOptions {
  includeExamples: boolean;
  strictVerificationMode: boolean;
  language: 'en' | 'fa';
  dryRun?: boolean;
}
