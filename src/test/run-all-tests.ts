/**
 * Unified Test Runner for AI Agent Studio
 * Aggregates Unit, Integration, Failure Cases, and Subsystem Audits.
 */

import { runDomainLogicTests, TestResultSummary } from './domain-logic.test';
import { runAIValidationTests } from './ai-validation.test';
import { runFailureCaseTests } from './failure-cases.test';
import { runIntegrationTests } from './integration.test';
import { runPhase4Tests } from './phase4-analysis.test';
import { runPhase5Tests } from './phase5-export.test';
import { auditTranslationParity } from './i18n-completeness.test';

export interface FullTestReport {
  timestamp: string;
  totalPassed: number;
  totalFailed: number;
  isAllPassed: boolean;
  suites: TestResultSummary[];
}

export function runAllAppTests(): FullTestReport {
  const suites: TestResultSummary[] = [];

  // 1. Unit: Domain Logic & Planning
  suites.push(runDomainLogicTests());

  // 2. AI Validation & Sanitization
  suites.push(runAIValidationTests());

  // 3. Failure Cases & Boundary Defense
  suites.push(runFailureCaseTests());

  // 4. Integration: Providers & Secret Scrubbing
  suites.push(runIntegrationTests());

  // 5. Phase 4: Repository Intelligence & Audit
  const p4 = runPhase4Tests();
  suites.push({
    suiteName: 'Phase 4: Repository Intelligence & Subsystem Audit',
    passed: p4.passed,
    failed: p4.failed,
    errors: p4.errors,
  });

  // 6. Phase 5: Export & GitHub Git Trees Commit Pipeline
  const p5 = runPhase5Tests();
  suites.push({
    suiteName: 'Phase 5: Destination Exporters & Git Trees Pipeline',
    passed: p5.passed,
    failed: p5.failed,
    errors: p5.errors,
  });

  // 7. i18n Translation Completeness & Parity Audit
  const i18nAudit = auditTranslationParity();
  suites.push({
    suiteName: 'i18n: Bilingual Completeness & Persian Parity',
    passed: i18nAudit.is100PercentComplete ? i18nAudit.totalKeysTested : i18nAudit.totalKeysTested - (i18nAudit.missingInFa.length + i18nAudit.emptyInFa.length),
    failed: i18nAudit.missingInFa.length + i18nAudit.missingInEn.length + i18nAudit.emptyInFa.length + i18nAudit.emptyInEn.length,
    errors: [
      ...i18nAudit.missingInFa.map((k) => `Missing in fa: ${k}`),
      ...i18nAudit.missingInEn.map((k) => `Missing in en: ${k}`),
      ...i18nAudit.emptyInFa.map((k) => `Empty string in fa: ${k}`),
      ...i18nAudit.emptyInEn.map((k) => `Empty string in en: ${k}`),
    ],
  });

  const totalPassed = suites.reduce((sum, s) => sum + s.passed, 0);
  const totalFailed = suites.reduce((sum, s) => sum + s.failed, 0);

  return {
    timestamp: new Date().toISOString(),
    totalPassed,
    totalFailed,
    isAllPassed: totalFailed === 0,
    suites,
  };
}

// CLI runner when executed directly via tsx
if (typeof process !== 'undefined' && process.argv && process.argv[1]?.includes('run-all-tests')) {
  console.log('--- Running AI Agent Studio Comprehensive Test Matrix ---');
  const report = runAllAppTests();
  console.log(`Summary: ${report.totalPassed} passed, ${report.totalFailed} failed.`);

  report.suites.forEach((suite) => {
    const status = suite.failed === 0 ? '✓ PASS' : '✗ FAIL';
    console.log(`${status}: ${suite.suiteName} (${suite.passed} passed, ${suite.failed} failed)`);
    if (suite.errors.length > 0) {
      suite.errors.forEach((err) => console.log(`   - ${err}`));
    }
  });

  if (!report.isAllPassed) {
    process.exit(1);
  }
}
