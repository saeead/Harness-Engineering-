/**
 * Project Input State Context
 * Manages the core project-definition workflow:
 * Idea & Inputs -> Progressive Disclosure -> AI Analysis -> Question Answering -> Final Specification & Harness Level.
 */

import React, { createContext, useContext, useState, useMemo, useEffect, useCallback } from 'react';
import {
  HarnessLevel,
  HarnessPlan,
  GeneratedFile,
  HarnessValidationReport,
  Project,
  ProjectAnalysis,
  ProjectSpecification,
  ValidationResult,
  RepositoryAnalysisReport,
} from '../domain/models';
import { Validator } from '../core/validation/validator';
import { aiProviderRegistry } from '../services/providers/ai/ai-provider.registry';
import { storageProviderRegistry } from '../services/providers/storage/storage-provider.registry';
import { HarnessEngine } from '../services/harness/harness-engine';
import { RepositoryIntelligenceEngine, ScanOptions } from '../services/analysis/repository-intelligence.engine';


export const INITIAL_SPECIFICATION: ProjectSpecification = {

  name: '',
  projectType: 'web',
  description: '',
  targetUsers: '',
  primaryGoals: [],
  coreFeatures: [],
  expectedPlatforms: ['web'],
  preferredTechnology: 'TypeScript / React / Vite',
  constraints: ['Enforce strict local-first data architecture', 'Zero external telemetry without user consent'],
  technicalRequirements: ['Modern Node.js runtime', 'ESM imports only'],
  securityRequirements: ['In-memory credential vault', 'Sanitize all external inputs'],
  testingExpectations: ['Unit tests for core logic', 'Clean static type checking verification'],
  definitionOfDone: [
    'Code passes build without syntax/type errors',
    'Session handoff note updated in repository',
    'Verification criteria met with evidence',
  ],
  targetHarnessLevel: 'medium',
  multiAgentEnabled: false,
  existingRepoUrl: '',
  // Aliases for compatibility
  targetPlatform: 'web',
  primaryLanguage: 'TypeScript',
  frameworkOrStack: 'React + Node.js',
  coreObjectives: [],
  architecturalConstraints: [],
  testingRequirements: [],
  features: [],
};

export type WorkflowStep = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;

interface ProjectInputContextValue {
  spec: ProjectSpecification;
  validation: ValidationResult;
  analysis: ProjectAnalysis | null;
  isAnalyzing: boolean;
  activeStep: WorkflowStep;
  savedProjectId: string | null;
  lastSavedAt: string | null;
  harnessPlan: HarnessPlan | null;
  generatedFiles: GeneratedFile[];
  harnessValidation: HarnessValidationReport | null;
  isPlanning: boolean;
  activeReport: RepositoryAnalysisReport | null;
  isAnalyzingRepo: boolean;
  updateField: <K extends keyof ProjectSpecification>(field: K, value: ProjectSpecification[K]) => void;
  resetDraft: () => void;
  setFullSpec: (spec: ProjectSpecification) => void;
  goToStep: (step: WorkflowStep) => void;
  runAnalysis: () => Promise<ProjectAnalysis>;
  applySuggestion: (field: string, value: string) => void;
  answerQuestion: (questionId: string, answer: string) => void;
  selectHarnessLevel: (level: HarnessLevel) => void;
  generateHarnessPlan: (level?: HarnessLevel) => Promise<{
    plan: HarnessPlan;
    files: GeneratedFile[];
    validation: HarnessValidationReport;
  }>;
  saveProjectDraft: () => Promise<string>;
  loadSavedProject: (projectId: string) => Promise<boolean>;
  exportGeneratedFilesJson: () => string;
  analyzeRepository: (options: ScanOptions) => Promise<RepositoryAnalysisReport>;
  adoptRemediationPlan: (report: RepositoryAnalysisReport) => Promise<void>;
}



const ProjectInputContext = createContext<ProjectInputContextValue | null>(null);

const DRAFT_STORAGE_KEY = 'harness_gen:active_draft';

export function ProjectInputProvider({ children }: { children: React.ReactNode }) {
  const [spec, setSpec] = useState<ProjectSpecification>(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        const cached = window.localStorage.getItem(DRAFT_STORAGE_KEY);
        if (cached) {
          const parsed = JSON.parse(cached);
          return { ...INITIAL_SPECIFICATION, ...parsed };
        }
      } catch {
        // Fall back to default
      }
    }
    return INITIAL_SPECIFICATION;
  });

  const [analysis, setAnalysis] = useState<ProjectAnalysis | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState<boolean>(false);
  const [activeStep, setActiveStep] = useState<WorkflowStep>(1);
  const [savedProjectId, setSavedProjectId] = useState<string | null>(null);
  const [lastSavedAt, setLastSavedAt] = useState<string | null>(null);

  // Harness Plan & In-Memory Generated Files State
  const [harnessPlan, setHarnessPlan] = useState<HarnessPlan | null>(null);
  const [generatedFiles, setGeneratedFiles] = useState<GeneratedFile[]>([]);
  const [harnessValidation, setHarnessValidation] = useState<HarnessValidationReport | null>(null);
  const [isPlanning, setIsPlanning] = useState<boolean>(false);

  // Repository Intelligence & Audit State
  const [activeReport, setActiveReport] = useState<RepositoryAnalysisReport | null>(null);
  const [isAnalyzingRepo, setIsAnalyzingRepo] = useState<boolean>(false);


  // Sync validation continuously

  const validation = useMemo(() => {
    return Validator.validateProjectSpecification(spec);
  }, [spec]);

  // Auto-save draft changes locally
  useEffect(() => {
    if (typeof window !== 'undefined' && window.localStorage) {
      try {
        window.localStorage.setItem(DRAFT_STORAGE_KEY, JSON.stringify(spec));
      } catch {
        // Ignore quota errors
      }
    }
  }, [spec]);

  const updateField = <K extends keyof ProjectSpecification>(
    field: K,
    value: ProjectSpecification[K],
  ) => {
    setSpec((prev) => {
      const updated = { ...prev, [field]: value };
      // Sync backwards compatible aliases
      if (field === 'preferredTechnology' && typeof value === 'string') {
        updated.primaryLanguage = value;
        updated.frameworkOrStack = value;
      }
      if (field === 'projectType') {
        updated.targetPlatform = value as any;
      }
      if (field === 'primaryGoals') {
        updated.coreObjectives = value as string[];
      }
      return updated;
    });
  };

  const resetDraft = () => {
    setSpec(INITIAL_SPECIFICATION);
    setAnalysis(null);
    setActiveStep(1);
    setSavedProjectId(null);
    if (typeof window !== 'undefined' && window.localStorage) {
      window.localStorage.removeItem(DRAFT_STORAGE_KEY);
    }
  };

  const setFullSpec = (newSpec: ProjectSpecification) => {
    setSpec(newSpec);
  };

  const goToStep = (step: WorkflowStep) => {
    setActiveStep(step);
  };

  const selectHarnessLevel = (level: HarnessLevel) => {
    updateField('targetHarnessLevel', level);
  };

  // Run AI Analysis workflow
  const runAnalysis = useCallback(async (): Promise<ProjectAnalysis> => {
    setIsAnalyzing(true);
    try {
      const provider = aiProviderRegistry.getActiveProvider();
      const result = await provider.analyzeSpecification(spec);
      setAnalysis(result);
      // Auto-suggest harness level if not already explicitly changed
      if (result.recommendedLevel && spec.targetHarnessLevel === 'medium') {
        updateField('targetHarnessLevel', result.recommendedLevel);
      }
      setActiveStep(2);
      return result;
    } finally {
      setIsAnalyzing(false);
    }
  }, [spec]);

  // Apply a suggested field from analysis directly to the spec
  const applySuggestion = (field: string, value: string) => {
    if (field === 'targetUsers') {
      updateField('targetUsers', value);
    } else if (field === 'securityRequirements') {
      updateField('securityRequirements', [
        ...spec.securityRequirements.filter((r) => r !== value),
        value,
      ]);
    } else if (field === 'testingExpectations') {
      updateField('testingExpectations', [
        ...spec.testingExpectations.filter((r) => r !== value),
        value,
      ]);
    } else if (field === 'definitionOfDone') {
      updateField('definitionOfDone', [
        ...spec.definitionOfDone.filter((r) => r !== value),
        value,
      ]);
    }

    // Remove from suggested list in analysis once applied
    if (analysis) {
      setAnalysis({
        ...analysis,
        suggestedFields: analysis.suggestedFields.filter((s) => s.field !== field),
      });
    }
  };

  // Answer follow-up questions
  const answerQuestion = (questionId: string, answer: string) => {
    if (!analysis) return;

    const updatedQuestions = analysis.followUpQuestions.map((q) =>
      q.id === questionId ? { ...q, userAnswer: answer } : q,
    );

    setAnalysis({
      ...analysis,
      followUpQuestions: updatedQuestions,
    });

    // Automatically incorporate answered question into the spec
    const targetQ = analysis.followUpQuestions.find((q) => q.id === questionId);
    if (targetQ) {
      if (targetQ.category === 'security') {
        updateField('securityRequirements', [
          ...spec.securityRequirements.filter((s) => !s.startsWith('Answer:')),
          `Requirement: ${answer}`,
        ]);
      } else if (targetQ.category === 'testing') {
        updateField('testingExpectations', [
          ...spec.testingExpectations.filter((s) => !s.startsWith('Verification:')),
          `Verification gate: ${answer}`,
        ]);
      } else if (targetQ.category === 'architecture') {
        updateField('constraints', [
          ...spec.constraints.filter((s) => !s.startsWith('Constraint:')),
          `Constraint: ${answer}`,
        ]);
      } else if (targetQ.category === 'stack') {
        updateField('preferredTechnology', answer);
      }
    }
  };

  // Local persistence
  const saveProjectDraft = async (): Promise<string> => {
    const storage = storageProviderRegistry.getActiveProvider();
    const id = savedProjectId || `proj_${Date.now()}`;
    const projectRecord: Project = {
      id,
      specification: spec,
      state: {
        phase: activeStep >= 6 ? 'planned' : analysis ? 'analyzed' : 'draft',
        completionPercentage: Math.min(100, Math.round((activeStep / 8) * 100)),
        blockers: [],
        updatedAt: new Date().toISOString(),
      },
      analysis: analysis || undefined,
      createdAt: spec.name ? new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    await storage.saveProject(projectRecord);
    setSavedProjectId(id);
    setLastSavedAt(new Date().toLocaleTimeString());
    return id;
  };

  const loadSavedProject = async (projectId: string): Promise<boolean> => {
    const storage = storageProviderRegistry.getActiveProvider();
    const loaded = await storage.getProject(projectId);
    if (loaded) {
      setSpec(loaded.specification);
      if (loaded.analysis) {
        setAnalysis(loaded.analysis);
      }
      setSavedProjectId(loaded.id);
      setLastSavedAt(new Date(loaded.updatedAt).toLocaleTimeString());
      return true;
    }
    return false;
  };

  // Harness Engine Execution: Plan -> Generate in-memory files -> Validate
  const generateHarnessPlan = async (
    targetLevel?: HarnessLevel,
  ): Promise<{
    plan: HarnessPlan;
    files: GeneratedFile[];
    validation: HarnessValidationReport;
  }> => {
    setIsPlanning(true);
    try {
      const selectedLevel = targetLevel || spec.targetHarnessLevel || 'medium';
      const result = HarnessEngine.execute(spec, selectedLevel);
      setHarnessPlan(result.plan);
      setGeneratedFiles(result.files);
      setHarnessValidation(result.validation);
      setActiveStep(4);
      return result;
    } finally {
      setIsPlanning(false);
    }
  };

  const exportGeneratedFilesJson = (): string => {
    const payload = {
      project: spec.name,
      level: harnessPlan?.level || spec.targetHarnessLevel,
      generatedAt: new Date().toISOString(),
      plan: harnessPlan,
      validation: harnessValidation,
      filesCount: generatedFiles.length,
      files: generatedFiles.map((f) => ({
        path: f.path,
        filename: f.filename,
        category: f.category,
        subsystem: f.subsystem,
        fileType: f.fileType,
        linesCount: f.linesCount,
        sizeBytes: f.sizeBytes,
        content: f.content,
      })),
    };
    return JSON.stringify(payload, null, 2);
  };

  const analyzeRepository = async (options: ScanOptions): Promise<RepositoryAnalysisReport> => {
    setIsAnalyzingRepo(true);
    try {
      const report = await RepositoryIntelligenceEngine.analyze(options);
      setActiveReport(report);
      return report;
    } finally {
      setIsAnalyzingRepo(false);
    }
  };

  const adoptRemediationPlan = async (report: RepositoryAnalysisReport): Promise<void> => {
    const inferred = report.remediationPlan.inferredSpecification;
    const targetLevel = report.remediationPlan.proposedHarnessLevel;

    // Merge inferred specification into active spec
    const updatedSpec: ProjectSpecification = {
      ...spec,
      ...inferred,
      targetHarnessLevel: targetLevel,
      name: inferred.name || spec.name,
      description: inferred.description || spec.description,
      projectType: inferred.projectType || spec.projectType,
      preferredTechnology: inferred.preferredTechnology || spec.preferredTechnology,
      primaryGoals: inferred.primaryGoals || spec.primaryGoals,
      coreFeatures: inferred.coreFeatures || spec.coreFeatures,
      constraints: inferred.constraints || spec.constraints,
      testingExpectations: inferred.testingExpectations || spec.testingExpectations,
      definitionOfDone: inferred.definitionOfDone || spec.definitionOfDone,
    };

    setSpec(updatedSpec);

    // Directly execute Harness Planning & In-Memory generation with the proposed level!
    setIsPlanning(true);
    try {
      const result = HarnessEngine.execute(updatedSpec, targetLevel);
      setHarnessPlan(result.plan);
      setGeneratedFiles(result.files);
      setHarnessValidation(result.validation);
      setActiveStep(4); // Move directly to generated artifacts step!
    } finally {
      setIsPlanning(false);
    }
  };

  const value = useMemo(
    () => ({
      spec,
      validation,
      analysis,
      isAnalyzing,
      activeStep,
      savedProjectId,
      lastSavedAt,
      harnessPlan,
      generatedFiles,
      harnessValidation,
      isPlanning,
      activeReport,
      isAnalyzingRepo,
      updateField,
      resetDraft,
      setFullSpec,
      goToStep,
      runAnalysis,
      applySuggestion,
      answerQuestion,
      selectHarnessLevel,
      generateHarnessPlan,
      saveProjectDraft,
      loadSavedProject,
      exportGeneratedFilesJson,
      analyzeRepository,
      adoptRemediationPlan,
    }),
    [
      spec,
      validation,
      analysis,
      isAnalyzing,
      activeStep,
      savedProjectId,
      lastSavedAt,
      harnessPlan,
      generatedFiles,
      harnessValidation,
      isPlanning,
      activeReport,
      isAnalyzingRepo,
      runAnalysis,
    ],
  );



  return (
    <ProjectInputContext.Provider value={value}>
      {children}
    </ProjectInputContext.Provider>
  );
}

export function useProjectInput(): ProjectInputContextValue {
  const context = useContext(ProjectInputContext);
  if (!context) {
    throw new Error('useProjectInput must be used within a ProjectInputProvider');
  }
  return context;
}
