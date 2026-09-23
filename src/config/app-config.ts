/**
 * Application Configuration
 * Centralized settings for Harness Engineering Generator.
 */

import { HarnessLevel, HarnessLevelDefinition, PlatformTarget } from '../domain/models';

export interface AppMetadata {
  name: string;
  version: string;
  description: string;
  environment: 'development' | 'production' | 'test';
}

export const APP_METADATA: AppMetadata = {
  name: 'Harness Engineering Generator',
  version: '0.1.0-alpha',
  description: 'Architectural foundation and engineering harness generator for AI coding agents.',
  environment: (process.env.NODE_ENV as AppMetadata['environment']) || 'development',
};

export const SUPPORTED_PLATFORMS: Array<{ id: PlatformTarget; labelKey: string }> = [
  { id: 'web', labelKey: 'platforms.web' },
  { id: 'desktop', labelKey: 'platforms.desktop' },
  { id: 'service', labelKey: 'platforms.service' },
  { id: 'mobile', labelKey: 'platforms.mobile' },
  { id: 'cli', labelKey: 'platforms.cli' },
  { id: 'library', labelKey: 'platforms.library' },
  { id: 'monorepo', labelKey: 'platforms.monorepo' },
];

export const HARNESS_LEVEL_DEFINITIONS: Record<HarnessLevel, HarnessLevelDefinition> = {
  basic: {
    level: 'basic',
    titleKey: 'harness.levels.basic.title',
    descriptionKey: 'harness.levels.basic.desc',
    targetComplexity: 'low',
    recommendedFileCount: '3-5 files',
    keyCapabilities: [
      'Single root agent instruction file (AGENT.md)',
      'Basic project specification & scope boundaries',
      'Simple verification commands checklist',
      'Standard definition of done',
    ],
  },
  medium: {
    level: 'medium',
    titleKey: 'harness.levels.medium.title',
    descriptionKey: 'harness.levels.medium.desc',
    targetComplexity: 'moderate',
    recommendedFileCount: '8-12 files',
    keyCapabilities: [
      'Progressive disclosure instruction tree',
      'Machine-readable project state (state.json)',
      'Explicit feature list & verification rules',
      'Session handoff log and resume protocol',
      'Architecture constraints & anti-patterns guide',
    ],
  },
  advanced: {
    level: 'advanced',
    titleKey: 'harness.levels.advanced.title',
    descriptionKey: 'harness.levels.advanced.desc',
    targetComplexity: 'high',
    recommendedFileCount: '15-25 files',
    keyCapabilities: [
      'Multi-agent role specifications & boundary isolation',
      'Observability guidelines & invariant check scripts',
      'Automated evidence collection for verification',
      'Continuous session log & rollback instructions',
      'Domain-specific architectural decision records (ADRs)',
      'Strict multi-session handoff contracts',
    ],
  },
  dynamic: {
    level: 'dynamic',
    titleKey: 'harness.levels.dynamic.title',
    descriptionKey: 'harness.levels.dynamic.desc',
    targetComplexity: 'custom',
    recommendedFileCount: 'Adaptive',
    keyCapabilities: [
      'Tailored file topology determined by AI project analysis',
      'Selective inclusion based on framework & domain characteristics',
      'Extensible custom rule generation',
    ],
  },
};
