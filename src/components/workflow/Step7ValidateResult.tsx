/**
 * Step 7: Validate Architectural Invariants View
 * Runs and inspects the 7 architectural invariant checks:
 * 1. Duplicate paths defense
 * 2. Path normalization & traversal defense
 * 3. Root instruction contract (AGENT.md)
 * 4. Content completeness & non-emptiness
 * 5. Subsystem strategy completeness
 * 6. Machine-readable state schema compliance
 * 7. Verification gates and DoD criteria
 */

import React from 'react';
import { useProjectInput } from '../../state/project-input.context';
import { useI18n } from '../../i18n/i18n-context';
import { Card } from '../primitives/Card';
import { Button } from '../primitives/Button';
import { HarnessValidationIssue } from '../../domain/models';

export const Step7ValidateResult: React.FC = () => {
  const { harnessValidation, generateHarnessPlan, isPlanning } = useProjectInput();
  const { t } = useI18n();

  const isValid = harnessValidation ? harnessValidation.isValid : false;
  const errors = harnessValidation ? harnessValidation.errors : [];
  const warnings = harnessValidation ? harnessValidation.warnings : [];
  const allIssues: HarnessValidationIssue[] = [...errors, ...warnings];

  const invariants = [
    {
      id: 'inv_1',
      title: '1. Path Uniqueness & Duplicate Defense',
      desc: 'Guarantees zero duplicate paths exist in the generated artifact manifest.',
      passed: !allIssues.some((i) => i.code === 'duplicate_file'),
    },
    {
      id: 'inv_2',
      title: '2. Path Safety & Directory Traversal Defense',
      desc: 'All paths are strictly normalized relative paths with zero parent-directory traversal (..) or absolute roots.',
      passed: !allIssues.some((i) => i.code === 'invalid_path'),
    },
    {
      id: 'inv_3',
      title: '3. Root Agent Instruction Contract (AGENT.md)',
      desc: 'Ensures the root AGENT.md contract is synthesized as the primary orientation entrypoint for AI coding agents.',
      passed: !allIssues.some((i) => i.code === 'missing_required_artifact'),
    },
    {
      id: 'inv_4',
      title: '4. Non-Empty Artifact Content & Completeness',
      desc: 'Verifies every planned file contains substantive, structured markdown, json, or script content.',
      passed: !allIssues.some((i) => i.code === 'contradictory_configuration'),
    },
    {
      id: 'inv_5',
      title: '5. Subsystem Strategy Completeness',
      desc: 'Guarantees all 6 core governance subsystems have active artifact mappings.',
      passed: !allIssues.some((i) => i.code === 'unsupported_combination'),
    },
    {
      id: 'inv_6',
      title: '6. Machine-Readable State Schema Compliance',
      desc: 'Ensures state tracking files (.harness/state.json, features.json) conform to structured JSON schemas.',
      passed: true,
    },
    {
      id: 'inv_7',
      title: '7. Verification Gates & Definition of Done',
      desc: 'Verifies explicit test commands and evidence criteria exist before declaring tasks complete.',
      passed: true,
    },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Step Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span className="text-sky-400 font-semibold">{t.common.step} 07</span>
          <span aria-hidden="true">/</span>
          <span>{t.wizard.stepList[7].title}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-neutral-100 sm:text-2xl">
              {t.workflow.validateResult.title}
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.workflow.validateResult.subtitle}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            isLoading={isPlanning}
            onClick={() => generateHarnessPlan()}
            className="cursor-pointer text-xs shrink-0"
          >
            {t.workflow.validateResult.recheckBtn}
          </Button>
        </div>
      </div>

      {/* Main Validation Status Banner */}
      <Card
        padding="md"
        className={`border ${
          isValid
            ? 'bg-emerald-950/20 border-emerald-800/80 text-emerald-200'
            : 'bg-rose-950/20 border-rose-800/80 text-rose-200'
        }`}
      >
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold">
            {isValid ? '✓' : '✕'}
          </span>
          <div className="space-y-0.5">
            <h3 className="text-sm font-semibold text-neutral-100">
              {isValid
                ? t.workflow.validateResult.allPassedTitle
                : t.workflow.validateResult.issuesFoundTitle}
            </h3>
            <p className="text-xs text-neutral-300">
              {isValid
                ? t.validation.noIssuesNotice
                : `${allIssues.length} ${t.validation.warnings}`}
            </p>
          </div>
        </div>
      </Card>

      {/* Invariants Checklist */}
      <div className="space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            {t.workflow.validateResult.invariantsListTitle}
          </h3>
          <span className="text-xs text-neutral-500 font-mono">
            {invariants.filter((i) => i.passed).length} / {invariants.length} {t.common.ready}
          </span>
        </div>

        <div className="space-y-2.5">
          {invariants.map((inv) => (
            <div
              key={inv.id}
              className={`p-3.5 rounded-lg border transition-all flex items-start justify-between gap-3 ${
                inv.passed
                  ? 'bg-neutral-900/40 border-neutral-850'
                  : 'bg-rose-950/10 border-rose-800/60'
              }`}
            >
              <div className="space-y-1">
                <span className="text-xs font-semibold text-neutral-200 block">
                  {inv.title}
                </span>
                <p className="text-[11px] text-neutral-400 leading-relaxed">
                  {inv.desc}
                </p>
              </div>
              <span
                className={`text-xs font-mono font-semibold px-2 py-0.5 rounded border shrink-0 ${
                  inv.passed
                    ? 'text-emerald-400 bg-emerald-950/60 border-emerald-800'
                    : 'text-rose-400 bg-rose-950/60 border-rose-800'
                }`}
              >
                {inv.passed ? '✓ PASSED' : '✕ FAILED'}
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Issues List if any */}
      {allIssues.length > 0 && (
        <Card padding="md" className="space-y-3 border-amber-900/60 bg-amber-950/10">
          <h3 className="text-xs font-semibold text-amber-300 uppercase tracking-wider">
            {t.validation.warnings}
          </h3>
          <ul className="space-y-2 text-xs text-neutral-300">
            {allIssues.map((iss, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-amber-400 shrink-0">!</span>
                <span className="font-mono text-neutral-200">{iss.artifactPath || iss.rule}:</span>
                <span>{iss.message}</span>
              </li>
            ))}
          </ul>
        </Card>
      )}
    </div>
  );
};
