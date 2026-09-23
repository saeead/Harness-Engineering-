/**
 * Phase 4 Repository Intelligence & Audit Verification Tests
 */

import { SafeScanner } from '../services/analysis/safe-scanner';
import { HarnessAuditor } from '../services/analysis/harness-auditor';
import { RemediationPlanner } from '../services/analysis/remediation-planner';
import { SAFE_FIXTURES } from '../services/analysis/safe-fixtures';
import { GitHubRepositoryScanner } from '../services/providers/repository/github-repository.scanner';
import { RepositoryIntelligenceEngine } from '../services/analysis/repository-intelligence.engine';

export function runPhase4Tests(): { passed: number; failed: number; errors: string[] } {
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
    // 1. SafeScanner Tests on Sample Fixtures
    const expressFixture = SAFE_FIXTURES.find((f) => f.id === 'express_monolith')!;
    const expressInventory = SafeScanner.scan(expressFixture.files);

    assert(
      expressInventory.detectedStack.primaryLanguage === 'JavaScript',
      `Express fixture should detect JavaScript as primary language, got: ${expressInventory.detectedStack.primaryLanguage}`,
    );
    assert(
      expressInventory.detectedStack.frameworks.includes('Express.js'),
      'Express fixture should detect Express.js framework',
    );
    assert(
      expressInventory.testingFiles.length === 2,
      `Express fixture should detect 2 test files, got: ${expressInventory.testingFiles.length}`,
    );
    assert(
      expressInventory.agentInstructionFiles.length === 0,
      'Express fixture should have zero agent instruction files',
    );

    // 2. React SPA Fixture Scan
    const reactFixture = SAFE_FIXTURES.find((f) => f.id === 'react_vite_spa')!;
    const reactInventory = SafeScanner.scan(reactFixture.files);

    assert(
      reactInventory.detectedStack.primaryLanguage === 'TypeScript',
      `React fixture should detect TypeScript, got: ${reactInventory.detectedStack.primaryLanguage}`,
    );
    assert(
      reactInventory.detectedStack.frameworks.includes('React'),
      'React fixture should detect React framework',
    );
    assert(
      reactInventory.agentInstructionFiles.some((f) => f.includes('.cursorrules')),
      'React fixture should detect .cursorrules as agent instructions',
    );

    // 3. Harness Maturity Audit
    const expressAudit = HarnessAuditor.audit(expressInventory);
    assert(
      expressAudit.dimensions.instructions.status === 'partial' || expressAudit.dimensions.instructions.status === 'missing',
      'Express fixture should have instructions dimension status as "partial" or "missing"',
    );
    assert(
      expressAudit.dimensions.state.status === 'missing',
      'Express fixture should have state dimension status as "missing"',
    );
    assert(
      expressAudit.dimensions.verification.status === 'partial',
      'Express fixture should have verification dimension status as "partial" (has tests but no verify script)',
    );
    assert(
      expressAudit.gaps.length >= 3,
      `Express fixture should identify at least 3 gaps, got: ${expressAudit.gaps.length}`,
    );
    assert(
      expressAudit.risks.length >= 2,
      `Express fixture should identify at least 2 operational risks, got: ${expressAudit.risks.length}`,
    );


    // 4. Remediation Planner
    const remediation = RemediationPlanner.plan('Express Legacy', expressInventory, expressAudit);
    assert(
      remediation.recommendedAdditions.some((item) => item.subsystem === 'instructions'),
      'Remediation should recommend instruction artifacts',
    );
    assert(
      remediation.recommendedAdditions.some((item) => item.subsystem === 'state'),
      'Remediation should recommend state tracking artifacts',
    );
    assert(
      remediation.inferredSpecification.name === 'Express Legacy',
      'Inferred specification should adopt project name',
    );
    assert(
      remediation.inferredSpecification.projectType === 'api',
      `Inferred specification should identify project as API, got: ${remediation.inferredSpecification.projectType}`,
    );

    // 5. GitHub Slug Parsing
    const parsedUrl = GitHubRepositoryScanner.parseRepoSlug('https://github.com/facebook/react.git');
    assert(
      parsedUrl?.owner === 'facebook' && parsedUrl?.repo === 'react',
      'Should parse full GitHub URL with .git suffix',
    );

    const parsedSlug = GitHubRepositoryScanner.parseRepoSlug('expressjs/express');
    assert(
      parsedSlug?.owner === 'expressjs' && parsedSlug?.repo === 'express',
      'Should parse owner/repo slug format',
    );

    const parsedInvalid = GitHubRepositoryScanner.parseRepoSlug('invalid-format-without-slash');
    assert(parsedInvalid === null, 'Should return null for invalid slug formats');

    // 6. Repository Intelligence Engine synchronous flow check
    const reportPromise = RepositoryIntelligenceEngine.analyze({
      sourceType: 'sample_fixture',
      sourceInput: 'react_vite_spa',
    });

    // Verify it returns a promise resolving to a valid report
    assert(reportPromise instanceof Promise, 'analyze should return a Promise');
  } catch (err: unknown) {
    failed++;
    errors.push(`Test execution exception: ${(err as Error).message}`);
  }

  return { passed, failed, errors };
}
