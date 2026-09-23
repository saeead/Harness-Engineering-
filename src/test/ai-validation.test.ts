/**
 * Phase 7 Test Suite: AI Response Validation & Sanitization Layer
 * Enforces zero blind trust of AI payloads, robust error recovery, and security constraints.
 */

import { AIResponseValidator } from '../services/validation/ai-response.validator';
import { TestResultSummary } from './domain-logic.test';

export function runAIValidationTests(): TestResultSummary {
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
    // 1. JSON Parsing: Clean JSON
    const cleanJson = '{"name": "test", "level": "medium"}';
    const parseResult1 = AIResponseValidator.safeParseJson(cleanJson);
    assert(parseResult1.success, 'Valid JSON string should parse cleanly');
    assert((parseResult1.data as Record<string, string>).name === 'test', 'Parsed field should match');

    // 2. JSON Parsing: Stripping Markdown Codeblocks
    const wrappedJson = '```json\n{"analysis": "complete", "score": 95}\n```';
    const parseResult2 = AIResponseValidator.safeParseJson(wrappedJson);
    assert(parseResult2.success, 'JSON wrapped in ```json codeblocks should be stripped and parsed');
    assert((parseResult2.data as Record<string, number>).score === 95, 'Parsed payload from block matches');

    // 3. JSON Parsing: Discarding Preamble/Postamble text
    const conversationalJson = 'Here is the analysis:\n{"recommendedLevel": "advanced"}\nHope this helps!';
    const parseResult3 = AIResponseValidator.safeParseJson(conversationalJson);
    assert(parseResult3.success, 'JSON with leading/trailing conversational text should be isolated');
    assert((parseResult3.data as Record<string, string>).recommendedLevel === 'advanced', 'Isolated payload matches');

    // 4. JSON Parsing: Malformed syntax handling
    const malformedJson = '{"key": "value", unquoted_key: }';
    const parseResult4 = AIResponseValidator.safeParseJson(malformedJson);
    assert(!parseResult4.success, 'Malformed syntax should safely fail without throwing exception');
    assert(Boolean(parseResult4.error), 'Failure should include human-readable error description');

    // 5. Analysis Validation: Missing & Malformed Fields Handling
    const incompletePayload = {
      // missing questions, recommendations, suggestions
      recommendedHarnessLevel: 'unknown_level',
      randomGarbageField: 'malicious or unexpected data',
    };
    const report1 = AIResponseValidator.validateAnalysis(incompletePayload);
    assert(report1.recovered, 'Incomplete payload should trigger safe automated recovery');
    assert(report1.sanitized.recommendedHarnessLevel === 'medium', 'Invalid level should default to "medium"');
    assert(Array.isArray(report1.sanitized.questions), 'Sanitized output should guarantee questions array');
    assert(
      !('randomGarbageField' in report1.sanitized),
      'Unexpected fields should be stripped from sanitized output',
    );

    // 6. Contradictory Flag Resolution: Blocking Question with Missing Impact
    const contradictoryPayload = {
      recommendedHarnessLevel: 'medium',
      questions: [
        {
          id: 'q1',
          question: 'Are external cloud databases permitted?',
          isBlocking: true,
          // impact is missing or empty!
          impact: '',
        },
      ],
    };
    const report2 = AIResponseValidator.validateAnalysis(contradictoryPayload);
    assert(
      (report2.sanitized.questions?.[0]?.impact?.length || 0) > 0,
      'Blocking question with empty impact should be auto-repaired with a clear architectural explanation',
    );
    assert(report2.warnings.length > 0, 'Auto-repair should emit a diagnostic warning');

    // 7. Malformed Artifact Definition: Path Traversal Attack Prevention
    const maliciousArtifacts = [
      { path: 'AGENT.md', content: 'Safe file' },
      { path: '../../etc/passwd', content: 'malicious payload' },
      { path: '..\\Windows\\System32\\cmd.exe', content: 'malicious windows traversal' },
      { path: '/absolute/root/file.txt', content: 'absolute path attempt' },
      { path: 'valid/nested/file.sh', content: '#!/bin/bash', isExecutable: true },
    ];
    const artifactReport = AIResponseValidator.validateArtifacts(maliciousArtifacts);
    assert(!artifactReport.isValid, 'Payload with path traversal should be flagged as invalid');
    assert(
      artifactReport.errors.some((e) => e.includes('path traversal') || e.includes('absolute')),
      'Errors should explicitly cite path traversal or absolute path violation',
    );
    assert(artifactReport.sanitized.length === 2, 'Only safe relative paths should survive sanitization');

    // 8. Null Byte & Control Character Injection
    const controlCharArtifacts = [
      { path: 'AGENT\x00.md', content: 'Null byte injection attack' },
    ];
    const controlReport = AIResponseValidator.validateArtifacts(controlCharArtifacts);
    assert(
      controlReport.errors.some((e) => e.includes('control characters')),
      'Null bytes in file paths must be caught and rejected',
    );
  } catch (err) {
    failed++;
    errors.push(`AI validation test failure: ${String(err)}`);
  }

  return {
    suiteName: 'AI Response Validation & Security Layer',
    passed,
    failed,
    errors,
  };
}
