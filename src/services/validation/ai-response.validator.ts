/**
 * AI Response & Artifact Structural Validator
 * Validates, cleans, and sanitizes untrusted AI output before adoption.
 * Enforces zero path-traversal, complete field schemas, and resolves contradictory flags.
 */

import {
  ProjectAnalysis,
  ProjectSpecification,
  AnalysisQuestion,
  FeatureRecommendation,
  ArchitectureSuggestion,
  ProjectType,
  HarnessLevel,
  GeneratedFile,
  SubsystemType,
  ArtifactCategory,
  ArtifactFileType,
} from '../../domain/models';

export interface ValidationReport<T> {
  isValid: boolean;
  sanitized: T;
  errors: string[];
  warnings: string[];
  recovered: boolean;
}

export class AIResponseValidator {
  /**
   * Safely parse raw JSON string from AI output, stripping code fences or preamble
   */
  public static safeParseJson(raw: string): { success: boolean; data?: unknown; error?: string } {
    if (!raw || typeof raw !== 'string') {
      return { success: false, error: 'Empty or non-string AI response received.' };
    }

    let cleaned = raw.trim();

    // Strip markdown code fences if model wrapped JSON
    if (cleaned.startsWith('```')) {
      cleaned = cleaned.replace(/^```(?:json)?\s*/i, '');
      cleaned = cleaned.replace(/\s*```$/i, '');
      cleaned = cleaned.trim();
    }

    // Try finding JSON object/array boundaries if preamble/postamble exists
    const firstBrace = cleaned.indexOf('{');
    const firstBracket = cleaned.indexOf('[');

    if (firstBrace !== -1 && (firstBracket === -1 || firstBrace < firstBracket)) {
      const lastBrace = cleaned.lastIndexOf('}');
      if (lastBrace !== -1 && lastBrace > firstBrace) {
        cleaned = cleaned.substring(firstBrace, lastBrace + 1);
      }
    } else if (firstBracket !== -1) {
      const lastBracket = cleaned.lastIndexOf(']');
      if (lastBracket !== -1 && lastBracket > firstBracket) {
        cleaned = cleaned.substring(firstBracket, lastBracket + 1);
      }
    }

    try {
      const data = JSON.parse(cleaned);
      return { success: true, data };
    } catch (err) {
      return {
        success: false,
        error: `Malformed JSON syntax: ${(err as Error).message}`,
      };
    }
  }

  /**
   * Validates and sanitizes ProjectAnalysis output from AI
   */
  public static validateAnalysis(
    raw: unknown,
    fallbackSpec?: Partial<ProjectSpecification>,
  ): ValidationReport<ProjectAnalysis> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let recovered = false;

    if (!raw || typeof raw !== 'object') {
      return {
        isValid: false,
        sanitized: this.createEmptyAnalysis(fallbackSpec?.name || 'Untitled'),
        errors: ['AI analysis payload is not an object.'],
        warnings: ['Initialized empty default analysis due to invalid AI payload.'],
        recovered: true,
      };
    }

    const obj = raw as Record<string, unknown>;

    // 1. Validate Questions
    const questions: AnalysisQuestion[] = [];
    if (Array.isArray(obj.questions)) {
      obj.questions.forEach((q: unknown, index: number) => {
        if (!q || typeof q !== 'object') {
          warnings.push(`Discarded malformed question at index ${index}.`);
          recovered = true;
          return;
        }
        const qObj = q as Record<string, unknown>;
        const id = typeof qObj.id === 'string' && qObj.id.trim() ? qObj.id.trim() : `q_${index + 1}`;
        const question = typeof qObj.question === 'string' ? qObj.question.trim() : '';

        if (!question) {
          warnings.push(`Question ${id} had empty text and was dropped.`);
          recovered = true;
          return;
        }

        const validCategories = ['scope', 'architecture', 'testing', 'security', 'deployment'];
        const category =
          typeof qObj.category === 'string' && validCategories.includes(qObj.category)
            ? (qObj.category as AnalysisQuestion['category'])
            : 'scope';

        // Check contradictory values: isBlocking cannot be true without an actionable impact
        let isBlocking = Boolean(qObj.isBlocking);
        let impact = typeof qObj.impact === 'string' ? qObj.impact.trim() : '';
        if (isBlocking && !impact) {
          impact = 'Essential architectural clarification required before harness code generation.';
          warnings.push(`Question ${id} marked blocking without impact explanation. Added default impact.`);
          recovered = true;
        }

        questions.push({
          id,
          category,
          question,
          context: typeof qObj.context === 'string' ? qObj.context.trim() : 'Clarification needed',
          suggestedAnswer: typeof qObj.suggestedAnswer === 'string' ? qObj.suggestedAnswer.trim() : undefined,
          isBlocking,
          impact,
        });
      });
    } else {
      warnings.push('AI response missing questions array; initialized empty list.');
      recovered = true;
    }

    // 2. Validate Recommendations
    const recommendations: FeatureRecommendation[] = [];
    if (Array.isArray(obj.recommendations)) {
      obj.recommendations.forEach((r: unknown, index: number) => {
        if (!r || typeof r !== 'object') return;
        const rObj = r as Record<string, unknown>;
        const id = typeof rObj.id === 'string' && rObj.id.trim() ? rObj.id.trim() : `rec_${index + 1}`;
        const title = typeof rObj.title === 'string' ? rObj.title.trim() : '';
        if (!title) return;

        const validImpacts = ['critical', 'high', 'medium', 'low'];
        const impact =
          typeof rObj.impact === 'string' && validImpacts.includes(rObj.impact)
            ? (rObj.impact as FeatureRecommendation['impact'])
            : 'medium';

        recommendations.push({
          id,
          title,
          description: typeof rObj.description === 'string' ? rObj.description.trim() : '',
          rationale: typeof rObj.rationale === 'string' ? rObj.rationale.trim() : 'Recommended for architectural stability',
          impact,
          subsystemAffected: typeof rObj.subsystemAffected === 'string' ? rObj.subsystemAffected.trim() : 'State',
          suggestedByAI: true,
          accepted: false,
        });
      });
    }

    // 3. Validate Suggestions
    const suggestions: ArchitectureSuggestion[] = [];
    if (Array.isArray(obj.suggestions)) {
      obj.suggestions.forEach((s: unknown, index: number) => {
        if (!s || typeof s !== 'object') return;
        const sObj = s as Record<string, unknown>;
        const id = typeof sObj.id === 'string' && sObj.id.trim() ? sObj.id.trim() : `sug_${index + 1}`;
        const topic = typeof sObj.topic === 'string' ? sObj.topic.trim() : '';
        if (!topic) return;

        suggestions.push({
          id,
          topic,
          recommendation: typeof sObj.recommendation === 'string' ? sObj.recommendation.trim() : '',
          pros: Array.isArray(sObj.pros) ? (sObj.pros.filter((p) => typeof p === 'string') as string[]) : [],
          cons: Array.isArray(sObj.cons) ? (sObj.cons.filter((c) => typeof c === 'string') as string[]) : [],
          applied: false,
        });
      });
    }

    // 4. Validate Assumptions & Risks
    const assumptions = Array.isArray(obj.assumptions)
      ? (obj.assumptions.filter((a) => typeof a === 'string' && a.trim().length > 0) as string[])
      : ['Local execution environment assumed.'];

    const risks = Array.isArray(obj.risks)
      ? (obj.risks.filter((r) => typeof r === 'string' && r.trim().length > 0) as string[])
      : [];

    // 5. Validate Level Recommendation
    const validLevels: HarnessLevel[] = ['basic', 'medium', 'advanced'];
    let recommendedHarnessLevel: HarnessLevel = 'medium';
    if (typeof obj.recommendedHarnessLevel === 'string' && validLevels.includes(obj.recommendedHarnessLevel as HarnessLevel)) {
      recommendedHarnessLevel = obj.recommendedHarnessLevel as HarnessLevel;
    } else {
      warnings.push('AI response had missing or invalid recommendedHarnessLevel; defaulted to "medium".');
      recovered = true;
    }

    const sanitized: ProjectAnalysis = {
      specId: typeof obj.specId === 'string' ? obj.specId : `spec_${Date.now()}`,
      providerId: typeof obj.providerId === 'string' ? obj.providerId : 'ai-validator-sanitized',
      analyzedAt: typeof obj.analyzedAt === 'string' ? obj.analyzedAt : new Date().toISOString(),
      recommendedHarnessLevel,
      recommendedLevel: recommendedHarnessLevel,
      confidenceScore: typeof obj.confidenceScore === 'number' ? obj.confidenceScore : 85,
      understoodRequirements: Array.isArray(obj.understoodRequirements) ? (obj.understoodRequirements as string[]) : [],
      missingInformation: Array.isArray(obj.missingInformation) ? (obj.missingInformation as string[]) : [],
      ambiguities: Array.isArray(obj.ambiguities) ? (obj.ambiguities as string[]) : [],
      suggestedFields: Array.isArray(obj.suggestedFields) ? (obj.suggestedFields as any[]) : [],
      followUpQuestions: questions,
      questions,
      recommendations,
      suggestions,
      assumptions,
      risks,
    };

    return {
      isValid: errors.length === 0,
      sanitized,
      errors,
      warnings,
      recovered,
    };
  }

  /**
   * Validate and enforce security rules on generated file artifacts
   */
  public static validateArtifacts(files: unknown[]): ValidationReport<GeneratedFile[]> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let recovered = false;
    const sanitizedFiles: GeneratedFile[] = [];
    const seenPaths = new Set<string>();

    if (!Array.isArray(files)) {
      return {
        isValid: false,
        sanitized: [],
        errors: ['Generated artifacts payload must be an array.'],
        warnings: [],
        recovered: false,
      };
    }

    for (let i = 0; i < files.length; i++) {
      const item = files[i];
      if (!item || typeof item !== 'object') {
        warnings.push(`Artifact at index ${i} is not a valid object; dropped.`);
        recovered = true;
        continue;
      }

      const fileObj = item as Record<string, unknown>;
      let pathStr = typeof fileObj.path === 'string' ? fileObj.path.trim() : '';

      // Path Security Checks
      if (!pathStr) {
        errors.push(`Artifact at index ${i} has empty path.`);
        continue;
      }

      // Block path traversal attacks
      if (pathStr.includes('../') || pathStr.includes('..\\')) {
        errors.push(`Artifact path "${pathStr}" contains illegal path traversal ("..").`);
        continue;
      }

      // Block root or absolute paths
      if (pathStr.startsWith('/') || pathStr.startsWith('\\') || /^[a-zA-Z]:/.test(pathStr)) {
        errors.push(`Artifact path "${pathStr}" cannot be absolute.`);
        continue;
      }

      // Block null bytes or illegal control characters
      if (/[\x00-\x1f\x7f]/.test(pathStr)) {
        errors.push(`Artifact path "${pathStr}" contains prohibited control characters.`);
        continue;
      }

      // Standardize forward slashes
      pathStr = pathStr.replace(/\\/g, '/');

      // Detect duplicate paths
      if (seenPaths.has(pathStr)) {
        errors.push(`Duplicate artifact path detected: "${pathStr}".`);
        continue;
      }
      seenPaths.add(pathStr);

      // Validate content
      let content = typeof fileObj.content === 'string' ? fileObj.content : '';
      if (!content && content !== '') {
        warnings.push(`Artifact "${pathStr}" content was coerced from non-string.`);
        content = String(fileObj.content ?? '');
        recovered = true;
      }

      const linesCount = content ? content.split('\n').length : 0;
      const sizeBytes = new Blob([content]).size;

      sanitizedFiles.push({
        id: typeof fileObj.id === 'string' ? fileObj.id : `gen_file_${i}`,
        path: pathStr,
        filename: pathStr.split('/').pop() || pathStr,
        content,
        linesCount,
        sizeBytes,
        subsystem: typeof fileObj.subsystem === 'string' ? (fileObj.subsystem.toLowerCase() as SubsystemType) : 'instructions',
        category: typeof fileObj.category === 'string' ? (fileObj.category as ArtifactCategory) : 'instruction',
        fileType: typeof fileObj.fileType === 'string' ? (fileObj.fileType as ArtifactFileType) : 'markdown',
        generatedAt: new Date().toISOString(),
        isExecutable: Boolean(fileObj.isExecutable),
      });
    }

    return {
      isValid: errors.length === 0,
      sanitized: sanitizedFiles,
      errors,
      warnings,
      recovered,
    };
  }

  /**
   * Validates ProjectSpecification to prevent contradictory configurations
   */
  public static validateSpecification(spec: ProjectSpecification): { isValid: boolean; issues: string[] } {
    const issues: string[] = [];

    if (!spec.name || spec.name.trim().length === 0) {
      issues.push('Project name cannot be empty.');
    }

    if (!spec.description || spec.description.trim().length === 0) {
      issues.push('Project description cannot be empty.');
    }

    const validTypes: ProjectType[] = ['web', 'desktop', 'service', 'library', 'cli', 'mobile', 'api', 'other'];
    if (!validTypes.includes(spec.projectType)) {
      issues.push(`Invalid project type: "${spec.projectType}".`);
    }

    const validLevels: HarnessLevel[] = ['basic', 'medium', 'advanced'];
    if (!validLevels.includes(spec.targetHarnessLevel)) {
      issues.push(`Invalid harness level: "${spec.targetHarnessLevel}".`);
    }

    // Contradictory values: monorepo without multiple modules/platforms
    if (spec.expectedPlatforms && spec.expectedPlatforms.includes('monorepo') && spec.expectedPlatforms.length <= 1) {
      issues.push('Monorepo platform specified but fewer than 2 target platforms declared.');
    }

    // Multi-agent enabled on basic level is contradictory
    if (spec.multiAgentEnabled && spec.targetHarnessLevel === 'basic') {
      issues.push('Multi-agent coordination requires at least "medium" or "advanced" harness level.');
    }

    return {
      isValid: issues.length === 0,
      issues,
    };
  }

  private static createEmptyAnalysis(projectName: string): ProjectAnalysis {
    return {
      specId: `spec_${Date.now()}`,
      providerId: 'fallback-sanitizer',
      analyzedAt: new Date().toISOString(),
      recommendedHarnessLevel: 'medium',
      recommendedLevel: 'medium',
      confidenceScore: 80,
      understoodRequirements: [],
      missingInformation: [],
      ambiguities: [],
      assumptions: ['Local development environment assumption applied.'],
      suggestedFields: [],
      followUpQuestions: [
        {
          id: 'q_clarify_scope',
          category: 'scope',
          question: `What are the core technical constraints and boundaries for ${projectName}?`,
          context: 'Required to construct deterministic scope rules for AI coding agents.',
          isBlocking: false,
          impact: 'Ensures AI coding sessions do not modify out-of-scope files.',
        },
      ],
      questions: [
        {
          id: 'q_clarify_scope',
          category: 'scope',
          question: `What are the core technical constraints and boundaries for ${projectName}?`,
          context: 'Required to construct deterministic scope rules for AI coding agents.',
          isBlocking: false,
          impact: 'Ensures AI coding sessions do not modify out-of-scope files.',
        },
      ],
      recommendations: [],
      suggestions: [],
      risks: [],
    };
  }
}
