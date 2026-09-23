/**
 * Phase 7 Test Suite: End-to-End Integration & Multi-System Continuity
 * Tests AI Provider abstraction, Storage persistence, Export workflows, and Secret scrubbing.
 */

import { aiProviderRegistry } from '../services/providers/ai/ai-provider.registry';
import { repositoryProviderRegistry } from '../services/providers/repository/repository-provider.registry';
import { storageProviderRegistry } from '../services/providers/storage/storage-provider.registry';
import { exporterRegistry } from '../services/providers/exporter/exporter.registry';
import { AuditLogger } from '../services/observability/audit-logger';
import { ProjectSpecification } from '../domain/models';
import { TestResultSummary } from './domain-logic.test';

export function runIntegrationTests(): TestResultSummary {
  let passed = 0;
  let failed = 0;
  const errors: string[] = [];

  const assert = (condition: boolean, message: string) => {
    if (condition) {
      passed++;
    } else {
      failed++;
      errors.push(message);
    }
  };

  try {
    // 1. AI Provider Abstraction Layer
    const aiProviders = aiProviderRegistry.listAvailableProviders();
    assert(aiProviders.length >= 3, 'At least 3 AI providers must be registered (gemini, local, custom)');
    const activeAI = aiProviderRegistry.getActiveProvider();
    assert(Boolean(activeAI), 'An active AI provider must be selected');
    assert(typeof activeAI.getInfo === 'function', 'Active AI provider must implement getInfo()');

    // 2. Repository Provider Abstraction Layer
    const repoProviders = repositoryProviderRegistry.listAvailableProviders();
    assert(repoProviders.length >= 1, 'At least 1 repository provider (github) must be registered');
    const githubRepoProvider = repositoryProviderRegistry.get('github');
    assert(Boolean(githubRepoProvider), 'GitHub repository provider must be present');

    // 3. Exporter Provider Abstraction Layer
    const formats = exporterRegistry.getSupportedFormats();
    assert(formats.length >= 3, 'At least 3 export formats must be supported (zip, raw_json, directory_bundle)');
    const zipExp = exporterRegistry.get('zip');
    assert(Boolean(zipExp), 'Exporter for format "zip" must be found');
    const jsonExp = exporterRegistry.get('raw_json');
    assert(Boolean(jsonExp), 'Exporter for format "raw_json" must be found');

    // 4. Storage Provider Abstraction Layer
    const activeStorage = storageProviderRegistry.getActiveProvider();
    assert(Boolean(activeStorage), 'Active storage provider must exist');
    assert(activeStorage.id === 'browser_local', 'Active storage provider should be browser_local');

    // 5. Audit Logger: Secret Scrubbing Verification
    const sampleSensitiveText =
      'Commit generated with token ghp_ABC1234567890abcdef1234567890abcdef and key AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q in repo';
    const scrubbed = AuditLogger.scrubSecrets(sampleSensitiveText);

    assert(
      !scrubbed.includes('ghp_ABC1234567890abcdef1234567890abcdef'),
      'GitHub classic token must be redacted from audit logs',
    );
    assert(
      !scrubbed.includes('AIzaSyA1B2C3D4E5F6G7H8I9J0K1L2M3N4O5P6Q'),
      'Gemini API key must be redacted from audit logs',
    );
    assert(
      scrubbed.includes('[REDACTED_GH_TOKEN]'),
      'Scrubbed string should contain token redaction placeholder',
    );
    assert(
      scrubbed.includes('[REDACTED_GEMINI_KEY]'),
      'Scrubbed string should contain key redaction placeholder',
    );

    // 6. Audit Logger: Operation Tracking Lifecycle
    const handle = AuditLogger.startOperation('system_self_test', 'Integration Test Run');
    const successEntry = handle.recordSuccess('Completed all invariant assertions');
    assert(successEntry.result === 'success', 'Audit entry result should be success');
    assert(successEntry.operationType === 'system_self_test', 'Audit entry type matches');
    assert(successEntry.validationState === 'validated', 'Audit entry validationState is validated');

    const history = AuditLogger.getEntries();
    assert(
      history.some((e) => e.id === successEntry.id),
      'New audit entry must be retrievable from getEntries()',
    );

  } catch (err) {
    failed++;
    errors.push(`Integration test error: ${String(err)}`);
  }

  return {
    suiteName: 'Integration: Providers, Storage & Secret Scrubbing',
    passed,
    failed,
    errors,
  };
}
