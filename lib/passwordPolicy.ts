// Lightweight password strength policy enforcement.
// Policy levels: weak | medium | strong
// This avoids heavy deps (zxcvbn) while giving basic complexity gates.

export type PasswordPolicyLevel = 'weak' | 'medium' | 'strong';

export interface PasswordValidationResult {
  valid: boolean;
  errors: string[];
  level: PasswordPolicyLevel;
  length: number;
  classes: { lower: boolean; upper: boolean; digit: boolean; symbol: boolean };
}

const SYMBOL_REGEX = /[^A-Za-z0-9]/;

function classify(password: string) {
  return {
    lower: /[a-z]/.test(password),
    upper: /[A-Z]/.test(password),
    digit: /[0-9]/.test(password),
    symbol: SYMBOL_REGEX.test(password)
  };
}

export function validatePassword(password: string, level: PasswordPolicyLevel = 'medium'): PasswordValidationResult {
  const errors: string[] = [];
  const classes = classify(password);
  const length = password.length;
  const classCount = Object.values(classes).filter(Boolean).length;

  // Base requirements per level
  switch (level) {
    case 'weak':
      if (length < 6) errors.push('Must be at least 6 characters');
      break;
    case 'medium':
      if (length < 8) errors.push('Must be at least 8 characters');
      if (classCount < 2) errors.push('Use at least two character types (lower/upper/digit/symbol)');
      break;
    case 'strong':
      if (length < 12) errors.push('Must be at least 12 characters');
      if (classCount < 3) errors.push('Use at least three character types (lower/upper/digit/symbol)');
      if (!classes.symbol) errors.push('Include at least one symbol');
      break;
  }

  // Simple forbidden list (can be extended)
  const lower = password.toLowerCase();
  const common = ['password', '123456', 'qwerty', 'letmein', 'admin'];
  if (common.includes(lower)) errors.push('Password is too common');

  return { valid: errors.length === 0, errors, level, length, classes };
}

export function passwordPolicyDescription(level: PasswordPolicyLevel): string[] {
  switch (level) {
    case 'weak':
      return ['Min 6 chars'];
    case 'medium':
      return ['Min 8 chars', 'At least 2 of: lower, upper, digit, symbol'];
    case 'strong':
      return ['Min 12 chars', 'At least 3 of: lower, upper, digit, symbol', 'At least 1 symbol'];
    default:
      return [];
  }
}
