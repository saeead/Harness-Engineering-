# Harness Engineering Generator

> Engineering Harness Generator for AI Coding Agents and Multi-Session Software Development.

The Harness Engineering Generator is an architectural foundation engine designed to bridge human specifications and autonomous AI coding agents (Claude 3.7 Sonnet / Cursor / Windsurf / GitHub Copilot / Gemini Code Assist). It structures projects around durable, machine-readable repository state, progressive instruction disclosure, strict architectural invariants, and evidence-based verification.

---

## 1. Quick Start

### Prerequisites
- **Node.js**: v20.x or v22.x LTS
- **Package Manager**: npm (v10+)

### Running Locally
```bash
# 1. Install dependencies
npm install

# 2. Start development server (Port 3000)
npm run dev

# 3. Open browser at:
# http://localhost:3000
```

### Production Build
```bash
# Build Vite SPA
npm run build

# Preview build locally
npm run preview
```

---

## 2. Architecture Overview

The system strictly decouples the domain models, provider abstraction boundaries, planning heuristics, and UI presentations:

```
src/
├── domain/models/           # Core domain interfaces (Harness, Project, Export, Analysis)
├── services/
│   ├── harness/             # Topology planning, rules generation, artifact synthesis
│   ├── analysis/            # Repository scanner, gap detector, heuristic fixtures
│   ├── providers/
│   │   ├── ai/              # AI Provider Abstraction (Gemini, Local Ollama/LM Studio, Custom)
│   │   ├── repository/      # Repository Provider (GitHub REST/Git Trees API)
│   │   ├── exporter/        # Exporters (ZIP Archive, Local Filesystem Bundle)
│   │   └── storage/         # Local-first persistence adapter
│   ├── validation/          # AI Response Validator & Security Invariant Checks
│   └── observability/       # In-memory Audit Logger & Secret Scrubber
├── state/                   # React Context State Machines (Project, Providers, UI, Notifications)
├── components/
│   ├── workflow/            # 4-stage Project Intake & Planning Flow
│   ├── analysis/            # Repository Intelligence & 6-Subsystem Audit
│   ├── export/              # Destination Workspace (ZIP, Local FS, GitHub Preview & Commit)
│   ├── settings/            # Credential Vault, Engine Latency, Diagnostics
│   ├── home/                # Stage overview, recent project context, quick actions
│   └── layout/              # 3-zone Header, RTL/LTR layout wrapper, notification toasts
├── i18n/                    # Bilingual English & Persian (فارسی) translation dictionaries
└── test/                    # 6-Suite Test Matrix (Unit, Validation, Failure, Integration, etc.)
```

### The 6 Core Harness Subsystems
1. **Instructions**: Root `AGENT.md` entrypoint, progressive disclosure rules, and strict operational loop (`Inspect → Understand → Minimal Safe Edit → Verify → Update State`).
2. **State**: Machine-readable `.harness/state.json` and `.harness/features.json` tracking sprint phases, completed features, and pending tasks without conversational memory reliance.
3. **Scope**: `.harness/boundaries.json` and `docs/RULES.md` preventing speculative rewrites, enforcing zero arbitrary deletions, and establishing architectural limits.
4. **Verification**: Executable `scripts/verify.sh` test runner script and `docs/DEFINITION_OF_DONE.md` requiring evidence-based signoff before declaring tasks complete.
5. **Session Lifecycle**: `docs/SESSION_HANDOFF.md` and `scripts/init-env.sh` for deterministic multi-agent handoffs, restartability, and clean session restoration.
6. **Observability**: `docs/ARCHITECTURE.md` and runtime health invariants check keeping agents grounded in the codebase topology.

---

## 3. Configuring Providers

### AI Providers (Settings → AI Providers)
The application includes an engine-agnostic AI provider layer with 3 operational modes:
1. **Google Gemini**:
   - Uses `@google/genai` client-side SDK.
   - Automatically uses `GEMINI_API_KEY` from the environment if available, or can be configured directly in Settings.
   - Default models: `gemini-2.5-flash` for high-speed analysis and plan generation.
2. **Local AI Models (Ollama / LocalAI / LM Studio)**:
   - Zero cloud transmission. Connects directly to `http://localhost:11434` or custom endpoints.
   - Default models: `qwen2.5-coder`, `deepseek-r1`, `llama3.2`.
3. **Custom OpenAI-Compatible API**:
   - Connects to any standard REST completions endpoint with customizable models and bearer tokens.
4. **Development Safe Fallback**:
   - If no provider credentials are configured, the system gracefully falls back to deterministic heuristic generation without crashing.

### GitHub Integration (Settings → GitHub)
- Requires a GitHub Personal Access Token (classic with `repo` scope or fine-grained with Read & Write permissions for contents and metadata).
- Features:
  - Account rate-limit inspection and avatar verification.
  - Branch selection and automated feature branch creation (`harness-foundation`).
  - Change preview with 3-way conflict resolution (`Keep Existing`, `Overwrite`, `Rename with Suffix`).
  - Atomic multi-file commit via GitHub Git Trees API.

---

## 4. Privacy & Data Security

- **Local-First Architecture**: Project specifications, generated files, and state exist strictly in client-side memory and local browser storage (`localStorage`).
- **No Remote Database**: No external database is used for project files or telemetry.
- **Zero Secret Leakage**:
  - `AuditLogger` automatically scrubs tokens matching `ghp_`, `github_pat_`, `AIzaSy...`, and Bearer tokens before logging or displaying events.
  - `AIResponseValidator` prevents CWE-22 path traversal and filters out dangerous script injections in generated artifact paths.
- **One-Click Vault Purge**: Available in Settings → Stored Credentials to instantly clear all tokens, API keys, and local project drafts.

---

## 5. Development & Testing

### Running Tests
The repository includes a comprehensive 6-suite verification matrix:
```bash
# Run all unit, integration, and failure-mode tests
npm run test
```

### Type Checking & Linting
```bash
# Type check with TypeScript
npm run lint
```

---

## 6. Troubleshooting

| Issue | Cause | Solution |
|---|---|---|
| AI Analysis hangs or times out | Network blockage or invalid API key | Test connection in Settings → AI Providers; switch to Local Model or use Development Safe Mode. |
| Local Model connection fails | CORS or Ollama server not running | Ensure `OLLAMA_ORIGINS="*"` is set when running `ollama serve` locally. |
| GitHub commit rejected | Insufficient token scopes or branch protection | Verify Personal Access Token has `repo` scope, or specify an unprotected target branch in the Export dialog. |
| Persian text alignment looks inverted | Locale direction mismatch | Click the language toggle (`فارسی (FA)`) in the top bar; the applet automatically adjusts `dir="rtl"` and applies the `Vazirmatn` font. |
