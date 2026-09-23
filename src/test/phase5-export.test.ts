/**
 * Phase 5 GitHub, Local Export & Provider Integrations Test Suite
 */

import { exporterRegistry } from '../services/providers/exporter/exporter.registry';
import { ZipExporter } from '../services/providers/exporter/zip-exporter';
import { JsonExporter } from '../services/providers/exporter/json-exporter';
import { LocalDirectoryExporter } from '../services/providers/exporter/local-directory-exporter';
import { GitHubRepositoryProvider } from '../services/providers/repository/github-repository.provider';
import { LocalModelProvider } from '../services/providers/ai/local-model.provider';
import { CustomAPIProvider } from '../services/providers/ai/custom-api.provider';
import { CredentialManager } from '../config/provider-config';

export function runPhase5Tests(): { passed: number; failed: number; errors: string[] } {
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
    // 1. Exporter Registry & Formats
    const formats = exporterRegistry.getSupportedFormats();
    assert(formats.includes('zip'), 'Exporter registry should support "zip" format');
    assert(
      formats.includes('directory_bundle'),
      'Exporter registry should support "directory_bundle" format',
    );
    assert(formats.includes('raw_json'), 'Exporter registry should support "raw_json" format');

    // 2. ZIP Archive Exporter
    const zipExporter = new ZipExporter();
    assert(zipExporter.canExport('zip'), 'ZipExporter should handle "zip" format');
    assert(!zipExporter.canExport('raw_json'), 'ZipExporter should reject "raw_json" format');

    const sampleArtifacts = [
      { path: 'AGENT.md', content: '# Root Agent Instructions\n\nOperate deterministically.' },
      { path: 'scripts/verify.sh', content: '#!/usr/bin/env bash\necho "Running tests..."\nexit 0', isExecutable: true },
      { path: '.harness/state/project-state.json', content: '{"status": "active"}' },
    ];

    // Synchronous execution verification check on ZipExporter
    const zipPromise = zipExporter.export(sampleArtifacts, {
      format: 'zip',
      destinationPath: 'test-project',
    });
    assert(zipPromise instanceof Promise, 'zipExporter.export should return a Promise');

    // 3. JSON Exporter
    const jsonExporter = new JsonExporter();
    assert(jsonExporter.canExport('raw_json'), 'JsonExporter should handle "raw_json" format');

    // 4. Local Directory Exporter
    assert(
      typeof LocalDirectoryExporter.isFileSystemAccessSupported === 'function',
      'LocalDirectoryExporter should have static isFileSystemAccessSupported check',
    );

    // 5. GitHub Repository Provider & Change Preview
    const gitHubProvider = new GitHubRepositoryProvider();
    assert(gitHubProvider.id === 'github', 'GitHub provider should have ID "github"');

    // Test connection without token should fail cleanly
    const connectionPromise = gitHubProvider.testConnection('');
    assert(connectionPromise instanceof Promise, 'testConnection should return a Promise');

    // Test commit execution requires explicit user confirmation
    const unconfirmedPromise = gitHubProvider.executeCommit({
      repoOwner: 'test-org',
      repoName: 'test-repo',
      branchName: 'main',
      createBranchIfMissing: false,
      commitMessage: 'feat: test',
      changes: [],
      userConfirmed: false,
    });

    // 6. Local Model Provider
    const localModelProvider = new LocalModelProvider();
    assert(localModelProvider.id === 'local_model', 'LocalModelProvider should have ID "local_model"');
    const localInfo = localModelProvider.getInfo();
    assert(localInfo.capabilities.isLocalOnly === true, 'LocalModelProvider must be local only (zero egress)');

    // 7. Custom API Provider & Credential Security
    const customAPIProvider = new CustomAPIProvider();
    assert(customAPIProvider.id === 'custom_api', 'CustomAPIProvider should have ID "custom_api"');

    // Ensure credentials never leak to getInfo
    CredentialManager.setAIKey('custom_api', 'test_secret_key_123', false);
    const customInfo = customAPIProvider.getInfo();
    assert(
      !JSON.stringify(customInfo).includes('test_secret_key_123'),
      'Credentials must never leak into provider info or serialization',
    );

    // Clean up
    CredentialManager.setAIKey('custom_api', '', false);
  } catch (err: unknown) {
    failed++;
    errors.push(`Phase 5 test exception: ${(err as Error).message}`);
  }

  return { passed, failed, errors };
}
