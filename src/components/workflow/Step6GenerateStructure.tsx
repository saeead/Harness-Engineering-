/**
 * Step 6: Generate Harness Structure View
 * Deterministic in-memory file synthesis, interactive artifact explorer,
 * syntax preview inspector, and manifest export.
 */

import React, { useState, useEffect } from 'react';
import { useProjectInput } from '../../state/project-input.context';
import { useI18n } from '../../i18n/i18n-context';
import { useNotification } from '../../state/notification.context';
import { Card } from '../primitives/Card';
import { Button } from '../primitives/Button';
import { GeneratedFile } from '../../domain/models';

export const Step6GenerateStructure: React.FC = () => {
  const {
    generatedFiles,
    harnessPlan,
    generateHarnessPlan,
    isPlanning,
    exportGeneratedFilesJson,
  } = useProjectInput();

  const { t } = useI18n();
  const { notifySuccess } = useNotification();

  const [selectedFile, setSelectedFile] = useState<GeneratedFile | null>(null);
  const [activeCategory, setActiveCategory] = useState<string>('all');
  const [isCopied, setIsCopied] = useState(false);

  // Auto-generate if files not generated yet
  useEffect(() => {
    if (generatedFiles.length === 0 && !isPlanning) {
      generateHarnessPlan();
    }
  }, [generatedFiles.length, isPlanning]);

  // Set default selected file on generation
  useEffect(() => {
    if (generatedFiles.length > 0 && !selectedFile) {
      const rootAgent = generatedFiles.find((f) => f.path === 'AGENT.md') || generatedFiles[0];
      setSelectedFile(rootAgent);
    }
  }, [generatedFiles, selectedFile]);

  const categories = [
    { id: 'all', label: t.workflow.generateStructure.allCategories },
    { id: 'instructions', label: t.harness.principles.instructions },
    { id: 'state', label: t.harness.principles.state },
    { id: 'scope', label: t.harness.principles.scope },
    { id: 'verification', label: t.harness.principles.verification },
    { id: 'lifecycle', label: t.harness.principles.sessionLifecycle },
    { id: 'observability', label: t.harness.principles.observability },
  ];

  const filteredFiles = generatedFiles.filter((f) => {
    if (activeCategory === 'all') return true;
    return f.category === activeCategory;
  });

  const handleCopyContent = () => {
    if (!selectedFile) return;
    navigator.clipboard.writeText(selectedFile.content);
    setIsCopied(true);
    notifySuccess(t.common.copied, selectedFile.path);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadManifest = () => {
    const jsonStr = exportGeneratedFilesJson();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `harness-manifest-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
    notifySuccess(t.common.success, t.workflow.generateStructure.downloadAllJsonBtn);
  };

  if (generatedFiles.length === 0) {
    return (
      <div className="text-center py-12 space-y-4 max-w-xl mx-auto">
        <h3 className="text-base font-semibold text-neutral-200">
          {t.workflow.generateStructure.title}
        </h3>
        <p className="text-neutral-400 text-xs leading-relaxed">
          {t.wizard.generatingFiles}
        </p>
        <div className="pt-2">
          <Button
            size="md"
            variant="primary"
            isLoading={isPlanning}
            onClick={() => generateHarnessPlan()}
            className="cursor-pointer bg-sky-600 hover:bg-sky-500 text-white"
          >
            {t.workflow.generateStructure.title}
          </Button>
        </div>
      </div>
    );
  }

  const lineCount = selectedFile ? selectedFile.content.split('\n').length : 0;
  const byteCount = selectedFile ? new TextEncoder().encode(selectedFile.content).length : 0;

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      {/* Step Header */}
      <div className="space-y-1">
        <div className="flex items-center gap-2 text-xs font-mono text-neutral-400">
          <span className="text-sky-400 font-semibold">{t.common.step} 06</span>
          <span aria-hidden="true">/</span>
          <span>{t.wizard.stepList[6].title}</span>
        </div>
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h2 className="text-xl font-bold text-neutral-100 sm:text-2xl">
              {t.workflow.generateStructure.title}
            </h2>
            <p className="text-xs text-neutral-400 leading-relaxed">
              {t.workflow.generateStructure.subtitle}
            </p>
          </div>
          <Button
            size="sm"
            variant="outline"
            onClick={handleDownloadManifest}
            className="cursor-pointer text-xs shrink-0"
          >
            {t.workflow.generateStructure.downloadAllJsonBtn}
          </Button>
        </div>
      </div>

      {/* Category Filter Tabs */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 border-b border-neutral-800">
        {categories.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setActiveCategory(cat.id)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-colors cursor-pointer ${
              activeCategory === cat.id
                ? 'bg-neutral-800 text-neutral-100 border border-neutral-700 shadow-sm'
                : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
            }`}
          >
            {cat.label}
          </button>
        ))}
      </div>

      {/* Two-Pane Workspace: Explorer vs File Viewer */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 min-h-[460px]">
        {/* Left Pane: Artifact Explorer */}
        <div className="lg:col-span-5 space-y-2 max-h-[560px] overflow-y-auto pr-1">
          {filteredFiles.map((file) => {
            const isSelected = selectedFile?.path === file.path;
            const fileSize = new TextEncoder().encode(file.content).length;

            return (
              <button
                key={file.path}
                type="button"
                onClick={() => setSelectedFile(file)}
                className={`w-full text-start p-3 rounded-lg border transition-all cursor-pointer ${
                  isSelected
                    ? 'bg-neutral-900 border-sky-500 shadow-md ring-1 ring-sky-500/40'
                    : 'bg-neutral-950/60 border-neutral-850 hover:border-neutral-750'
                }`}
              >
                <div className="flex items-center justify-between mb-1">
                  <span className={`font-mono text-xs font-semibold ${isSelected ? 'text-sky-300' : 'text-neutral-200'}`}>
                    {file.path}
                  </span>
                  <span className="text-[10px] font-mono text-neutral-500">
                    {fileSize} B
                  </span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-neutral-400">
                  <span className="capitalize">{file.category}</span>
                  <span className="font-mono text-[10px] text-emerald-400">✓ In-Memory</span>
                </div>
              </button>
            );
          })}
        </div>

        {/* Right Pane: File Inspector */}
        <div className="lg:col-span-7">
          <Card padding="none" className="h-full flex flex-col bg-neutral-950 border-neutral-800 overflow-hidden">
            {selectedFile ? (
              <>
                {/* File Header */}
                <div className="p-3.5 border-b border-neutral-800 bg-neutral-900/80 flex items-center justify-between gap-3">
                  <div className="space-y-0.5">
                    <span className="font-mono text-xs font-semibold text-neutral-100">
                      {selectedFile.path}
                    </span>
                    <p className="text-[11px] text-neutral-400 font-mono">
                      {byteCount} {t.workflow.generateStructure.fileStats}: {lineCount}
                    </p>
                  </div>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={handleCopyContent}
                    className="cursor-pointer text-xs"
                  >
                    {isCopied ? t.common.copied : t.workflow.generateStructure.copyContentBtn}
                  </Button>
                </div>

                {/* File Body Preview */}
                <div className="flex-1 p-4 overflow-x-auto max-h-[480px] bg-neutral-950 text-neutral-300 font-mono text-xs leading-relaxed select-text">
                  <pre className="whitespace-pre">{selectedFile.content}</pre>
                </div>
              </>
            ) : (
              <div className="flex-1 flex items-center justify-center p-12 text-neutral-500 text-xs italic">
                {t.workflow.generateStructure.noFileSelected}
              </div>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
};
