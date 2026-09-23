/**
 * Step 3: Analysis & Clarification View
 * Displays structured AI analysis, missing information detection, assumptions,
 * architectural enhancements, and targeted questions.
 */

import React, { useState } from 'react';
import { useProjectInput } from '../../state/project-input.context';
import { useI18n } from '../../i18n/i18n-context';
import { useNotification } from '../../state/notification.context';
import { Card } from '../primitives/Card';
import { Button } from '../primitives/Button';
import { StatusIndicator } from '../primitives/StatusIndicator';

export const AnalysisClarificationView: React.FC = () => {
  const {
    analysis,
    goToStep,
    applySuggestion,
    answerQuestion,
    runAnalysis,
    isAnalyzing,
  } = useProjectInput();

  const { t } = useI18n();
  const { notifySuccess } = useNotification();

  const [customAnswers, setCustomAnswers] = useState<Record<string, string>>({});

  if (!analysis) {
    return (
      <div className="text-center py-12 space-y-4 max-w-xl mx-auto">
        <h3 className="text-base font-semibold text-neutral-200">
          {t.workflow.analysis.title}
        </h3>
        <p className="text-neutral-400 text-xs leading-relaxed">
          {t.workflow.analysis.subtitle}
        </p>
        <div className="pt-2">
          <Button
            size="md"
            variant="primary"
            isLoading={isAnalyzing}
            onClick={runAnalysis}
            className="cursor-pointer bg-sky-600 hover:bg-sky-500 text-white"
          >
            {t.workflow.form.runAnalysisBtn}
          </Button>
        </div>
      </div>
    );
  }

  const handleApply = (field: string, val: string) => {
    applySuggestion(field, val);
    notifySuccess(t.common.success, t.workflow.analysis.applied);
  };

  const handleAnswer = (questionId: string, answer: string) => {
    answerQuestion(questionId, answer);
    notifySuccess(t.common.success, t.workflow.analysis.applied);
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header & Confidence Banner */}
      <Card padding="md" className="space-y-3 bg-neutral-900/60 border-neutral-800">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-neutral-800 pb-3">
          <div className="space-y-0.5">
            <h2 className="text-base font-semibold text-neutral-100">
              {t.workflow.analysis.title}
            </h2>
            <p className="text-xs text-neutral-400">
              {t.workflow.analysis.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <StatusIndicator
              status="ready"
              label={`${t.workflow.analysis.confidence}: ${analysis.confidenceScore}%`}
            />
            <Button
              size="sm"
              variant="outline"
              isLoading={isAnalyzing}
              onClick={runAnalysis}
            >
              {t.workflow.analysis.reRunAnalysis}
            </Button>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-y-2 gap-x-6 text-xs text-neutral-400 font-mono">
          <div>
            <span>Engine: </span>
            <span className="text-neutral-200">{analysis.providerId}</span>
          </div>
          <span>·</span>
          <div>
            <span>{t.common.status}: </span>
            <span className="text-neutral-300">{new Date(analysis.analyzedAt).toLocaleTimeString()}</span>
          </div>
          <span>·</span>
          <div>
            <span>{t.workflow.analysis.recommendedLevel}: </span>
            <span className="text-sky-400 font-semibold uppercase">{analysis.recommendedLevel}</span>
          </div>
        </div>
      </Card>

      {/* 1. Understood Requirements */}
      <Card padding="md" className="space-y-3">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300">
            01. {t.workflow.analysis.understoodTitle}
          </h3>
          <span className="text-xs text-neutral-500 font-mono">
            {analysis.understoodRequirements.length}
          </span>
        </div>
        <ul className="space-y-2 text-xs text-neutral-300">
          {analysis.understoodRequirements.map((req, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="text-emerald-400 mt-0.5 shrink-0" aria-hidden="true">✓</span>
              <span className="leading-relaxed">{req}</span>
            </li>
          ))}
        </ul>
      </Card>

      {/* 2. Detected Missing Information & Smart Suggestions */}
      <Card padding="md" className="space-y-4 border-amber-900/40 bg-amber-950/10">
        <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-amber-300">
            02. {t.workflow.analysis.missingTitle}
          </h3>
          <span className="text-xs text-neutral-500 font-mono">
            {analysis.missingInformation.length}
          </span>
        </div>

        <ul className="space-y-2 text-xs text-neutral-300">
          {analysis.missingInformation.map((item, idx) => (
            <li key={idx} className="flex items-start gap-2.5">
              <span className="text-amber-400 mt-0.5 shrink-0" aria-hidden="true">!</span>
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>

        {/* Suggested Field Completions */}
        {analysis.suggestedFields && analysis.suggestedFields.length > 0 && (
          <div className="pt-3 border-t border-neutral-800 space-y-3">
            <h4 className="text-xs font-semibold text-neutral-200">
              {t.workflow.analysis.suggestedFieldsTitle}
            </h4>
            <div className="space-y-3">
              {analysis.suggestedFields.map((sug) => (
                <div
                  key={sug.field}
                  className="bg-neutral-900/80 p-3.5 rounded-lg border border-neutral-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                >
                  <div className="space-y-1">
                    <span className="text-xs font-semibold text-neutral-200 block">
                      {sug.label}
                    </span>
                    <p className="text-xs text-neutral-400 italic">
                      "{sug.suggestedValue}"
                    </p>
                    <p className="text-[11px] text-neutral-500">
                      {sug.rationale}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleApply(sug.field, sug.suggestedValue)}
                    className="shrink-0 text-xs cursor-pointer"
                  >
                    {t.workflow.analysis.applySuggestion}
                  </Button>
                </div>
              ))}
            </div>
          </div>
        )}
      </Card>

      {/* 3. Ambiguities & Technical Assumptions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card padding="md" className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 border-b border-neutral-800/80 pb-2">
            03. {t.workflow.analysis.ambiguitiesTitle}
          </h3>
          {analysis.ambiguities.length > 0 ? (
            <ul className="space-y-2 text-xs text-neutral-400">
              {analysis.ambiguities.map((amb, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <span className="text-rose-400 shrink-0">•</span>
                  <span>{amb}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-xs text-neutral-500 italic">{t.workflow.analysis.noGapsFound}</p>
          )}
        </Card>

        <Card padding="md" className="space-y-3">
          <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-300 border-b border-neutral-800/80 pb-2">
            04. {t.workflow.analysis.assumptionsTitle}
          </h3>
          <ul className="space-y-2 text-xs text-neutral-400">
            {analysis.assumptions.map((assump, idx) => (
              <li key={idx} className="flex items-start gap-2">
                <span className="text-sky-400 shrink-0">•</span>
                <span>{assump}</span>
              </li>
            ))}
          </ul>
        </Card>
      </div>

      {/* 4. Targeted Clarification Questions */}
      {analysis.followUpQuestions && analysis.followUpQuestions.length > 0 && (
        <Card padding="md" className="space-y-4">
          <div className="flex items-center justify-between border-b border-neutral-800/80 pb-2">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-neutral-200">
              05. {t.workflow.analysis.questionsTitle}
            </h3>
            <span className="text-xs text-neutral-500 font-mono">
              {analysis.followUpQuestions.length}
            </span>
          </div>

          <div className="space-y-4">
            {analysis.followUpQuestions.map((q) => {
              const isAnswered = Boolean(q.userAnswer);
              const customVal = customAnswers[q.id] || '';

              return (
                <div
                  key={q.id}
                  className={`p-4 rounded-xl border space-y-3 transition-colors ${
                    isAnswered
                      ? 'bg-neutral-900/90 border-neutral-700'
                      : 'bg-neutral-900/40 border-neutral-800/80'
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="space-y-1">
                      <span className="text-[11px] font-mono uppercase tracking-wider text-neutral-500">
                        {q.category}
                      </span>
                      <h4 className="text-xs font-semibold text-neutral-100">
                        {q.question}
                      </h4>
                    </div>
                    {isAnswered && (
                      <span className="text-[11px] text-emerald-400 font-medium">
                        ✓ {t.common.completed}
                      </span>
                    )}
                  </div>

                  {/* Preset option buttons */}
                  {q.options && q.options.length > 0 && (
                    <div className="flex flex-wrap gap-2 pt-1">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = q.userAnswer === opt;
                        return (
                          <button
                            key={optIdx}
                            type="button"
                            onClick={() => handleAnswer(q.id, opt)}
                            className={`text-xs px-3 py-1.5 rounded-lg border text-start transition-all cursor-pointer ${
                              isSelected
                                ? 'bg-neutral-100 text-neutral-950 border-white font-medium'
                                : 'bg-neutral-950 text-neutral-300 border-neutral-800 hover:border-neutral-700 hover:text-white'
                            }`}
                          >
                            {opt}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {/* Custom answer input */}
                  <div className="flex items-center gap-2 pt-2">
                    <input
                      type="text"
                      placeholder={t.workflow.analysis.answerPlaceholder}
                      value={customVal}
                      onChange={(e) =>
                        setCustomAnswers({ ...customAnswers, [q.id]: e.target.value })
                      }
                      className="flex-1 bg-neutral-950 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-neutral-200 placeholder:text-neutral-500 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-neutral-400"
                    />
                    <Button
                      size="sm"
                      variant="secondary"
                      disabled={!customVal.trim()}
                      onClick={() => {
                        handleAnswer(q.id, customVal.trim());
                        setCustomAnswers({ ...customAnswers, [q.id]: '' });
                      }}
                    >
                      {t.common.save}
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}
    </div>
  );
};
