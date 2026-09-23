/**
 * Step Progress Header
 * Displays the 4-phase workflow progression with zero-pill typographic clarity.
 */

import React from 'react';
import { useProjectInput, WorkflowStep } from '../../state/project-input.context';
import { useI18n } from '../../i18n/i18n-context';

export const StepProgressHeader: React.FC = () => {
  const { activeStep, goToStep, analysis, harnessPlan } = useProjectInput();
  const { t } = useI18n();

  const steps: Array<{
    step: WorkflowStep;
    num: string;
    title: string;
    desc: string;
    canNavigate: boolean;
  }> = [
    {
      step: 1,
      num: '01',
      title: t.workflow.steps.intake,
      desc: t.workflow.steps.intakeDesc,
      canNavigate: true,
    },
    {
      step: 2,
      num: '02',
      title: t.workflow.steps.analysis,
      desc: t.workflow.steps.analysisDesc,
      canNavigate: Boolean(analysis),
    },
    {
      step: 3,
      num: '03',
      title: t.workflow.steps.specification,
      desc: t.workflow.steps.specificationDesc,
      canNavigate: Boolean(analysis),
    },
    {
      step: 4,
      num: '04',
      title: t.workflow.steps.planning,
      desc: t.workflow.steps.planningDesc,
      canNavigate: Boolean(harnessPlan),
    },
  ];

  return (
    <div className="w-full border-b border-neutral-800/80 pb-6 mb-8">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {steps.map((item) => {
          const isCurrent = activeStep === item.step;
          const isPassed = activeStep > item.step;

          return (
            <button
              key={item.step}
              type="button"
              disabled={!item.canNavigate}
              onClick={() => item.canNavigate && goToStep(item.step)}
              className={`text-start p-4 rounded-xl border transition-all text-xs ${
                isCurrent
                  ? 'bg-neutral-900 border-neutral-500 shadow-md text-neutral-100 ring-1 ring-neutral-400'
                  : isPassed
                  ? 'bg-neutral-900/40 border-neutral-800 text-neutral-300 hover:border-neutral-700 cursor-pointer'
                  : 'bg-neutral-900/20 border-neutral-850 text-neutral-500 cursor-not-allowed'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <span className="font-mono text-neutral-400 font-semibold">{item.num}</span>
                {isPassed && (
                  <span className="text-emerald-400 font-medium">✓ Completed</span>
                )}
                {isCurrent && (
                  <span className="text-sky-400 font-medium">● Active Step</span>
                )}
              </div>
              <h3 className="font-semibold text-sm mb-1 text-neutral-200">
                {item.title}
              </h3>
              <p className="text-neutral-400 text-xs leading-relaxed line-clamp-2">
                {item.desc}
              </p>
            </button>
          );
        })}
      </div>
    </div>
  );
};
