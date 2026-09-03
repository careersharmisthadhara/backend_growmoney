// ─────────────────────────────────────────────────────
// VALIDATOR UTILITY
// Pure functions — no class needed
// Validates incoming API request
// ─────────────────────────────────────────────────────

import { ICalculationInput } from '../models/calculation.model';

export interface IValidationResult {
  isValid: boolean;
  errors:  string[];
}

export function validateCalculationInput(
  body: unknown
): IValidationResult {
  const errors: string[] = [];

  // Check body exists
  if (!body || typeof body !== 'object') {
    return { isValid: false, errors: ['Request body is required'] };
  }

  const input = body as Record<string, unknown>;

  // Validate monthly
  if (input.monthly === undefined || input.monthly === null) {
    errors.push('monthly is required');
  } else if (typeof input.monthly !== 'number' || input.monthly < 500 || input.monthly > 10000000) {
    errors.push('monthly must be a number between 500 and 10000000');
  }

  // Validate rate
  if (input.rate === undefined || input.rate === null) {
    errors.push('rate is required');
  } else if (typeof input.rate !== 'number' || input.rate < 1 || input.rate > 30) {
    errors.push('rate must be a number between 1 and 30');
  }

  // Validate years
  if (input.years === undefined || input.years === null) {
    errors.push('years is required');
  } else if (typeof input.years !== 'number' || input.years < 1 || input.years > 40) {
    errors.push('years must be a number between 1 and 40');
  }

  // Validate optional email format
  if (input.email && typeof input.email === 'string') {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(input.email)) {
      errors.push('email format is invalid');
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}