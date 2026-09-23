/**
 * Wizard Stepper Component
 * 8-Step clean progress indicator following the strict Design Constitution:
 * - Anti-AI slop, zero pill badges, tabular numerals, unboxed status indicators.
 * - Bilingual English (LTR) and Persian (RTL) support with proper directional icons.
 */

import React from 'react';
import { useProjectInput, WorkflowStep } from '../../state/project-input.context';
import { useI18n } from '../../i18n/i18n-context';

export const WizardStepper: React.FC = () => {
  const { activeStep, goToStep, spec, analysis, harnessPlan, generatedFiles } = useProjectInput();
  const { t, isRTL } = useI18n();

  const isStep1Valid = Boolean(spec.name?.trim() && spec.description?.trim());
  const isStep2Valid = isStep1Valid;
  const isStep3Valid = Boolean(analysis);
  const isStep4Valid = Boolean(spec.targetHarnessLevel);
  const isStep5Valid = Boolean(harnessPlan);
  const isStep6Valid = generatedFiles.length > 0;
  const isStep7Valid = generatedFiles.length > 0;

  // Determine if a step is allowed to be directly navigated to
  const canNavigateToStep = (step: WorkflowStep): boolean => {
    if (step === 1) return true;
    if (step === 2) return isStep1Valid;
    if (step === 3) return isStep2Valid;
    if (step === 4) return isStep3Valid;
    if (step === 5) return Boolean(harnessPlan);
    if (step === 6) return Boolean(harnessPlan);
    if (step === 7) return isStep6Valid;
    if (step === 8) return isStep6Valid;
    return false;
  };

  const steps: Array<{ step: WorkflowStep; num: string }> = [
    { step: 1, num: '01' },
    { step: 2, num: '02' },
    { step: 3, num: '03' },
    { step: 4, num: '04' },
    { step: 5, num: '05' },
    { step: 6, num: '06' },
    { step: 7, num: '07' },
    { step: 8, num: '08' },
  ];

  return (
    <div className="w-full border-b border-neutral-800 pb-5 mb-8">
      {/* Top Meta & Step Counter */}
      <div className="flex items-center justify-between text-xs text-neutral-400 mb-3 font-mono">
        <div className="flex items-center gap-2">
          <span className="text-neutral-200 font-semibold">{t.wizard.title}</span>
          <span aria-hidden="true">·</span>
          <span>
            {t.common.step} {activeStep} {t.common.of} 8
          </span>
        </div>
        <div className="hidden sm:flex items-center gap-2 text-[11px]">
          <span className="text-sky-400 font-medium">● {t.wizard.activeStepBadge}</span>
          <span className="text-neutral-600">|</span>
          <span className="text-emerald-400 font-medium">✓ {t.wizard.completedBadge}</span>
        </div>
      </div>

      {/* Stepper Grid: 8 Responsive Columns */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-8 gap-2">
        {steps.map(({ step, num }) => {
          const isCurrent = activeStep === step;
          const isPassed = activeStep > step;
          const canClick = canNavigateToStep(step);
          const stepMeta = t.wizard.stepList[step];

          return (
            <button
              key={step}
              type="button"
              disabled={!canClick}
              onClick={() => canClick && goToStep(step)}
              className={`text-start p-2.5 rounded-lg border transition-all cursor-pointer ${
                isCurrent
                  ? 'bg-neutral-900 border-sky-500/80 shadow-sm text-neutral-100 ring-1 ring-sky-500/40'
                  : isPassed
                  ? 'bg-neutral-900/40 border-neutral-800 text-neutral-300 hover:border-neutral-700'
                  : 'bg-neutral-950/40 border-neutral-900 text-neutral-600 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-1.5">
                <span className={`font-mono text-xs font-semibold ${isCurrent ? 'text-sky-400' : isPassed ? 'text-emerald-400' : 'text-neutral-500'}`}>
                  {num}
                </span>
                {isPassed && (
                  <span className="text-emerald-400 font-bold text-xs" title={t.wizard.completedBadge}>
                    ✓
                  </span>
                )}
                {isCurrent && (
                  <span className="w-1.5 h-1.5 rounded-full bg-sky-400 animate-pulse" title={t.wizard.activeStepBadge} />
                )}
              </div>

              <p className={`text-xs font-medium truncate ${isCurrent ? 'text-neutral-100 font-semibold' : isPassed ? 'text-neutral-300' : 'text-neutral-500'}`}>
                {stepMeta?.title || `Step ${step}`}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
