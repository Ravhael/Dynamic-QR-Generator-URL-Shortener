import { ZodError } from 'zod';

export interface FormattedZodIssue {
  path: string;
  message: string;
  code: string;
}

export interface FormattedZodError {
  summary: string;
  count: number;
  issues: FormattedZodIssue[];
}

export function formatZodError(error: unknown): FormattedZodError | null {
  if (!(error instanceof ZodError)) return null;
  const issues: FormattedZodIssue[] = error.issues.map(i => ({
    path: i.path.join('.') || '(root)',
    message: i.message,
    code: i.code
  }));
  return {
    summary: `${issues.length} validation error${issues.length !== 1 ? 's' : ''}`,
    count: issues.length,
    issues
  };
}

export function stringifyZodIssues(f: FormattedZodError | null): string {
  if (!f) return '';
  return f.issues.map(i => `${i.path}: ${i.message}`).join('\n');
}
