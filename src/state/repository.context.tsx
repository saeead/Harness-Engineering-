/**
 * Repository State Context
 * Tracks export targets, branch names, and repository destinations.
 */

import React, { createContext, useContext, useState, useMemo } from 'react';
import { ExportFormat, ExportTarget } from '../domain/models';

interface RepositoryContextValue {
  target: ExportTarget;
  updateTarget: (partial: Partial<ExportTarget>) => void;
  resetTarget: () => void;
}

const DEFAULT_TARGET: ExportTarget = {
  format: 'zip',
  branchName: 'ai-harness-init',
  commitMessage: 'feat(harness): initialize durable AI coding agent harness',
};

const RepositoryContext = createContext<RepositoryContextValue | null>(null);

export function RepositoryStateProvider({ children }: { children: React.ReactNode }) {
  const [target, setTarget] = useState<ExportTarget>(DEFAULT_TARGET);

  const updateTarget = (partial: Partial<ExportTarget>) => {
    setTarget((prev) => ({ ...prev, ...partial }));
  };

  const resetTarget = () => {
    setTarget(DEFAULT_TARGET);
  };

  const value = useMemo(
    () => ({
      target,
      updateTarget,
      resetTarget,
    }),
    [target],
  );

  return (
    <RepositoryContext.Provider value={value}>
      {children}
    </RepositoryContext.Provider>
  );
}

export function useRepositoryState(): RepositoryContextValue {
  const context = useContext(RepositoryContext);
  if (!context) {
    throw new Error('useRepositoryState must be used within a RepositoryStateProvider');
  }
  return context;
}
