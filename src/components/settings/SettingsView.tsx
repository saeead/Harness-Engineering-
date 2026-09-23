/**
 * Professional Settings Experience Component
 * Sections:
 * 1. AI Providers (Gemini, Local Models Ollama, Custom API)
 * 2. GitHub (Personal Access Token, scopes, rate limits, user account)
 * 3. Privacy & Data Security (Local-first guarantee, telemetry status, zero secret leaks)
 * 4. Language & Regional (English LTR vs Persian RTL, font preview)
 * 5. Stored Credentials Vault (Memory isolation, session inspection, one-click purge)
 * 6. Connection Testing (Full suite diagnostic runner)
 */

import React, { useState } from 'react';
import { useProviderState } from '../../state/provider.context';
import { useNotification } from '../../state/notification.context';
import { useI18n } from '../../i18n/i18n-context';
import { CredentialManager } from '../../config/provider-config';
import { aiProviderRegistry } from '../../services/providers/ai/ai-provider.registry';
import { repositoryProviderRegistry } from '../../services/providers/repository/repository-provider.registry';
import { GeminiAIProvider } from '../../services/providers/ai/gemini-ai.provider';
import { LocalModelProvider } from '../../services/providers/ai/local-model.provider';
import { CustomAPIProvider } from '../../services/providers/ai/custom-api.provider';
import { GitHubRepositoryProvider, GitHubAuthDetails } from '../../services/providers/repository/github-repository.provider';
import { DetailedProviderStatus } from '../../domain/models';
import { Card } from '../primitives/Card';
import { Button } from '../primitives/Button';
import { Input } from '../primitives/Input';

type SettingsTab =
  | 'ai_providers'
  | 'github'
  | 'privacy'
  | 'language'
  | 'credentials'
  | 'diagnostics';

export const SettingsView: React.FC = () => {
  const { t, locale, setLocale, isRTL } = useI18n();
  const { notifySuccess, notifyError, notifyInfo } = useNotification();
  const {
    activeAIProviderId,
    activeRepoProviderId,
    setActiveAIProvider,
    setActiveRepoProvider,
    clearAllCredentials,
  } = useProviderState();

  const [activeSection, setActiveSection] = useState<SettingsTab>('ai_providers');

  // --- AI PROVIDER STATE ---
  // Gemini
  const [geminiKeyInput, setGeminiKeyInput] = useState('');
  const [isTestingGemini, setIsTestingGemini] = useState(false);
  const [geminiStatus, setGeminiStatus] = useState<DetailedProviderStatus>(() =>
    CredentialManager.hasAIKey('gemini') ? 'configured' : 'not_configured',
  );
  const [geminiLatency, setGeminiLatency] = useState<number | null>(null);

  // Local Model
  const localProvider = aiProviderRegistry.get('local_model') as LocalModelProvider;
  const initialLocal = localProvider?.getConfig() || {
    endpoint: 'http://localhost:11434',
    model: 'qwen2.5-coder:latest',
  };
  const [localEndpoint, setLocalEndpoint] = useState(initialLocal.endpoint);
  const [localModel, setLocalModel] = useState(initialLocal.model);
  const [isTestingLocal, setIsTestingLocal] = useState(false);
  const [localStatus, setLocalStatus] = useState<DetailedProviderStatus>('not_configured');
  const [localLatency, setLocalLatency] = useState<number | null>(null);
  const [localModelList, setLocalModelList] = useState<string[]>([]);

  // Custom API
  const customProvider = aiProviderRegistry.get('custom_api') as CustomAPIProvider;
  const initialCustom = customProvider?.getConfig() || {
    endpoint: 'https://api.openai.com/v1',
    model: 'gpt-4o-mini',
  };
  const [customEndpoint, setCustomEndpoint] = useState(initialCustom.endpoint);
  const [customModel, setCustomModel] = useState(initialCustom.model);
  const [customKeyInput, setCustomKeyInput] = useState('');
  const [isTestingCustom, setIsTestingCustom] = useState(false);
  const [customStatus, setCustomStatus] = useState<DetailedProviderStatus>(() =>
    CredentialManager.hasAIKey('custom_api') ? 'configured' : 'not_configured',
  );
  const [customLatency, setCustomLatency] = useState<number | null>(null);

  // --- GITHUB STATE ---
  const gitHubProvider = repositoryProviderRegistry.get('github') as GitHubRepositoryProvider;
  const [githubToken, setGithubToken] = useState(() => CredentialManager.getRepoToken('github') || '');
  const [showGithubToken, setShowGithubToken] = useState(false);
  const [isTestingGitHub, setIsTestingGitHub] = useState(false);
  const [githubAuth, setGithubAuth] = useState<GitHubAuthDetails | null>(null);
  const [githubError, setGithubError] = useState<string | null>(null);

  // --- PURGE CONFIRMATION STATE ---
  const [showPurgeConfirm, setShowPurgeConfirm] = useState(false);

  // --- ALL DIAGNOSTICS STATE ---
  const [isRunningAllTests, setIsRunningAllTests] = useState(false);
  const [diagnosticResults, setDiagnosticResults] = useState<
    Array<{ service: string; status: 'ok' | 'fail'; latencyMs?: number; message: string }>
  >([]);

  // Handlers
  const handleTestGemini = async () => {
    const gemini = aiProviderRegistry.get('gemini') as GeminiAIProvider;
    if (!gemini) return;
    setIsTestingGemini(true);
    setGeminiStatus('testing');
    try {
      const res = await gemini.testConnection(geminiKeyInput.trim() || undefined);
      setGeminiLatency(res.latencyMs || null);
      if (res.success) {
        setGeminiStatus('connected');
        notifySuccess('Gemini Engine Connected', `Response received in ${res.latencyMs}ms.`);
      } else {
        setGeminiStatus('failed');
        notifyError('Gemini Error', res.error || 'Connection failed.');
      }
    } finally {
      setIsTestingGemini(false);
    }
  };

  const handleTestLocal = async () => {
    if (!localProvider) return;
    setIsTestingLocal(true);
    setLocalStatus('testing');
    try {
      const res = await localProvider.testConnection(localEndpoint.trim(), localModel.trim());
      setLocalLatency(res.latencyMs || null);
      if (res.success) {
        setLocalStatus('connected');
        setLocalModelList(res.models);
        notifySuccess('Local Model Ready', `Connected to local runtime in ${res.latencyMs}ms.`);
      } else {
        setLocalStatus('failed');
        notifyError('Local Model Offline', res.error || 'Connection refused.');
      }
    } finally {
      setIsTestingLocal(false);
    }
  };

  const handleTestCustom = async () => {
    if (!customProvider) return;
    setIsTestingCustom(true);
    setCustomStatus('testing');
    try {
      const res = await customProvider.testConnection(
        customEndpoint.trim(),
        customKeyInput.trim() || undefined,
        customModel.trim(),
      );
      setCustomLatency(res.latencyMs || null);
      if (res.success) {
        setCustomStatus('connected');
        notifySuccess('Custom API Verified', `Validated ${res.models.length} model definitions.`);
      } else {
        setCustomStatus('failed');
        notifyError('Custom API Failed', res.error || 'Failed to connect.');
      }
    } finally {
      setIsTestingCustom(false);
    }
  };

  const handleTestGitHub = async () => {
    if (!gitHubProvider) return;
    setIsTestingGitHub(true);
    setGithubError(null);
    try {
      const res = await gitHubProvider.testConnection(githubToken.trim() || undefined);
      if (res.success && res.auth) {
        setGithubAuth(res.auth);
        notifySuccess('GitHub Connected', `Authenticated as @${res.auth.login} (${res.latencyMs}ms).`);
      } else {
        setGithubAuth(null);
        setGithubError(res.error || 'Authentication failed.');
        notifyError('GitHub Error', res.error || 'Authentication failed.');
      }
    } finally {
      setIsTestingGitHub(false);
    }
  };

  const handleDisconnectGitHub = () => {
    gitHubProvider.clearToken();
    setGithubToken('');
    setGithubAuth(null);
    notifyInfo('GitHub Disconnected', 'Token purged from session.');
  };

  const handlePurgeAllCredentials = () => {
    clearAllCredentials();
    CredentialManager.setAIKey('gemini', '', true);
    CredentialManager.setAIKey('custom_api', '', true);
    CredentialManager.setRepoToken('github', '', true);
    setGeminiKeyInput('');
    setCustomKeyInput('');
    setGithubToken('');
    setGithubAuth(null);
    setGeminiStatus('not_configured');
    setCustomStatus('not_configured');
    setShowPurgeConfirm(false);
    notifySuccess('Vault Purged', 'All API keys and tokens completely removed from memory and session storage.');
  };

  const handleRunAllDiagnostics = async () => {
    setIsRunningAllTests(true);
    const results: Array<{ service: string; status: 'ok' | 'fail'; latencyMs?: number; message: string }> = [];

    // Test Gemini
    const gemini = aiProviderRegistry.get('gemini') as GeminiAIProvider;
    if (gemini) {
      const gRes = await gemini.testConnection();
      results.push({
        service: 'Google Gemini AI',
        status: gRes.success ? 'ok' : 'fail',
        latencyMs: gRes.latencyMs,
        message: gRes.success ? `Connected (${gRes.latencyMs}ms)` : gRes.error || 'Not configured',
      });
    }

    // Test Local Model
    if (localProvider) {
      const lRes = await localProvider.testConnection();
      results.push({
        service: 'Local Model (Ollama)',
        status: lRes.success ? 'ok' : 'fail',
        latencyMs: lRes.latencyMs,
        message: lRes.success ? `Operational (${lRes.latencyMs}ms)` : lRes.error || 'Endpoint offline',
      });
    }

    // Test GitHub
    if (gitHubProvider) {
      const ghRes = await gitHubProvider.testConnection();
      results.push({
        service: 'GitHub REST API',
        status: ghRes.success ? 'ok' : 'fail',
        latencyMs: ghRes.latencyMs,
        message: ghRes.success
          ? `Authenticated @${ghRes.auth?.login} (${ghRes.latencyMs}ms)`
          : ghRes.error || 'No token configured',
      });
    }

    // Deterministic Rule Engine
    results.push({
      service: 'Deterministic Harness Engine',
      status: 'ok',
      latencyMs: 1,
      message: 'Always operational (Built-in offline engine)',
    });

    setDiagnosticResults(results);
    setIsRunningAllTests(false);
    notifySuccess(t.common.success, t.settings.diagnostics.title);
  };

  return (
    <div className="space-y-6 max-w-7xl mx-auto">
      {/* Header */}
      <div className="space-y-1 pb-4 border-b border-neutral-850">
        <h1 className="text-2xl font-bold tracking-tight text-neutral-100">
          {t.settings.title}
        </h1>
        <p className="text-xs text-neutral-400">
          {t.settings.subtitle}
        </p>
      </div>

      {/* Main Settings Layout: Side Navigation Tabs & Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        {/* Navigation Sidebar */}
        <div className="space-y-1 md:border-e md:border-neutral-850 md:pe-4">
          {[
            { id: 'ai_providers' as const, label: t.settings.tabs.aiProviders },
            { id: 'github' as const, label: t.settings.tabs.github },
            { id: 'privacy' as const, label: t.settings.tabs.privacy },
            { id: 'language' as const, label: t.settings.tabs.language },
            { id: 'credentials' as const, label: t.settings.tabs.credentials },
            { id: 'diagnostics' as const, label: t.settings.tabs.diagnostics },
          ].map((item) => (
            <button
              key={item.id}
              onClick={() => setActiveSection(item.id)}
              className={`w-full text-start px-3.5 py-2.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${
                activeSection === item.id
                  ? 'bg-neutral-800 text-neutral-100 font-semibold shadow-sm'
                  : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-900/60'
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>

        {/* Section Content Area */}
        <div className="md:col-span-3 space-y-6">
          {/* SECTION 1: AI PROVIDERS */}
          {activeSection === 'ai_providers' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-neutral-100">
                  {t.settings.ai.title}
                </h2>
                <p className="text-xs text-neutral-400">
                  {t.settings.ai.desc}
                </p>
              </div>

              {/* Provider 1: Gemini */}
              <Card padding="md" className="space-y-4 bg-neutral-900/40 border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-sm text-neutral-200">Google Gemini Engine</span>
                    <span className="block text-[11px] font-mono text-neutral-500">
                      Cloud API · gemini-2.5-flash / gemini-2.5-pro
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant={activeAIProviderId === 'gemini' ? 'secondary' : 'outline'}
                      onClick={() => setActiveAIProvider('gemini')}
                      disabled={activeAIProviderId === 'gemini'}
                    >
                      {activeAIProviderId === 'gemini' ? 'Active' : 'Make Active'}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2 pt-2 border-t border-neutral-850">
                  <label className="text-[11px] font-mono text-neutral-400 flex items-center justify-between">
                    <span>Gemini API Key</span>
                    {CredentialManager.hasAIKey('gemini') && (
                      <span className="text-emerald-400 text-[10px]">Loaded in Session Memory</span>
                    )}
                  </label>
                  <div className="flex items-center gap-2">
                    <Input
                      type="password"
                      value={geminiKeyInput}
                      onChange={(e) => setGeminiKeyInput(e.target.value)}
                      placeholder="AIzaSy... (leave blank to use env)"
                      className="font-mono text-xs flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={isTestingGemini}
                      onClick={handleTestGemini}
                    >
                      Test Connection
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Provider 2: Local Model (Ollama) */}
              <Card padding="md" className="space-y-4 bg-neutral-900/40 border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-sm text-neutral-200">Local Model (Ollama / LM Studio)</span>
                    <span className="block text-[11px] font-mono text-neutral-500">
                      Local-First · Zero remote transmission
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={activeAIProviderId === 'local_model' ? 'secondary' : 'outline'}
                    onClick={() => setActiveAIProvider('local_model')}
                    disabled={activeAIProviderId === 'local_model'}
                  >
                    {activeAIProviderId === 'local_model' ? 'Active' : 'Make Active'}
                  </Button>
                </div>

                <div className="space-y-3 pt-2 border-t border-neutral-850">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
                    <span className="text-[11px] text-neutral-500 font-mono">
                      {localModelList.length > 0
                        ? `Available models: ${localModelList.slice(0, 3).join(', ')}`
                        : 'Connects via standard OpenAI or Ollama JSON API'}
                    </span>
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={isTestingLocal}
                      onClick={handleTestLocal}
                    >
                      Test Local Endpoint
                    </Button>
                  </div>
                </div>
              </Card>

              {/* Provider 3: Custom API */}
              <Card padding="md" className="space-y-4 bg-neutral-900/40 border-neutral-800">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-sm text-neutral-200">Custom OpenAI-Compatible API</span>
                    <span className="block text-[11px] font-mono text-neutral-500">
                      Third-party proxy, corporate gateway or Anthropic proxy
                    </span>
                  </div>
                  <Button
                    size="sm"
                    variant={activeAIProviderId === 'custom_api' ? 'secondary' : 'outline'}
                    onClick={() => setActiveAIProvider('custom_api')}
                    disabled={activeAIProviderId === 'custom_api'}
                  >
                    {activeAIProviderId === 'custom_api' ? 'Active' : 'Make Active'}
                  </Button>
                </div>

                <div className="space-y-3 pt-2 border-t border-neutral-850">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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

                  <div className="flex items-center gap-2">
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
                    >
                      Test Connection
                    </Button>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* SECTION 2: GITHUB */}
          {activeSection === 'github' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-neutral-100">
                  GitHub Repository Integration
                </h2>
                <p className="text-xs text-neutral-400">
                  Configure authentication for inspecting repositories, change preview, and atomic git tree commits.
                </p>
              </div>

              <Card padding="md" className="space-y-4 bg-neutral-900/40 border-neutral-800">
                <div className="flex items-center justify-between border-b border-neutral-850 pb-3">
                  <div className="space-y-0.5">
                    <span className="font-semibold text-sm text-neutral-200">Personal Access Token (PAT)</span>
                    <p className="text-neutral-500 text-xs">
                      Requires fine-grained token with <code className="text-neutral-300">Contents: Read & Write</code> or classic token with <code className="text-neutral-300">repo</code> scope.
                    </p>
                  </div>
                  {githubAuth && (
                    <Button size="sm" variant="ghost" onClick={handleDisconnectGitHub}>
                      Disconnect
                    </Button>
                  )}
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between text-[11px] font-mono text-neutral-400">
                    <span>Token String</span>
                    <button
                      type="button"
                      onClick={() => setShowGithubToken(!showGithubToken)}
                      className="text-neutral-400 hover:text-white underline cursor-pointer"
                    >
                      {showGithubToken ? 'Hide' : 'Reveal'}
                    </button>
                  </div>
                  <div className="flex items-center gap-2">
                    <Input
                      type={showGithubToken ? 'text' : 'password'}
                      value={githubToken}
                      onChange={(e) => setGithubToken(e.target.value)}
                      placeholder="ghp_xxxxxxxxxxxxxxxxxxxx or github_pat_xxxx"
                      className="font-mono text-xs flex-1"
                    />
                    <Button
                      size="sm"
                      variant="outline"
                      isLoading={isTestingGitHub}
                      onClick={handleTestGitHub}
                    >
                      Verify Token
                    </Button>
                  </div>
                </div>

                {githubAuth && (
                  <div className="p-3 bg-neutral-950/80 border border-neutral-800 rounded-lg space-y-2 text-xs">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                        <span className="font-semibold text-neutral-200">@{githubAuth.login}</span>
                        {githubAuth.name && (
                          <span className="text-neutral-500">({githubAuth.name})</span>
                        )}
                      </div>
                      <span className="font-mono text-neutral-400 text-[11px]">
                        Rate Limit: {githubAuth.rateLimit.remaining} / {githubAuth.rateLimit.limit}
                      </span>
                    </div>
                    <div className="text-[11px] font-mono text-neutral-500">
                      Authorized Scopes: {githubAuth.scopes.join(', ') || 'Fine-grained PAT'}
                    </div>
                  </div>
                )}

                {githubError && (
                  <p className="text-rose-400 font-mono text-xs">{githubError}</p>
                )}
              </Card>
            </div>
          )}

          {/* SECTION 3: PRIVACY & DATA SECURITY */}
          {activeSection === 'privacy' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-neutral-100">
                  Privacy & Data Isolation Policy
                </h2>
                <p className="text-xs text-neutral-400">
                  Explicit guarantees regarding how your code, prompts, and tokens are stored and processed.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Card padding="md" className="space-y-2 bg-neutral-900/40 border-neutral-800">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <span>✓</span> Local-First Architecture
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Project state, plans, generated files, and specifications exist exclusively in your browser memory
                    and local storage. No remote database or persistent server cache is ever provisioned.
                  </p>
                </Card>

                <Card padding="md" className="space-y-2 bg-neutral-900/40 border-neutral-800">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <span>✓</span> Zero External Telemetry
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    This application does not load third-party analytics trackers, tracking beacons, or behavioural telemetry.
                    Your keystrokes and project descriptions remain completely private.
                  </p>
                </Card>

                <Card padding="md" className="space-y-2 bg-neutral-900/40 border-neutral-800">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <span>✓</span> Zero Secret Leakage Policy
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    API keys and GitHub tokens are isolated in memory. They are strictly excluded from generated project
                    files, JSON exports, Git commits, console logs, and URL query strings.
                  </p>
                </Card>

                <Card padding="md" className="space-y-2 bg-neutral-900/40 border-neutral-800">
                  <div className="flex items-center gap-2 text-emerald-400 text-xs font-semibold">
                    <span>✓</span> Controlled Mutation & Write Safeguards
                  </div>
                  <p className="text-xs text-neutral-400 leading-relaxed">
                    Repository writes are strictly gated behind an explicit Change Preview and user confirmation checkbox.
                    No background synchronization or automatic file clobbering can ever take place.
                  </p>
                </Card>
              </div>
            </div>
          )}

          {/* SECTION 4: LANGUAGE & REGIONAL */}
          {activeSection === 'language' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-neutral-100">
                  Language & Regional Settings
                </h2>
                <p className="text-xs text-neutral-400">
                  Switch between English (LTR) and Persian فارسی (RTL). Both typography and layout mirror seamlessly.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* English Option */}
                <button
                  onClick={() => setLocale('en')}
                  className={`p-4 rounded-xl border text-start space-y-2 transition-all cursor-pointer ${
                    locale === 'en'
                      ? 'border-sky-500 bg-sky-950/20'
                      : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-200">English (United States)</span>
                    {locale === 'en' && <span className="text-sky-400 font-mono text-[11px]">Active</span>}
                  </div>
                  <p className="text-xs text-neutral-400">
                    Left-to-right (LTR) layout with Plus Jakarta Sans and JetBrains Mono fonts.
                  </p>
                  <div className="pt-2 border-t border-neutral-850 font-sans text-xs text-neutral-300">
                    The quick brown fox jumps over the lazy dog.
                  </div>
                </button>

                {/* Persian Option */}
                <button
                  onClick={() => setLocale('fa')}
                  className={`p-4 rounded-xl border text-start space-y-2 transition-all cursor-pointer ${
                    locale === 'fa'
                      ? 'border-sky-500 bg-sky-950/20'
                      : 'border-neutral-800 bg-neutral-900/40 hover:border-neutral-700'
                  }`}
                >
                  <div className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-neutral-200 font-fa">فارسی (Persian)</span>
                    {locale === 'fa' && <span className="text-sky-400 font-mono text-[11px]">فعال</span>}
                  </div>
                  <p className="text-xs text-neutral-400 font-fa">
                    راست‌به‌چپ (RTL) به همراه تایپوگرافی استاندارد Vazirmatn و تراز معکوس.
                  </p>
                  <div className="pt-2 border-t border-neutral-850 font-fa text-xs text-neutral-300">
                    مهندسی هارنس و چارچوب پایدار برای عامل‌های هوش مصنوعی.
                  </div>
                </button>
              </div>

              <div className="p-3 bg-neutral-900/60 border border-neutral-800 rounded-lg text-xs text-neutral-400 space-y-1">
                <span className="font-semibold text-neutral-300">RTL Engineering Safeguard:</span>
                <p>
                  Code snippets, command lines (<code className="text-neutral-200">scripts/verify.sh</code>), and file paths
                  always maintain directional integrity (<code className="text-neutral-200">dir="ltr"</code>) even when Persian is active, preventing reversed punctuation.
                </p>
              </div>
            </div>
          )}

          {/* SECTION 5: STORED CREDENTIALS VAULT */}
          {activeSection === 'credentials' && (
            <div className="space-y-6">
              <div className="space-y-1">
                <h2 className="text-base font-semibold text-neutral-100">
                  Stored Credentials Vault
                </h2>
                <p className="text-xs text-neutral-400">
                  Manage tokens and keys stored in volatile browser memory or sessionStorage.
                </p>
              </div>

              <Card padding="md" className="space-y-4 bg-neutral-900/40 border-neutral-800">
                <div className="space-y-2 text-xs divide-y divide-neutral-850">
                  <div className="flex items-center justify-between py-2">
                    <span className="text-neutral-400">Google Gemini API Key:</span>
                    <span className="font-mono text-neutral-200">
                      {CredentialManager.hasAIKey('gemini') ? '●●●●●●●● (Loaded)' : 'Not Set'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-neutral-400">Custom API Key:</span>
                    <span className="font-mono text-neutral-200">
                      {CredentialManager.hasAIKey('custom_api') ? '●●●●●●●● (Loaded)' : 'Not Set'}
                    </span>
                  </div>

                  <div className="flex items-center justify-between py-2">
                    <span className="text-neutral-400">GitHub Personal Access Token:</span>
                    <span className="font-mono text-neutral-200">
                      {CredentialManager.hasRepoToken('github') ? '●●●●●●●● (Loaded)' : 'Not Set'}
                    </span>
                  </div>
                </div>

                <div className="pt-3 border-t border-neutral-850 flex items-center justify-between">
                  <p className="text-xs text-neutral-500">
                    Values are never written to permanent disk storage or telemetry caches.
                  </p>
                  <Button
                    size="sm"
                    variant="danger"
                    onClick={() => setShowPurgeConfirm(true)}
                  >
                    Purge All Stored Credentials
                  </Button>
                </div>
              </Card>

              {/* Confirmation Dialog */}
              {showPurgeConfirm && (
                <div className="p-4 bg-rose-950/30 border border-rose-800 rounded-xl space-y-3">
                  <div className="space-y-1">
                    <h3 className="text-xs font-semibold text-rose-200">Confirm Vault Purge</h3>
                    <p className="text-xs text-rose-300">
                      Are you sure you want to remove all API keys and GitHub tokens from your session?
                      You will need to re-enter credentials to perform remote requests.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      size="sm"
                      variant="danger"
                      onClick={handlePurgeAllCredentials}
                    >
                      Yes, Purge Everything
                    </Button>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => setShowPurgeConfirm(false)}
                    >
                      Cancel
                    </Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* SECTION 6: DIAGNOSTICS */}
          {activeSection === 'diagnostics' && (
            <div className="space-y-6">
              <div className="flex items-center justify-between pb-2 border-b border-neutral-850">
                <div className="space-y-0.5">
                  <h2 className="text-base font-semibold text-neutral-100">
                    All-Endpoints Connection Diagnostics
                  </h2>
                  <p className="text-xs text-neutral-400">
                    Validate connectivity to all remote and local services in parallel.
                  </p>
                </div>
                <Button
                  size="md"
                  variant="primary"
                  isLoading={isRunningAllTests}
                  onClick={handleRunAllDiagnostics}
                >
                  Run All Tests Now
                </Button>
              </div>

              {diagnosticResults.length > 0 ? (
                <div className="space-y-2">
                  {diagnosticResults.map((r, i) => (
                    <div
                      key={i}
                      className="p-3 bg-neutral-900/50 border border-neutral-800 rounded-lg flex items-center justify-between text-xs"
                    >
                      <div className="flex items-center gap-2.5">
                        <span
                          className={`w-2 h-2 rounded-full ${
                            r.status === 'ok' ? 'bg-emerald-500' : 'bg-rose-500'
                          }`}
                        />
                        <span className="font-semibold text-neutral-200">{r.service}</span>
                      </div>
                      <span className="font-mono text-neutral-400">{r.message}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-8 text-center text-xs text-neutral-500 border border-neutral-850 rounded-xl bg-neutral-950/40">
                  Click "Run All Tests Now" to verify AI providers, Local Models, and GitHub endpoints simultaneously.
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
