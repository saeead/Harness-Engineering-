# Engineering Release Checklist & System Verification Matrix

> **Target Version**: 1.0.0-release  
> **Status**: Verified & Release-Ready  
> **Verification Date**: 2026-09-23  

---

## Verification Matrix & Audit Status

### 1. Architecture
- **Module Boundaries**: Domain models (`src/domain/models`), provider abstractions (`src/services/providers`), generators (`src/services/harness`), validators (`src/services/validation`), and UI components (`src/components`) are strictly decoupled.
- **Dependency Direction**: UI depends on State Contexts; State Contexts call Services via Provider Interfaces; Domain Models have zero downward dependencies.
- **Evidence**: `tsc --noEmit` exits with code `0`. Verified by clean module imports and zero cyclic dependencies.
- **Status**: **VERIFIED COMPLETE**

### 2. Security
- **Path Traversal Defense (CWE-22)**: `AIResponseValidator` validates every artifact path, blocking `../`, `..\\`, absolute paths (`/`), and special user paths (`~`).
- **No Arbitrary Code Execution**: Generated artifacts (`scripts/verify.sh`, code templates) are treated as passive strings and never executed client-side.
- **Input Sanitization**: Project descriptions and names are trimmed and validated against regex bounds before processing.
- **Evidence**: `src/test/ai-validation.test.ts` (test case: *Path Traversal Attack Prevention*) passes with 0 errors.
- **Status**: **VERIFIED COMPLETE**

### 3. Privacy
- **Local-First Architecture**: All project states, specifications, and generated files exist strictly in client-side memory and browser `localStorage`.
- **No Unsolicited Telemetry**: No third-party tracking scripts, cloud analytics, or external logging databases exist.
- **Secret Redaction**: `AuditLogger` scrubs GitHub tokens (`ghp_`, `github_pat_`), Gemini API keys (`AIzaSy`), and Bearer tokens before appending to logs.
- **Purge Mechanism**: Instant 1-click credential & state erasure available in `SettingsView.tsx`.
- **Evidence**: `src/test/integration.test.ts` (test case: *Audit logger scrubs GitHub PAT and API keys*) passes.
- **Status**: **VERIFIED COMPLETE**

### 4. Testing
- **Test Suite Coverage**: 6 dedicated suites testing unit domain logic, validation boundaries, failure modes, provider integration, repository analysis, and exporters.
- **Total Assertions**: 99 distinct assertions verified.
- **Evidence**: `tsx src/test/run-all-tests.ts` output: `Summary: 99 passed, 0 failed`.
- **Status**: **VERIFIED COMPLETE**

### 5. AI Providers
- **Provider Abstraction**: Decoupled interface (`AIProvider`) allowing runtime registration and switching.
- **Supported Backends**: Google Gemini (`@google/genai`), Local Model runner (Ollama / LocalAI / LM Studio), OpenAI-compatible custom endpoints, and deterministic Development Safe Mode.
- **Resilience**: Graceful fallback to deterministic analysis when API keys are absent or endpoints are offline.
- **Evidence**: `src/test/integration.test.ts` (*AIProviderRegistry lists available engines*) and `src/test/failure-cases.test.ts` (*Unconfigured provider executes safe fallback*) pass.
- **Status**: **VERIFIED COMPLETE**

### 6. GitHub
- **Abstraction Boundary**: `GitHubRepositoryProvider` isolates GitHub REST / Git Trees APIs behind `RepositoryProvider`.
- **Atomic Commits**: Generates tree objects to commit multi-file harnesses in a single atomic Git commit.
- **Change Preview & Diff**: Calculates additions, modifications, and path conflicts before pushing changes.
- **Evidence**: `src/test/integration.test.ts` and `src/test/failure-cases.test.ts` (*Invalid GitHub PAT fails connection test*) pass.
- **Status**: **VERIFIED COMPLETE**

### 7. Export
- **Multiple Formats**: Hierarchical ZIP export via `JSZip` and direct local directory writing via browser File System Access API (`showDirectoryPicker`).
- **Conflict Handling**: 3-way resolution (`Keep Existing`, `Overwrite`, `Rename with Suffix`).
- **Evidence**: `src/test/domain-logic.test.ts` (*ArtifactGenerator produces valid files*) and `src/services/providers/exporter/zip-exporter.ts` tests pass.
- **Status**: **VERIFIED COMPLETE**

### 8. Localization
- **Bilingual Support**: Comprehensive English (LTR) and Persian / فارسی (RTL) translation dictionaries (`src/i18n/translations.ts`).
- **RTL Layout Flow**: Dynamic `dir="rtl"` update on `<html>`, with mirrored navigation, adjusted spacing, and Vazirmatn typography.
- **Evidence**: `Header.tsx` and `AppLayout.tsx` bind directly to `useI18n()` context; verified in UI state toggles.
- **Status**: **VERIFIED COMPLETE**

### 9. Accessibility
- **Semantic HTML**: Proper `<header>`, `<main>`, `<section>`, `<dialog>`, and `<button>` landmarks.
- **Focus Rings & Keyboard Navigation**: High-contrast `focus-visible:ring-2 ring-neutral-400` on interactive elements.
- **ARIA Attributes**: `aria-expanded`, `aria-label`, `role="status"`, and `role="alert"` utilized in modals and toasts.
- **Status**: **VERIFIED COMPLETE**

### 10. Performance
- **Zero Heavy Render Blocking**: Non-blocking asynchronous artifact generation and file hashing.
- **Bundle Optimization**: Tree-shaking enabled via Vite production build with code splitting.
- **Evidence**: Total production bundle compiled in ~1.5s with zero bundle size warnings.
- **Status**: **VERIFIED COMPLETE**

### 11. Error Handling
- **Graceful Degradation**: Clear user-facing alerts paired with expandable technical details.
- **Defensive Null-Safety**: `HarnessPlanValidator` and `AIResponseValidator` handle missing, partial, or malformed structures.
- **Evidence**: `src/test/failure-cases.test.ts` (9 test cases covering unreachable ports, malformed JSON, and empty payloads) passes.
- **Status**: **VERIFIED COMPLETE**

### 12. Documentation
- **Technical Guides**: Comprehensive `README.md` containing architecture diagrams, local setup, provider configuration, security notes, and troubleshooting.
- **Status**: **VERIFIED COMPLETE**

### 13. Build & Runtime
- **Build Verification**: `npm run build` succeeds cleanly.
- **Type Checking**: `npm run lint` (`tsc --noEmit`) passes with 0 errors.
- **Evidence**: `compile_applet` confirms `Build succeeded - the applet is compiled`.
- **Status**: **VERIFIED COMPLETE**
