/**
 * Reusable Validation Framework
 * Type-safe validators for specifications, configurations, and repository targets.
 */

import {
  ProjectSpecification,
  ValidationError,
  ValidationResult,
  ValidationRule,
} from '../../domain/models';

export class Validator {
  /**
   * Run a set of rules against a target value
   */
  static validate<T>(value: T, rules: Array<ValidationRule<T>>): ValidationResult {
    const errors: ValidationError[] = [];
    const warnings: ValidationError[] = [];

    for (const rule of rules) {
      const result = rule.validate(value);
      if (result) {
        if (result.severity === 'error') {
          errors.push(result);
        } else {
          warnings.push(result);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors,
      warnings,
      checkedAt: new Date().toISOString(),
    };
  }

  // --- Rule Builders ---

  static required<T>(
    field: string,
    getter: (val: T) => string | undefined | null,
    message?: string,
  ): ValidationRule<T> {
    return {
      name: 'required',
      field,
      validate: (val: T) => {
        const str = getter(val);
        if (!str || str.trim().length === 0) {
          return {
            field,
            message: message || `${field} is required.`,
            rule: 'required',
            severity: 'error',
          };
        }
        return null;
      },
    };
  }

  static minLength<T>(
    field: string,
    min: number,
    getter: (val: T) => string | undefined | null,
    message?: string,
  ): ValidationRule<T> {
    return {
      name: 'minLength',
      field,
      validate: (val: T) => {
        const str = getter(val);
        if (str && str.trim().length < min) {
          return {
            field,
            message: message || `${field} must be at least ${min} characters.`,
            rule: 'minLength',
            severity: 'error',
          };
        }
        return null;
      },
    };
  }

  static nonEmptyList<T>(
    field: string,
    getter: (val: T) => unknown[] | undefined | null,
    message?: string,
    severity: 'error' | 'warning' = 'warning',
  ): ValidationRule<T> {
    return {
      name: 'nonEmptyList',
      field,
      validate: (val: T) => {
        const list = getter(val);
        if (!list || list.length === 0) {
          return {
            field,
            message: message || `${field} should contain at least one item.`,
            rule: 'nonEmptyList',
            severity,
          };
        }
        return null;
      },
    };
  }

  static validGitUrl<T>(
    field: string,
    getter: (val: T) => string | undefined | null,
  ): ValidationRule<T> {
    return {
      name: 'validGitUrl',
      field,
      validate: (val: T) => {
        const url = getter(val);
        if (!url || url.trim().length === 0) return null; // optional if empty
        const gitPattern = /^(https?:\/\/github\.com\/[\w-]+\/[\w.-]+|git@github\.com:[\w-]+\/[\w.-]+)(\.git)?$/;
        if (!gitPattern.test(url.trim())) {
          return {
            field,
            message: 'Must be a valid GitHub repository URL (e.g., https://github.com/owner/repo)',
            rule: 'validGitUrl',
            severity: 'warning',
          };
        }
        return null;
      },
    };
  }

  /**
   * Pre-packaged validator for ProjectSpecification
   */
  static validateProjectSpecification(spec: ProjectSpecification): ValidationResult {
    const rules: Array<ValidationRule<ProjectSpecification>> = [
      this.required('name', (s) => s.name, 'Project name is required.'),
      this.minLength('name', 2, (s) => s.name, 'Project name must be at least 2 characters.'),
      this.required('description', (s) => s.description, 'Project description is required.'),
      this.minLength(
        'description',
        15,
        (s) => s.description,
        'Provide a descriptive brief of at least 15 characters.',
      ),
      this.required(
        'projectType',
        (s) => s.projectType || s.targetPlatform,
        'Project architecture type must be selected.',
      ),
      this.required(
        'preferredTechnology',
        (s) => s.preferredTechnology || s.primaryLanguage,
        'Preferred technology or language must be defined.',
      ),
      this.nonEmptyList(
        'primaryGoals',
        (s) => (s.primaryGoals?.length ? s.primaryGoals : s.coreObjectives),
        'At least one primary goal is recommended for reliable agent guidance.',
        'warning',
      ),
      this.validGitUrl('existingRepoUrl', (s) => s.existingRepoUrl),
    ];

    return this.validate(spec, rules);
  }

}
