import { NextRequest, NextResponse } from 'next/server';
import { loadSystemConfig } from '@/lib/systemConfig';

/**
 * Generic helper to enforce max upload size using configured maxUploadSizeBytes.
 * For multipart/form-data, relies on File objects after request.formData().
 * For other uploads (e.g. raw binary) you must measure bytes separately before calling.
 */
export async function enforceFileSize(file: File, label: string) {
  const cfg = await loadSystemConfig();
  if (file.size > cfg.maxUploadSizeBytes) {
    const mb = (cfg.maxUploadSizeBytes / (1024 * 1024)).toFixed(2);
    return NextResponse.json({ _error: `${label} terlalu besar. Maksimal ${mb}MB.` }, { status: 400 });
  }
  return null;
}

/**
 * Check Content-Length (best-effort) before fully reading body.
 * Returns a response if limit exceeded, otherwise null to continue.
 */
export async function preflightContentLengthGuard(req: NextRequest) {
  const lenHeader = req.headers.get('content-length');
  if (!lenHeader) return null;
  const length = Number(lenHeader);
  if (Number.isNaN(length) || length <= 0) return null;
  const cfg = await loadSystemConfig();
  if (length > cfg.maxUploadSizeBytes) {
    const mb = (cfg.maxUploadSizeBytes / (1024 * 1024)).toFixed(2);
    return NextResponse.json({ _error: `Payload terlalu besar (> ${mb}MB).` }, { status: 413 });
  }
  return null;
}
