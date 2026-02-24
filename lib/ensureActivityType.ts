import { prisma } from '@/lib/prisma';
import { getActivityTheme } from './activityTypeTheme';

/**
 * Ensure an activity type exists for a given code. If it does not, create it with sensible defaults.
 * This is a lightweight helper meant to be called before logging a new user_activity item.
 * It is safe for concurrent calls due to unique constraint on code (uses upsert fallback).
 */
export async function ensureActivityType(code: string, options?: {
  name?: string;
  description?: string;
  category?: string;
  priority?: number;
  weight?: number;
  icon?: string;
  color?: string;
}) {
  const normalized = code.trim().toUpperCase();
  if (!normalized) throw new Error('Activity type code required');

  // Try fast path first
  const existing = await prisma.activity_types.findUnique({ where: { code: normalized } });
  if (existing) return existing;

  const theme = getActivityTheme(normalized);

  // Use upsert to avoid race condition
  const createData: any = {
    code: normalized,
    name: options?.name || normalized.replace(/_/g, ' ').toLowerCase().replace(/\b\w/g, c => c.toUpperCase()),
    description: options?.description || `Auto-generated activity type for ${normalized}`,
    category: options?.category || 'general',
    icon: options?.icon || theme.icon,
    color: options?.color || theme.color,
    is_sensitive: false,
    requires_approval: false,
    is_active: true
  };

  // Assign only if columns exist (after manual SQL + regenerate). Using loose typing to avoid build break before regenerate.
  createData.priority = typeof options?.priority === 'number' ? options.priority : theme.priority || 100;
  createData.weight = typeof options?.weight === 'number' ? options.weight : 0;

  return prisma.activity_types.upsert({
    where: { code: normalized },
    update: {},
    create: createData
  });
}

/** Convenience bulk ensure for multiple codes */
export async function ensureActivityTypes(codes: string[]) {
  const results = [];
  for (const c of codes) {
    results.push(await ensureActivityType(c));
  }
  return results;
}