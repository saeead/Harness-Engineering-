/**
 * Wizard Container Component
 * Orchestrates the 8-step guided experience:
 * - State management and step validation
 * - Dynamic step navigation with direction-aware buttons (LTR vs RTL)
 * - Safe progression gating
 */

import React from 'react';
import { useProjectInput, WorkflowStep } from '../../state/project-input.context';
import { useI18n } from '../../i18n/i18n-context';
import { useNotification } from '../../state/notification.context';
import { WizardStepper } from './WizardStepper';
import { Step1ProjectIntroduction } from './Step1ProjectIntroduction';
import { Step2ProjectRequirements } from './Step2ProjectRequirements';
import { AnalysisClarificationView } from './AnalysisClarificationView';
import { Step4HarnessConfig } from './Step4HarnessConfig';
import { Step5PlanReview } from './Step5PlanReview';
import { Step6GenerateStructure } from './Step6GenerateStructure';
import { Step7ValidateResult } from './Step7ValidateResult';
import { Step8ExportDestination } from './Step8ExportDestination';
import { Button } from '../primitives/Button';

export const WizardContainer: React.FC = () => {
  const {
    activeStep,
    goToStep,
    spec,
    analysis,
    runAnalysis,
    isAnalyzing,
    harnessPlan,
    generateHarnessPlan,
    isPlanning,
    saveProjectDraft,
  } = useProjectInput();

  const { t, isRTL } = useI18n();
  const { notifyWarning, notifySuccess } = useNotification();

  // Validate if step can proceed
  const handleNextStep = async () => {
    if (activeStep === 1) {
      if (!spec.name?.trim() || !spec.description?.trim()) {
        notifyWarning(t.wizard.cannotProceedError, t.wizard.fillRequiredFields);
        return;
      }
      goToStep(2);
      return;
    }

    if (activeStep === 2) {
      if (!analysis) {
        try {
          await runAnalysis();
          goToStep(3);
        } catch {
          goToStep(3);
        }
      } else {
        goToStep(3);
      }
      return;
    }

    if (activeStep === 3) {
      goToStep(4);
      return;
    }

    if (activeStep === 4) {
      if (!harnessPlan) {
        await generateHarnessPlan();
      }
      goToStep(5);
      return;
    }

    if (activeStep === 5) {
      await generateHarnessPlan();
      goToStep(6);
      return;
    }

    if (activeStep === 6) {
      goToStep(7);
      return;
    }

    if (activeStep === 7) {
      goToStep(8);
      return;
    }
  };

  const handlePrevStep = () => {
    if (activeStep > 1) {
      goToStep((activeStep - 1) as WorkflowStep);
    }
  };

  const handleSaveDraft = async () => {
    await saveProjectDraft();
    notifySuccess(t.common.success, t.workflow.specification.savedNotice);
  };

  const isLastStep = activeStep === 8;
  const prevIcon = isRTL ? '→' : '←';
  const nextIcon = isRTL ? '←' : '→';

  return (
    <div className="space-y-6">
      {/* 8-Step Stepper Header */}
      <WizardStepper />

      {/* Step View Content */}
      <div className="min-h-[480px]">
        {activeStep === 1 && <Step1ProjectIntroduction />}
        {activeStep === 2 && <Step2ProjectRequirements />}
        {activeStep === 3 && <AnalysisClarificationView />}
        {activeStep === 4 && <Step4HarnessConfig />}
        {activeStep === 5 && <Step5PlanReview />}
        {activeStep === 6 && <Step6GenerateStructure />}
        {activeStep === 7 && <Step7ValidateResult />}
        {activeStep === 8 && <Step8ExportDestination />}
      </div>

      {/* Bottom Sticky-Safe Navigation Bar */}
      <div className="border-t border-neutral-800/80 pt-6 mt-8">
        <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
          <div>
            {activeStep > 1 && (
              <Button
                type="button"
                variant="outline"
                size="md"
                onClick={handlePrevStep}
                className="cursor-pointer text-xs"
              >
                <span>{prevIcon}</span> {t.wizard.prevStepBtn.replace(/^[←→]\s*|\s*[←→]$/g, '')}
              </Button>
            )}
          </div>

          <div className="flex items-center gap-3">
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleSaveDraft}
              className="hidden sm:inline-flex cursor-pointer text-xs text-neutral-400 hover:text-neutral-200"
            >
              {t.workflow.form.saveDraftBtn}
            </Button>

            {!isLastStep ? (
              <Button
                type="button"
                variant="primary"
                size="md"
                isLoading={isAnalyzing || isPlanning}
                onClick={handleNextStep}
                className="cursor-pointer bg-sky-600 hover:bg-sky-500 text-white font-medium text-xs shadow-md"
              >
                {t.wizard.nextStepBtn.replace(/^[←→]\s*|\s*[←→]$/g, '')} <span>{nextIcon}</span>
              </Button>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
};
