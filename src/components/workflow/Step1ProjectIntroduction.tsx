/**
 * Step 1: Project Introduction
 * Minimal, focused intake of core project identity:
 * - Project Name
 * - Architecture Type
 * - Natural Language Description / Core Brief
 * - Target Audience & Personas
 */

import React from 'react';
import { useProjectInput } from '../../state/project-input.context';
import { useI18n } from '../../i18n/i18n-context';
import { Card } from '../primitives/Card';
import { Input } from '../primitives/Input';
import { ProjectType } from '../../domain/models';

export const Step1ProjectIntroduction: React.FC = () => {
  const { spec, updateField } = useProjectInput();
  const { t } = useI18n();

  const projectTypes: Array<{ type: ProjectType; label: string }> = [
    { type: 'web', label: t.workflow.projectTypes.web },
    { type: 'api', label: t.workflow.projectTypes.api },
    { type: 'desktop', label: t.workflow.projectTypes.desktop },
    { type: 'mobile', label: t.workflow.projectTypes.mobile },
    { type: 'cli', label: t.workflow.projectTypes.cli },
    { type: 'library', label: t.workflow.projectTypes.library },
    { type: 'service', label: t.workflow.projectTypes.service },
    { type: 'other', label: t.workflow.projectTypes.other },
  ];

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Step Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span className="text-sky-400 font-semibold">{t.common.step} 01</span>
          <span aria-hidden="true">/</span>
          <span>{t.wizard.stepList[1].title}</span>
        </div>
        <h2 className="text-xl font-bold text-neutral-100 sm:text-2xl">
          {t.wizard.stepList[1].title}
        </h2>
        <p className="text-xs text-neutral-400 leading-relaxed">
          {t.wizard.stepList[1].desc}
        </p>
      </div>

      <Card className="p-6 space-y-6 bg-neutral-900/60 border-neutral-800">
        {/* Project Name */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-200">
            {t.workflow.form.projectName}{' '}
            <span className="text-rose-400" title={t.common.required}>*</span>
          </label>
          <Input
            value={spec.name}
            onChange={(e) => updateField('name', e.target.value)}
            placeholder={t.workflow.form.projectNamePlaceholder}
            className="w-full bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:border-sky-500"
          />
          <p className="text-[11px] text-neutral-500">
            {t.workflow.form.projectNameHelp}
          </p>
        </div>

        {/* Project Architecture Type Grid */}
        <div className="space-y-2">
          <label className="block text-xs font-semibold text-neutral-200">
            {t.workflow.form.projectType}{' '}
            <span className="text-rose-400" title={t.common.required}>*</span>
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
            {projectTypes.map(({ type, label }) => {
              const isSelected = spec.projectType === type;
              return (
                <button
                  key={type}
                  type="button"
                  onClick={() => updateField('projectType', type)}
                  className={`p-3 text-start rounded-lg border transition-all cursor-pointer ${
                    isSelected
                      ? 'bg-neutral-800 border-sky-500 text-neutral-100 ring-1 ring-sky-500/50'
                      : 'bg-neutral-950/60 border-neutral-850 text-neutral-400 hover:border-neutral-700 hover:text-neutral-200'
                  }`}
                >
                  <p className="text-xs font-medium leading-tight">{label}</p>
                </button>
              );
            })}
          </div>
          <p className="text-[11px] text-neutral-500">
            {t.workflow.form.projectTypeHelp}
          </p>
        </div>

        {/* Natural Language Description */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-200">
            {t.workflow.form.description}{' '}
            <span className="text-rose-400" title={t.common.required}>*</span>
          </label>
          <textarea
            rows={4}
            value={spec.description}
            onChange={(e) => updateField('description', e.target.value)}
            placeholder={t.workflow.form.descriptionPlaceholder}
            className="w-full p-3 rounded-lg bg-neutral-950 border border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:outline-none focus:border-sky-500 text-xs leading-relaxed"
          />
          <p className="text-[11px] text-neutral-500">
            {t.workflow.form.descriptionHelp}
          </p>
        </div>

        {/* Target Audience */}
        <div className="space-y-1.5">
          <label className="block text-xs font-semibold text-neutral-200">
            {t.workflow.form.targetUsers}{' '}
            <span className="text-neutral-500 text-[10px]">({t.common.optional})</span>
          </label>
          <Input
            value={spec.targetUsers || ''}
            onChange={(e) => updateField('targetUsers', e.target.value)}
            placeholder={t.workflow.form.targetUsersPlaceholder}
            className="w-full bg-neutral-950 border-neutral-800 text-neutral-100 placeholder:text-neutral-600 focus:border-sky-500"
          />
          <p className="text-[11px] text-neutral-500">
            {t.workflow.form.targetUsersHelp}
          </p>
        </div>
      </Card>
    </div>
  );
};
