/**
 * i18n Translation Completeness Verification Test
 * Verifies 100% bilingual parity between English (LTR) and Persian (RTL).
 * Enforces:
 * 1. Zero missing keys between 'en' and 'fa'.
 * 2. Zero empty string translations.
 * 3. Identical nested object structural depth.
 * 4. Proper RTL Persian terminology coverage.
 */

import { en } from '../i18n/translations/en';
import { fa } from '../i18n/translations/fa';

export interface ParityReport {
  totalKeysTested: number;
  missingInFa: string[];
  missingInEn: string[];
  emptyInFa: string[];
  emptyInEn: string[];
  exactEnglishCopiesInFa: string[];
  is100PercentComplete: boolean;
}

export function auditTranslationParity(): ParityReport {
  const missingInFa: string[] = [];
  const missingInEn: string[] = [];
  const emptyInFa: string[] = [];
  const emptyInEn: string[] = [];
  const exactEnglishCopiesInFa: string[] = [];
  let totalKeysTested = 0;

  // Technical terms or proper nouns allowed to be identical
  const ALLOWED_IDENTICAL = new Set([
    'GitHub',
    'TypeScript',
    'React',
    'Node.js',
    'JSON',
    'ZIP',
    'API',
    'URL',
    'CLI',
    'ESM',
    'AIzaSy...',
    'OLLAMA_ORIGINS="*"',
    'dir="rtl"',
  ]);

  function traverse(enObj: any, faObj: any, currentPath: string) {
    // Check all keys in enObj
    for (const key of Object.keys(enObj)) {
      const fullPath = currentPath ? `${currentPath}.${key}` : key;
      const enVal = enObj[key];
      const faVal = faObj ? faObj[key] : undefined;

      if (faVal === undefined) {
        missingInFa.push(fullPath);
        continue;
      }

      if (typeof enVal === 'object' && enVal !== null) {
        if (typeof faVal !== 'object' || faVal === null) {
          missingInFa.push(`${fullPath} (type mismatch: expected object)`);
        } else {
          traverse(enVal, faVal, fullPath);
        }
      } else {
        totalKeysTested++;
        if (typeof enVal === 'string' && enVal.trim() === '') {
          emptyInEn.push(fullPath);
        }
        if (typeof faVal === 'string') {
          if (faVal.trim() === '') {
            emptyInFa.push(fullPath);
          } else if (
            faVal.trim() === enVal.trim() &&
            !ALLOWED_IDENTICAL.has(faVal.trim()) &&
            faVal.trim().length > 3 &&
            !faVal.includes('{')
          ) {
            // Check if string contains English words only where Persian is expected
            if (/^[A-Za-z0-9\s:._/\\-]+$/.test(faVal)) {
              exactEnglishCopiesInFa.push(`${fullPath}: "${faVal}"`);
            }
          }
        } else {
          emptyInFa.push(`${fullPath} (not a string)`);
        }
      }
    }

    // Check for surplus or orphaned keys in faObj
    if (faObj && typeof faObj === 'object') {
      for (const key of Object.keys(faObj)) {
        const fullPath = currentPath ? `${currentPath}.${key}` : key;
        if (enObj[key] === undefined) {
          missingInEn.push(fullPath);
        }
      }
    }
  }

  traverse(en, fa, '');

  const is100PercentComplete =
    missingInFa.length === 0 &&
    missingInEn.length === 0 &&
    emptyInFa.length === 0 &&
    emptyInEn.length === 0 &&
    exactEnglishCopiesInFa.length === 0;

  return {
    totalKeysTested,
    missingInFa,
    missingInEn,
    emptyInFa,
    emptyInEn,
    exactEnglishCopiesInFa,
    is100PercentComplete,
  };
}

export function runTranslationCompletenessTest(): boolean {
  console.log('\n--- EXECUTING I18N PARITY & PERSIAN COMPLETENESS AUDIT ---');
  const report = auditTranslationParity();

  console.log(`Total Translation Keys Tested: ${report.totalKeysTested}`);
  console.log(`Missing in Persian (fa): ${report.missingInFa.length}`);
  console.log(`Missing in English (en): ${report.missingInEn.length}`);
  console.log(`Empty strings in Persian: ${report.emptyInFa.length}`);
  console.log(`Empty strings in English: ${report.emptyInEn.length}`);
  console.log(`Untranslated English strings in Persian: ${report.exactEnglishCopiesInFa.length}`);

  if (report.missingInFa.length > 0) {
    console.error('❌ Keys missing in Persian:', report.missingInFa);
  }
  if (report.missingInEn.length > 0) {
    console.error('❌ Keys missing in English:', report.missingInEn);
  }
  if (report.emptyInFa.length > 0) {
    console.error('❌ Empty keys in Persian:', report.emptyInFa);
  }
  if (report.exactEnglishCopiesInFa.length > 0) {
    console.warn('⚠️ Untranslated strings in Persian:', report.exactEnglishCopiesInFa);
  }

  if (report.is100PercentComplete) {
    console.log('✅ 100% BILINGUAL TRANSLATION PARITY CONFIRMED (Zero missing keys, zero empty strings)\n');
    return true;
  } else {
    console.error('❌ I18N TRANSLATION PARITY AUDIT FAILED\n');
    return false;
  }
}
