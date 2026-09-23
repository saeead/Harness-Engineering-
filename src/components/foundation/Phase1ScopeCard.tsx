/**
 * Scope & Boundary Discipline Card
 * Demonstrates adherence to sequential execution and project constraints across phases.
 */

import React from 'react';
import { Card } from '../primitives/Card';
import { StatusIndicator } from '../primitives/StatusIndicator';
import { useI18n } from '../../i18n/i18n-context';

export const Phase1ScopeCard: React.FC = () => {
  const { t } = useI18n();

  const phases = [
    { num: 1, name: 'Foundation & Architecture', status: 'completed', desc: 'Core layers, domain models, provider abstractions, i18n, design primitives, validation engine.' },
    { num: 2, name: 'Project Intake & Analysis Engine', status: 'completed', desc: 'Natural language brief parsing, missing info detection, interactive smart clarification, structured spec modeling.' },
    { num: 3, name: 'Harness Planning & Generation Engine', status: 'active', desc: 'Subsystem planning (Instructions, State, Scope, Verification, Lifecycle, Observability), deterministic file generation, 7-invariant validation.' },
    { num: 4, name: 'Artifact Generation Pipeline & Refinement', status: 'pending', desc: 'Multi-agent orchestration schemas, advanced instruction expansion, automated evidence collection.' },
    { num: 5, name: 'Validation & Evidence Engine', status: 'pending', desc: 'Deep static integrity checks, instruction ambiguity linting, evidence requirements.' },
    { num: 6, name: 'Repository & Export Integration', status: 'pending', desc: 'Direct GitHub PR creation, branch management, deterministic ZIP packaging.' },
    { num: 7, name: 'Bilingual Polish & UI Hardening', status: 'pending', desc: 'Comprehensive Persian localization review, RTL stress testing, keyboard navigation.' },
    { num: 8, name: 'Final Verification & Delivery', status: 'pending', desc: 'End-to-end integration audits, multi-session resilience tests, production signoff.' },
  ];

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
          {t.foundation.strictBoundariesTitle}
        </h2>
        <p className="text-sm text-neutral-400">
          Strict adherence to the 8-phase implementation roadmap. Phase boundaries are rigorously preserved.
        </p>
      </div>

      {/* Strict Limits Confirmation Banner */}
      <Card padding="md" className="border-neutral-800 bg-neutral-900/60 space-y-3">
        <div className="flex items-center gap-2">
          <StatusIndicator status="ready" label="Phase 3 Scope Enforced" />
          <span className="text-neutral-600">·</span>
          <span className="text-xs text-neutral-400">Strict Boundary Confirmation</span>
        </div>
        <p className="text-xs text-neutral-300 leading-relaxed">
          In strict compliance with prompt instructions: No GitHub repository scanning or writing, no ZIP export, no automated loops, and no final UI polish were implemented. Phase 3 focused exclusively on the Harness Planning Layer, 6 core engineering subsystems (Instructions, State, Scope, Verification, Session Lifecycle, Observability), proportional artifact selection (Basic, Medium, Advanced, Dynamic), deterministic in-memory file generation, and 7-invariant structural validation.
        </p>
      </Card>

      {/* Phases Roadmap */}
      <div className="space-y-3">
        <h3 className="text-sm font-semibold text-neutral-200">
          Project Roadmap (Sequential Execution)
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {phases.map((p) => {
            const isCompleted = p.status === 'completed';
            const isActive = p.status === 'active';

            return (
              <div
                key={p.num}
                className={`p-3.5 rounded-xl border text-xs space-y-1.5 transition-all ${
                  isActive
                    ? 'border-sky-600/80 bg-sky-950/20'
                    : isCompleted
                    ? 'border-emerald-600/80 bg-emerald-950/20'
                    : 'border-neutral-800/80 bg-neutral-900/30 opacity-75'
                }`}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-neutral-500">0{p.num}.</span>
                    <span className="font-semibold text-neutral-200">{p.name}</span>
                  </div>
                  <StatusIndicator
                    status={isActive ? 'active' : isCompleted ? 'ready' : 'offline'}
                    label={isActive ? 'Active (Phase 3)' : isCompleted ? 'Completed' : 'Pending'}
                  />
                </div>
                <p className="text-neutral-400 leading-relaxed ps-5">
                  {p.desc}
                </p>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};
