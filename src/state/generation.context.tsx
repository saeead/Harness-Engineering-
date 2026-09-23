/**
 * Generation State
 * Manages harness generation job status, lifecycle stages, and execution tracking.
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import { GenerationJob, GenerationStatus } from '../domain/models';

interface GenerationContextValue {
  currentJob: GenerationJob | null;
  status: GenerationStatus;
  progress: number;
  isGenerating: boolean;
  startJob: (projectId: string) => void;
  updateProgress: (progress: number, stepName?: string) => void;
  failJob: (error: string) => void;
  completeJob: () => void;
  resetJob: () => void;
}

const GenerationContext = createContext<GenerationContextValue | null>(null);

export function GenerationProvider({ children }: { children: React.ReactNode }) {
  const [currentJob, setCurrentJob] = useState<GenerationJob | null>(null);

  const status: GenerationStatus = currentJob?.status || 'idle';
  const progress = currentJob?.progress || 0;
  const isGenerating =
    status === 'analyzing' || status === 'planning' || status === 'generating' || status === 'validating';

  const startJob = (projectId: string) => {
    setCurrentJob({
      id: `job_${Date.now()}`,
      projectId,
      status: 'analyzing',
      progress: 5,
      steps: [
        { id: '1', name: 'Specification Analysis', status: 'in_progress', startedAt: new Date().toISOString() },
        { id: '2', name: 'Harness Topology Planning', status: 'pending' },
        { id: '3', name: 'Artifact Generation', status: 'pending' },
        { id: '4', name: 'Verification & Packaging', status: 'pending' },
      ],
      currentStepIndex: 0,
      startedAt: new Date().toISOString(),
    });
  };

  const updateProgress = (newProgress: number, stepMessage?: string) => {
    setCurrentJob((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        progress: Math.min(100, Math.max(0, newProgress)),
        steps: prev.steps.map((step, idx) =>
          idx === prev.currentStepIndex
            ? { ...step, message: stepMessage || step.message }
            : step,
        ),
      };
    });
  };

  const failJob = (error: string) => {
    setCurrentJob((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'failed',
        error,
        completedAt: new Date().toISOString(),
      };
    });
  };

  const completeJob = () => {
    setCurrentJob((prev) => {
      if (!prev) return null;
      return {
        ...prev,
        status: 'completed',
        progress: 100,
        completedAt: new Date().toISOString(),
      };
    });
  };

  const resetJob = () => {
    setCurrentJob(null);
  };

  const value = useMemo(
    () => ({
      currentJob,
      status,
      progress,
      isGenerating,
      startJob,
      updateProgress,
      failJob,
      completeJob,
      resetJob,
    }),
    [currentJob, status, progress, isGenerating],
  );

  return (
    <GenerationContext.Provider value={value}>
      {children}
    </GenerationContext.Provider>
  );
}

export function useGeneration(): GenerationContextValue {
  const context = useContext(GenerationContext);
  if (!context) {
    throw new Error('useGeneration must be used within a GenerationProvider');
  }
  return context;
}
