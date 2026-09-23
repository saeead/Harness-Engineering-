/**
 * Safe Sample Fixtures
 * Verified, completely safe mock repository structures for testing repository intelligence.
 * SAFETY GUARANTEE: Contains zero runnable shell commands or dangerous scripts.
 */

export interface SafeFixtureProject {
  id: string;
  name: string;
  description: string;
  expectedStack: string;
  files: Array<{ path: string; content?: string }>;
}

export const SAFE_FIXTURES: SafeFixtureProject[] = [
  {
    id: 'express_monolith',
    name: 'Legacy Express.js API Monolith',
    description: 'REST API backend with existing tests and README, but zero AI agent guidance, state tracking, or verification gates.',
    expectedStack: 'JavaScript / Express.js / Node.js',
    files: [
      { path: 'package.json', content: '{"name": "legacy-api", "dependencies": {"express": "^4.18.2"}, "scripts": {"test": "jest"}}' },
      { path: 'package-lock.json', content: '' },
      { path: 'src/index.js', content: "const express = require('express');" },
      { path: 'src/routes/users.js', content: '' },
      { path: 'src/routes/orders.js', content: '' },
      { path: 'src/controllers/auth.controller.js', content: '' },
      { path: 'src/services/db.service.js', content: '' },
      { path: 'tests/auth.test.js', content: "describe('Auth', () => {});" },
      { path: 'tests/users.test.js', content: "describe('Users', () => {});" },
      { path: 'README.md', content: '# Legacy Express API\n\nRun npm install and npm start.' },
      { path: '.gitignore', content: 'node_modules\n.env' },
    ],
  },
  {
    id: 'react_vite_spa',
    name: 'Modern React & Vite SPA',
    description: 'TypeScript frontend with Vite, ESLint, and a tool-specific .cursorrules file, but missing durable state, verification script, and DoD.',
    expectedStack: 'TypeScript / React / Vite',
    files: [
      { path: 'package.json', content: '{"name": "client-portal", "devDependencies": {"vite": "^5.0.0", "typescript": "^5.0.0"}}' },
      { path: 'pnpm-lock.yaml', content: '' },
      { path: 'vite.config.ts', content: "import { defineConfig } from 'vite';" },
      { path: 'tsconfig.json', content: '{}' },
      { path: 'src/main.tsx', content: '' },
      { path: 'src/App.tsx', content: '' },
      { path: 'src/components/Header.tsx', content: '' },
      { path: 'src/components/Dashboard.tsx', content: '' },
      { path: 'src/services/api-client.ts', content: '' },
      { path: 'src/App.test.tsx', content: '' },
      { path: '.cursorrules', content: 'Be concise. Use React hooks.' },
      { path: '.eslintrc.json', content: '{}' },
      { path: 'README.md', content: '# Client Portal\nBuilt with Vite and React.' },
    ],
  },
  {
    id: 'fastapi_microservice',
    name: 'Python FastAPI Microservice',
    description: 'Python backend with Docker and Pytest, but no agent instruction file or session lifecycle protocol.',
    expectedStack: 'Python / FastAPI / Docker',
    files: [
      { path: 'pyproject.toml', content: '[tool.poetry]\nname = "analytics-service"' },
      { path: 'poetry.lock', content: '' },
      { path: 'app/main.py', content: 'from fastapi import FastAPI\napp = FastAPI()' },
      { path: 'app/api/v1/metrics.py', content: '' },
      { path: 'app/core/config.py', content: '' },
      { path: 'app/models/metric.py', content: '' },
      { path: 'tests/test_metrics.py', content: 'def test_metrics(): pass' },
      { path: 'pytest.ini', content: '[pytest]\ntestpaths = tests' },
      { path: 'Dockerfile', content: 'FROM python:3.11-slim' },
      { path: 'README.md', content: '# Analytics Service\nFastAPI microservice.' },
    ],
  },
  {
    id: 'pnpm_monorepo',
    name: 'Full-Stack Monorepo',
    description: 'Multi-package pnpm monorepo with an ad-hoc text TODO.md, but no multi-agent isolation or centralized verification script.',
    expectedStack: 'TypeScript / Monorepo (pnpm)',
    files: [
      { path: 'pnpm-workspace.yaml', content: "packages:\n  - 'apps/*'\n  - 'packages/*'" },
      { path: 'package.json', content: '{"name": "root", "scripts": {"test": "pnpm -r test"}}' },
      { path: 'pnpm-lock.yaml', content: '' },
      { path: 'apps/web/package.json', content: '{"name": "web"}' },
      { path: 'apps/web/src/pages/index.tsx', content: '' },
      { path: 'apps/api/package.json', content: '{"name": "api"}' },
      { path: 'apps/api/src/server.ts', content: '' },
      { path: 'packages/shared/package.json', content: '{"name": "shared"}' },
      { path: 'packages/shared/index.ts', content: '' },
      { path: 'packages/shared/index.test.ts', content: '' },
      { path: 'TODO.md', content: '- [ ] Finish user auth\n- [ ] Fix broken API test' },
      { path: 'README.md', content: '# Enterprise Monorepo' },
    ],
  },
];
