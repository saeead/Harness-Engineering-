/**
 * Providers Explorer & Configuration Component
 * Complete configuration, live connection testing, and status monitoring for:
 * 1. AI Providers (Google Gemini, Local Model Ollama, Custom OpenAI-Compatible, Deterministic)
 * 2. Repository Providers (GitHub integration)
 * 3. Exporters (ZIP, Local Directory, JSON)
 * Enforces strict zero-secret leakage across UI, logs, and state.
 */

import React, { useState } from 'react';
import { useProviderState } from '../../state/provider.context';
import { useNotification } from '../../state/notification.context';
import { CredentialManager } from '../../config/provider-config';
import { aiProviderRegistry } from '../../services/providers/ai/ai-provider.registry';
import { repositoryProviderRegistry } from '../../services/providers/repository/repository-provider.registry';
import { GeminiAIProvider } from '../../services/providers/ai/gemini-ai.provider';
import { LocalModelProvider } from '../../services/providers/ai/local-model.provider';
import { CustomAPIProvider } from '../../services/providers/ai/custom-api.provider';
import { GitHubRepositoryProvider } from '../../services/providers/repository/github-repository.provider';
import { DetailedProviderStatus } from '../../domain/models';
import { Card } from '../primitives/Card';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';
import { useI18n } from '../../i18n/i18n-context';

export const ProvidersExplorer: React.FC = () => {
  const { t } = useI18n();
  const {
    availableAIProviders,
    availableRepoProviders,
    activeAIProviderId,
    activeRepoProviderId,
    setActiveAIProvider,
    setActiveRepoProvider,
    clearAllCredentials,
  } = useProviderState();

  const { notifySuccess, notifyError, notifyInfo } = useNotification();

  // Selected provider to configure
  const [configProviderId, setConfigProviderId] = useState<string | null>(null);

  // Gemini state
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<DetailedProviderStatus>(() =>
    CredentialManager.hasAIKey('gemini') ? 'configured' : 'not_configured',
  );
  const [geminiLatency, setGeminiLatency] = useState<number | undefined>(undefined);

  // Local Model state
  const localProvider = aiProviderRegistry.get('local_model') as LocalModelProvider;
  const initialLocalConfig = localProvider?.getConfig() || {
    endpoint: 'http://localhost:11434',
    model: 'qwen2.5-coder:latest',
  };
  const [localEndpoint, setLocalEndpoint] = useState(initialLocalConfig.endpoint);
  const [localModel, setLocalModel] = useState(initialLocalConfig.model);
  const [isTestingLocal, setIsTestingLocal] = useState(false);
  const [localStatus, setLocalStatus] = useState<DetailedProviderStatus>(
    () => localProvider?.getInfo().detailedStatus || 'not_configured',
  );
  const [localLatency, setLocalLatency] = useState<number | undefined>(undefined);
  const [detectedLocalModels, setDetectedLocalModels] = useState<string[]>([]);

  // Custom API state
  const customProvider = aiProviderRegistry.get('custom_api') as CustomAPIProvider;
  const initialCustomConfig = customProvider?.getConfig() || {
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  };
  const [customEndpoint, setCustomEndpoint] = useState(initialCustomConfig.endpoint);
  const [customModel, setCustomModel] = useState(initialCustomConfig.model);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [isTestingCustom, setIsTestingCustom] = useState(false);
  const [customStatus, setCustomStatus] = useState<DetailedProviderStatus>(() =>
    CredentialManager.hasAIKey('custom_api') ? 'configured' : 'not_configured',
  );
  const [customLatency, setCustomLatency] = useState<number | undefined>(undefined);

  // GitHub state
  const gitHubProvider = repositoryProviderRegistry.get('github') as GitHubRepositoryProvider;
  const [githubTokenInput, setGithubTokenInput] = useState('');
  const [isTestingGitHub, setIsTestingGitHub] = useState(false);
  const [githubStatus, setGithubStatus] = useState<DetailedProviderStatus>(() =>
    CredentialManager.hasRepoToken('github') ? 'configured' : 'not_configured',
  );
  const [githubUser, setGithubUser] = useState<string | null>(null);
  const [githubLatency, setGithubLatency] = useState<number | undefined>(undefined);

  // Status badge helper mapping the 6 required states:
  // Not Configured | Configured | Testing | Connected | Failed | Disabled
  const renderStatusBadge = (status: DetailedProviderStatus, latency?: number) => {
    const configMap: Record<
      DetailedProviderStatus,
      { label: string; bg: string; text: string; dot: string }
    > = {
      not_configured: {
        label: 'Not Configured',
        bg: 'bg-neutral-800/80',
        text: 'text-neutral-400',
        dot: 'bg-neutral-500',
      },
      configured: {
        label: 'Configured',
        bg: 'bg-sky-950/60',
        text: 'text-sky-300',
        dot: 'bg-sky-400',
      },
      testing: {
        label: 'Testing...',
        bg: 'bg-amber-950/60',
        text: 'text-amber-300',
        dot: 'bg-amber-400 animate-ping',
      },
      connected: {
        label: latency ? `Connected (${latency}ms)` : 'Connected',
        bg: 'bg-emerald-950/60',
        text: 'text-emerald-300',
        dot: 'bg-emerald-400',
      },
      failed: {
        label: 'Failed',
        bg: 'bg-rose-950/60',
        text: 'text-rose-300',
        dot: 'bg-rose-500',
      },
      disabled: {
        label: 'Disabled',
        bg: 'bg-neutral-900',
        text: 'text-neutral-500',
        dot: 'bg-neutral-600',
      },
    };

    const cfg = configMap[status] || configMap.not_configured;

    return (
      <span
        className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-mono font-medium ${cfg.bg} ${cfg.text} border border-neutral-800`}
      >
        <span className={`w-1.5 h-1.5 rounded-full ${cfg.dot}`} />
        <span>{cfg.label}</span>
      </span>
    );
  };

  // Test handlers
  const handleTestGemini = async () => {
    const gemini = aiProviderRegistry.get('gemini') as GeminiAIProvider;
    if (!gemini) return;

    setIsTestingGemini(true);
    setGeminiStatus('testing');

    const res = await gemini.testConnection(geminiKeyInput.trim() || undefined);
    setIsTestingGemini(false);
    setGeminiLatency(res.latencyMs);

    if (res.success) {
      setGeminiStatus('connected');
      notifySuccess('Gemini Connected', `Live validation succeeded in ${res.latencyMs}ms.`);
    } else {
      setGeminiStatus('failed');
      notifyError('Gemini Error', res.error || 'Connection failed.');
    }
  };

  const handleTestLocal = async () => {
    if (!localProvider) return;
    setIsTestingLocal(true);
    setLocalStatus('testing');

    const res = await localProvider.testConnection(localEndpoint.trim(), localModel.trim());
    setIsTestingLocal(false);
    setLocalLatency(res.latencyMs);

    if (res.success) {
      setLocalStatus('connected');
      setDetectedLocalModels(res.models);
      notifySuccess('Local Model Connected', `Connected to ${localEndpoint} in ${res.latencyMs}ms.`);
    } else {
      setLocalStatus('failed');
      notifyError('Local Model Offline', res.error || 'Connection refused.');
    }
  };

  const handleTestCustom = async () => {
    if (!customProvider) return;
    setIsTestingCustom(true);
    setCustomStatus('testing');

    const res = await customProvider.testConnection(
      customEndpoint.trim(),
      customKeyInput.trim() || undefined,
      customModel.trim(),
    );
    setIsTestingCustom(false);
    setCustomLatency(res.latencyMs);

    if (res.success) {
      setCustomStatus('connected');
      notifySuccess('Custom API Connected', `Verified ${res.models.length} models in ${res.latencyMs}ms.`);
    } else {
      setCustomStatus('failed');
      notifyError('Custom API Failed', res.error || 'Failed to authenticate.');
    }
  };

  const handleTestGitHub = async () => {
    if (!gitHubProvider) return;
    setIsTestingGitHub(true);
    setGithubStatus('testing');

    const res = await gitHubProvider.testConnection(githubTokenInput.trim() || undefined);
    setIsTestingGitHub(false);
    setGithubLatency(res.latencyMs);

    if (res.success && res.auth) {
      setGithubStatus('connected');
      setGithubUser(res.auth.login);
      notifySuccess('GitHub Connected', `Logged in as @${res.auth.login} (${res.latencyMs}ms).`);
    } else {
      setGithubStatus('failed');
      notifyError('GitHub Error', res.error || 'Bad credentials.');
    }
  };

  const handlePurgeAllSecrets = () => {
    clearAllCredentials();
    CredentialManager.setAIKey('gemini', '', true);
    CredentialManager.setAIKey('custom_api', '', true);
    CredentialManager.setRepoToken('github', '', true);
    setGeminiKeyInput('');
    setCustomKeyInput('');
    setGithubTokenInput('');
    setGeminiStatus('not_configured');
    setCustomStatus('not_configured');
    setGithubStatus('not_configured');
    setGithubUser(null);
    notifyInfo('Vault Purged', 'All API keys, GitHub tokens, and transient session credentials purged.');
  };

  return (
    <div className="space-y-8">
      {/* Overview & Security Badge */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-neutral-100">
            {t.navigation.providerStatus}
          </h2>
          <p className="text-sm text-neutral-400">
            Pluggable AI provider engines and repository destinations with zero secret leakage.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button size="sm" variant="danger" onClick={handlePurgeAllSecrets}>
            Purge All Stored Secrets
          </Button>
        </div>
      </div>

      {/* AI PROVIDERS SECTION */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200">
            AI Provider Engines (API-Based & Local Models)
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            Active Generation Engine: <strong className="text-sky-400">{activeAIProviderId}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Card 1: Google Gemini */}
          <Card padding="md" className="space-y-4 bg-neutral-900/60 border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-semibold text-neutral-100 text-sm">Google Gemini Engine</span>
                <span className="block text-[11px] font-mono text-neutral-400">Remote API · Gemini 2.5 / Flash</span>
              </div>
              {renderStatusBadge(geminiStatus, geminiLatency)}
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed min-h-[36px]">
              Intelligent ambiguity analysis, structured clarification synthesis, and schema planning via Gemini API.
            </p>

            <div className="space-y-2 pt-2 border-t border-neutral-800/80">
              <label className="text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                <span>API Key (Client-masked)</span>
                {CredentialManager.hasAIKey('gemini') && (
                  <span className="text-emerald-400 text-[10px]">Saved in Session</span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  value={geminiKeyInput}
                  onChange={(e) => setGeminiKeyInput(e.target.value)}
                  placeholder="AIzaSy..."
                  className="font-mono text-xs flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={isTestingGemini}
                  onClick={handleTestGemini}
                  className="cursor-pointer shrink-0"
                >
                  Test Connection
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                size="sm"
                variant={activeAIProviderId === 'gemini' ? 'secondary' : 'outline'}
                onClick={() => setActiveAIProvider('gemini')}
                disabled={activeAIProviderId === 'gemini'}
              >
                {activeAIProviderId === 'gemini' ? 'Active Engine' : 'Use Gemini Engine'}
              </Button>
            </div>
          </Card>

          {/* Card 2: Local Model (Ollama / LocalAI / LM Studio) */}
          <Card padding="md" className="space-y-4 bg-neutral-900/60 border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-semibold text-neutral-100 text-sm">Local Model (Ollama / LM Studio)</span>
                <span className="block text-[11px] font-mono text-neutral-400">Local-first · Zero Egress</span>
              </div>
              {renderStatusBadge(localStatus, localLatency)}
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed min-h-[36px]">
              Runs inference locally via Ollama or LM Studio. No project data or specifications ever leave your machine.
            </p>

            <div className="space-y-2 pt-2 border-t border-neutral-800/80">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-neutral-400">Endpoint URL</label>
                  <Input
                    value={localEndpoint}
                    onChange={(e) => setLocalEndpoint(e.target.value)}
                    placeholder="http://localhost:11434"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-neutral-400">Model Name</label>
                  <Input
                    value={localModel}
                    onChange={(e) => setLocalModel(e.target.value)}
                    placeholder="qwen2.5-coder:latest"
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-[10px] text-neutral-500 font-mono">
                  {detectedLocalModels.length > 0
                    ? `${detectedLocalModels.length} models detected`
                    : 'Requires running local runner'}
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={isTestingLocal}
                  onClick={handleTestLocal}
                  className="cursor-pointer"
                >
                  Test Connection
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                size="sm"
                variant={activeAIProviderId === 'local_model' ? 'secondary' : 'outline'}
                onClick={() => setActiveAIProvider('local_model')}
                disabled={activeAIProviderId === 'local_model'}
              >
                {activeAIProviderId === 'local_model' ? 'Active Engine' : 'Use Local Model'}
              </Button>
            </div>
          </Card>

          {/* Card 3: Custom API / OpenAI-Compatible */}
          <Card padding="md" className="space-y-4 bg-neutral-900/60 border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-semibold text-neutral-100 text-sm">Custom API / OpenAI-Compatible</span>
                <span className="block text-[11px] font-mono text-neutral-400">Generic Gateway / Proxy</span>
              </div>
              {renderStatusBadge(customStatus, customLatency)}
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed min-h-[36px]">
              Connect to any OpenAI-compatible proxy, enterprise LLM gateway, or Anthropic/Claude proxy endpoint.
            </p>

            <div className="space-y-2 pt-2 border-t border-neutral-800/80">
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-neutral-400">Base URL</label>
                  <Input
                    value={customEndpoint}
                    onChange={(e) => setCustomEndpoint(e.target.value)}
                    placeholder="https://api.openai.com/v1"
                    className="font-mono text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-mono text-neutral-400">Model Name</label>
                  <Input
                    value={customModel}
                    onChange={(e) => setCustomModel(e.target.value)}
                    placeholder="gpt-4o-mini"
                    className="font-mono text-xs"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-1">
                <Input
                  type="password"
                  value={customKeyInput}
                  onChange={(e) => setCustomKeyInput(e.target.value)}
                  placeholder="Bearer API Key (sk-...)"
                  className="font-mono text-xs flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={isTestingCustom}
                  onClick={handleTestCustom}
                  className="cursor-pointer shrink-0"
                >
                  Test Connection
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                size="sm"
                variant={activeAIProviderId === 'custom_api' ? 'secondary' : 'outline'}
                onClick={() => setActiveAIProvider('custom_api')}
                disabled={activeAIProviderId === 'custom_api'}
              >
                {activeAIProviderId === 'custom_api' ? 'Active Engine' : 'Use Custom API'}
              </Button>
            </div>
          </Card>

          {/* Card 4: Deterministic Analysis Provider (Offline Default) */}
          <Card padding="md" className="space-y-4 bg-neutral-900/60 border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-semibold text-neutral-100 text-sm">Deterministic Heuristic Engine</span>
                <span className="block text-[11px] font-mono text-neutral-400">Built-in · Zero Config Required</span>
              </div>
              {renderStatusBadge('connected')}
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed min-h-[36px]">
              Offline rule engine providing deterministic ambiguity checks, harness level scoring, and invariant validation.
            </p>

            <div className="pt-2 border-t border-neutral-800/80 space-y-1 text-xs text-neutral-400">
              <div className="flex justify-between">
                <span>Requires Auth:</span>
                <span className="font-mono text-neutral-200">No</span>
              </div>
              <div className="flex justify-between">
                <span>Always Operational:</span>
                <span className="font-mono text-emerald-400">Yes</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                size="sm"
                variant={activeAIProviderId === 'mock_harness_engine' ? 'secondary' : 'outline'}
                onClick={() => setActiveAIProvider('mock_harness_engine')}
                disabled={activeAIProviderId === 'mock_harness_engine'}
              >
                {activeAIProviderId === 'mock_harness_engine' ? 'Active Engine' : 'Use Deterministic Engine'}
              </Button>
            </div>
          </Card>
        </div>
      </div>

      {/* REPOSITORY & DESTINATION INTEGRATIONS */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-semibold text-neutral-200">
            Repository & Codebase Destinations
          </h3>
          <span className="text-xs text-neutral-400 font-mono">
            Active Target: <strong className="text-emerald-400">{activeRepoProviderId}</strong>
          </span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* GitHub Integration */}
          <Card padding="md" className="space-y-4 bg-neutral-900/60 border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-semibold text-neutral-100 text-sm">GitHub Repository Integration</span>
                <span className="block text-[11px] font-mono text-neutral-400">
                  {githubUser ? `@${githubUser}` : 'REST Git Trees API'}
                </span>
              </div>
              {renderStatusBadge(githubStatus, githubLatency)}
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed min-h-[36px]">
              Direct commit and branch push with atomic Git tree generation, change preview, and explicit conflict resolution.
            </p>

            <div className="space-y-2 pt-2 border-t border-neutral-800/80">
              <label className="text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                <span>Personal Access Token (PAT)</span>
                {CredentialManager.hasRepoToken('github') && (
                  <span className="text-emerald-400 text-[10px]">Saved in Session</span>
                )}
              </label>
              <div className="flex items-center gap-2">
                <Input
                  type="password"
                  value={githubTokenInput}
                  onChange={(e) => setGithubTokenInput(e.target.value)}
                  placeholder="ghp_xxxxxxxxxxxxxxxxxxxx"
                  className="font-mono text-xs flex-1"
                />
                <Button
                  size="sm"
                  variant="outline"
                  isLoading={isTestingGitHub}
                  onClick={handleTestGitHub}
                  className="cursor-pointer shrink-0"
                >
                  Test Connection
                </Button>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                size="sm"
                variant={activeRepoProviderId === 'github' ? 'secondary' : 'outline'}
                onClick={() => setActiveRepoProvider('github')}
                disabled={activeRepoProviderId === 'github'}
              >
                {activeRepoProviderId === 'github' ? 'Active Target' : 'Select Target'}
              </Button>
            </div>
          </Card>

          {/* Local Filesystem / ZIP Exporter */}
          <Card padding="md" className="space-y-4 bg-neutral-900/60 border-neutral-800">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <span className="font-semibold text-neutral-100 text-sm">Local Filesystem & ZIP Exporters</span>
                <span className="block text-[11px] font-mono text-neutral-400">Browser Native · No Auth Required</span>
              </div>
              {renderStatusBadge('connected')}
            </div>

            <p className="text-xs text-neutral-400 leading-relaxed min-h-[36px]">
              Direct folder export via File System Access API or uncompressed/compressed ZIP archive download.
            </p>

            <div className="pt-2 border-t border-neutral-800/80 space-y-1 text-xs text-neutral-400">
              <div className="flex justify-between">
                <span>ZIP Archive (.zip):</span>
                <span className="font-mono text-emerald-400">Supported (JSZip)</span>
              </div>
              <div className="flex justify-between">
                <span>File System Access:</span>
                <span className="font-mono text-neutral-200">Native Browser Prompt</span>
              </div>
            </div>

            <div className="flex items-center justify-between pt-2">
              <Button
                size="sm"
                variant={activeRepoProviderId === 'local_fs' ? 'secondary' : 'outline'}
                onClick={() => setActiveRepoProvider('local_fs')}
                disabled={activeRepoProviderId === 'local_fs'}
              >
                {activeRepoProviderId === 'local_fs' ? 'Active Target' : 'Select Target'}
              </Button>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
};
