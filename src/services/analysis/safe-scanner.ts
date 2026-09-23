/**
 * Safe Repository Scanner
 * Pure read-only structural analysis of project files.
 * SAFETY GUARANTEE: Never executes arbitrary repository code.
 */

import {
  ProjectInventory,
  ScannedFile,
  DetectedStack,
  FileCategory,
} from '../../domain/models/repository-analysis';

export class SafeScanner {
  /**
   * Scans a list of relative file paths and optional safe content snippets.
   */
  public static scan(files: Array<{ path: string; content?: string }>): ProjectInventory {
    const scannedFiles: ScannedFile[] = files.map((f) => this.classifyFile(f.path, f.content));

    const directorySet = new Set<string>();
    for (const f of scannedFiles) {
      const parts = f.path.split('/');
      if (parts.length > 1) {
        for (let i = 1; i < parts.length; i++) {
          directorySet.add(parts.slice(0, i).join('/'));
        }
      }
    }

    const directoryMap = Array.from(directorySet).sort();
    const detectedStack = this.detectStack(scannedFiles);
    const architectureClues = this.detectArchitectureClues(scannedFiles, directoryMap);

    const documentationFiles = scannedFiles
      .filter((f) => f.category === 'documentation')
      .map((f) => f.path);

    const testingFiles = scannedFiles
      .filter((f) => f.category === 'test')
      .map((f) => f.path);

    const agentInstructionFiles = scannedFiles
      .filter((f) => f.category === 'instructions')
      .map((f) => f.path);

    const stateFiles = scannedFiles
      .filter((f) => f.category === 'state' || f.path.includes('.harness/state'))
      .map((f) => f.path);

    const verificationScripts = scannedFiles
      .filter(
        (f) =>
          f.category === 'script' &&
          (f.path.includes('verify') || f.path.includes('test') || f.path.includes('check') || f.filename === 'Makefile'),
      )
      .map((f) => f.path);

    const lifecycleFiles = scannedFiles
      .filter(
        (f) =>
          f.path.includes('init') ||
          f.path.includes('handoff') ||
          f.path.includes('setup') ||
          f.path.includes('bootstrap'),
      )
      .map((f) => f.path);

    const scopeRuleFiles = scannedFiles
      .filter(
        (f) =>
          f.path.includes('RULES') ||
          f.path.includes('boundaries') ||
          f.path.includes('.cursorrules') ||
          f.path.includes('.windsurfrules') ||
          f.path.includes('CONTRIBUTING'),
      )
      .map((f) => f.path);

    const observabilityFiles = scannedFiles
      .filter(
        (f) =>
          f.path.includes('OBSERVABILITY') ||
          f.path.includes('health') ||
          f.path.includes('metrics') ||
          f.path.includes('telemetry'),
      )
      .map((f) => f.path);

    return {
      totalFiles: scannedFiles.length,
      totalDirectories: directoryMap.length,
      directoryMap,
      detectedStack,
      architectureClues,
      documentationFiles,
      testingFiles,
      agentInstructionFiles,
      stateFiles,
      verificationScripts,
      lifecycleFiles,
      scopeRuleFiles,
      observabilityFiles,
      rawFiles: scannedFiles,
    };
  }

  /**
   * Classify file category based on path, extension, and filename
   */
  private static classifyFile(path: string, content?: string): ScannedFile {
    const normalized = path.replace(/^\/+/, '');
    const filename = normalized.split('/').pop() || normalized;
    const ext = filename.includes('.') ? filename.split('.').pop()?.toLowerCase() || '' : '';

    let category: FileCategory = 'other';

    const lowerName = filename.toLowerCase();
    const lowerPath = normalized.toLowerCase();

    // Agent instructions
    if (
      lowerName === 'agent.md' ||
      lowerName === 'claude.md' ||
      lowerName === '.cursorrules' ||
      lowerName === '.windsurfrules' ||
      lowerName.includes('copilot-instructions') ||
      lowerPath.includes('.harness/instructions')
    ) {
      category = 'instructions';
    }
    // State
    else if (
      lowerPath.includes('.harness/state.json') ||
      lowerPath.includes('.harness/features.json') ||
      lowerName === 'todo.md' ||
      lowerName === 'roadmap.md'
    ) {
      category = 'state';
    }
    // Documentation
    else if (
      lowerName.endsWith('.md') ||
      lowerName.endsWith('.mdx') ||
      lowerPath.startsWith('docs/') ||
      lowerName === 'license'
    ) {
      category = 'documentation';
    }
    // Tests
    else if (
      lowerName.includes('.test.') ||
      lowerName.includes('.spec.') ||
      lowerName.startsWith('test_') ||
      lowerPath.includes('tests/') ||
      lowerPath.includes('__tests__/')
    ) {
      category = 'test';
    }
    // Scripts
    else if (
      lowerPath.startsWith('scripts/') ||
      ext === 'sh' ||
      ext === 'bash' ||
      ext === 'zsh' ||
      lowerName === 'makefile'
    ) {
      category = 'script';
    }
    // Config
    else if (
      lowerName.includes('config') ||
      lowerName.endsWith('.json') ||
      lowerName.endsWith('.yaml') ||
      lowerName.endsWith('.yml') ||
      lowerName.endsWith('.toml') ||
      lowerName.startsWith('.') ||
      lowerName === 'dockerfile'
    ) {
      category = 'config';
    }
    // Code
    else if (
      ['ts', 'tsx', 'js', 'jsx', 'py', 'go', 'rs', 'java', 'c', 'cpp', 'rb', 'php', 'swift', 'kt'].includes(ext)
    ) {
      category = 'code';
    }

    return {
      path: normalized,
      filename,
      extension: ext,
      category,
      contentSample: content ? content.slice(0, 500) : undefined,
    };
  }

  /**
   * Safe heuristic detection of programming languages, frameworks, and tooling
   */
  private static detectStack(files: ScannedFile[]): DetectedStack {
    const languages = new Set<string>();
    const frameworks = new Set<string>();
    const packageManagers = new Set<string>();
    const buildTools = new Set<string>();
    const testRunners = new Set<string>();
    const linters = new Set<string>();
    const runtimes = new Set<string>();

    for (const f of files) {
      const p = f.path.toLowerCase();
      const n = f.filename.toLowerCase();

      // Languages & Runtimes
      if (f.extension === 'ts' || f.extension === 'tsx') {
        languages.add('TypeScript');
        runtimes.add('Node.js / Bun');
      } else if (f.extension === 'js' || f.extension === 'jsx') {
        languages.add('JavaScript');
        runtimes.add('Node.js');
      } else if (f.extension === 'py') {
        languages.add('Python');
        runtimes.add('Python 3');
      } else if (f.extension === 'go') {
        languages.add('Go');
        runtimes.add('Go Runtime');
      } else if (f.extension === 'rs') {
        languages.add('Rust');
        runtimes.add('Rust / Cargo');
      }

      // Package Managers
      if (n === 'package-lock.json') packageManagers.add('npm');
      if (n === 'yarn.lock') packageManagers.add('Yarn');
      if (n === 'pnpm-lock.yaml') packageManagers.add('pnpm');
      if (n === 'bun.lockb' || n === 'bun.lock') packageManagers.add('Bun');
      if (n === 'poetry.lock') packageManagers.add('Poetry');
      if (n === 'pipfile.lock') packageManagers.add('Pipenv');
      if (n === 'cargo.lock') packageManagers.add('Cargo');
      if (n === 'go.sum') packageManagers.add('Go Modules');

      // Build tools & Frameworks
      if (n === 'vite.config.ts' || n === 'vite.config.js') buildTools.add('Vite');
      if (n === 'next.config.js' || n === 'next.config.mjs' || n === 'next.config.ts') {
        frameworks.add('Next.js');
        frameworks.add('React');
      }
      if (f.extension === 'tsx' || f.extension === 'jsx') frameworks.add('React');
      if (p.includes('vue') || n.includes('vue.config')) frameworks.add('Vue.js');
      if (p.includes('express') || (f.contentSample && (f.contentSample.includes('express') || f.contentSample.includes("require('express')")))) {
        frameworks.add('Express.js');
      }
      if (p.includes('fastapi') || (f.contentSample && f.contentSample.includes('fastapi'))) {
        frameworks.add('FastAPI');
      }
      if (p.includes('flask') || (f.contentSample && f.contentSample.includes('flask'))) {
        frameworks.add('Flask');
      }
      if (n === 'tailwind.config.js' || n === 'tailwind.config.ts' || p.includes('tailwindcss')) {
        buildTools.add('Tailwind CSS');
      }

      // Test runners
      if (n.includes('jest.config')) testRunners.add('Jest');
      if (n.includes('vitest.config')) testRunners.add('Vitest');
      if (n === 'pytest.ini' || p.includes('conftest.py')) testRunners.add('pytest');
      if (f.extension === 'go' && n.endsWith('_test.go')) testRunners.add('go test');
      if (f.extension === 'rs' && p.includes('tests/')) testRunners.add('cargo test');

      // Linters
      if (n.includes('.eslintrc') || n.includes('eslint.config')) linters.add('ESLint');
      if (n.includes('.prettierrc')) linters.add('Prettier');
      if (n.includes('flake8') || n.includes('ruff')) linters.add('Ruff / Flake8');
    }

    const primaryLang =
      languages.has('TypeScript')
        ? 'TypeScript'
        : languages.has('Python')
        ? 'Python'
        : languages.has('Go')
        ? 'Go'
        : languages.has('Rust')
        ? 'Rust'
        : languages.has('JavaScript')
        ? 'JavaScript'
        : languages.size > 0
        ? Array.from(languages)[0]
        : 'Unknown';

    return {
      primaryLanguage: primaryLang,
      languages: Array.from(languages),
      frameworks: Array.from(frameworks),
      packageManagers: Array.from(packageManagers),
      buildTools: Array.from(buildTools),
      testRunners: Array.from(testRunners),
      linters: Array.from(linters),
      runtimes: Array.from(runtimes),
    };
  }

  /**
   * Structural architectural clues
   */
  private static detectArchitectureClues(files: ScannedFile[], directories: string[]): string[] {
    const clues: string[] = [];

    const dirSet = new Set(directories.map((d) => d.toLowerCase()));

    if (dirSet.has('packages') || dirSet.has('apps') || files.some((f) => f.path.includes('pnpm-workspace'))) {
      clues.push('Monorepo layout detected (packages/ or apps/ directory present)');
    }
    if (dirSet.has('src/domain') || dirSet.has('domain')) {
      clues.push('Domain-Driven or Clean Architecture layout detected');
    }
    if (dirSet.has('src/components') || dirSet.has('components')) {
      clues.push('Component-based presentation hierarchy detected');
    }
    if (dirSet.has('src/services') || dirSet.has('services')) {
      clues.push('Service-oriented business logic layer detected');
    }
    if (dirSet.has('api') || dirSet.has('controllers') || dirSet.has('routes')) {
      clues.push('REST or RPC endpoint routing layer detected');
    }
    if (files.some((f) => f.filename.toLowerCase() === 'dockerfile')) {
      clues.push('Containerized deployment support (Dockerfile present)');
    }
    if (files.some((f) => f.path.includes('.github/workflows'))) {
      clues.push('GitHub Actions CI/CD automation configured');
    }

    if (clues.length === 0) {
      clues.push('Standard flat / single-package application structure');
    }

    return clues;
  }
}
