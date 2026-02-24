"use client";
import React, { useState } from 'react';
import Link from 'next/link';

interface InitResponse { secret: string; otpauth: string }

export default function Enable2FAPage() {
  const [secret, setSecret] = useState<string | null>(null);
  const [otpauth, setOtpauth] = useState<string | null>(null);
  const [code, setCode] = useState('');
  const [status, setStatus] = useState<'idle'|'init'|'verifying'|'enabled'|'error'|'disabled'>('idle');
  const [message, setMessage] = useState<string | null>(null);
  const [alreadyEnabled, setAlreadyEnabled] = useState(false);

  async function start() {
    setStatus('init');
    setMessage(null);
    const res = await fetch('/api/account/2fa/init', { method: 'POST' });
    const data = await res.json();
    if (data.alreadyEnabled) { setAlreadyEnabled(true); setStatus('idle'); return; }
    if (!res.ok) { setStatus('error'); setMessage(data._error || 'Failed to init'); return; }
    setSecret(data.secret); setOtpauth(data.otpauth); setStatus('idle');
  }

  function buildQrDataUrl() {
    if (!otpauth) return null;
    // For now use third-party chart API (client side) — alternatively implement local QR generator component already present in repo.
    return `https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(otpauth)}`;
  }

  async function verify() {
    if (!secret || code.trim().length < 6) return;
    setStatus('verifying'); setMessage(null);
    const res = await fetch('/api/account/2fa/verify', { method: 'POST', body: JSON.stringify({ secret, code }) });
    const data = await res.json();
    if (!res.ok || !data.verified) { setStatus('error'); setMessage(data._error || 'Verification failed'); return; }
    setStatus('enabled'); setMessage('Two-factor authentication enabled.');
  }

  async function disable() {
    const codeInput = prompt('Enter current 2FA code to disable:');
    if (!codeInput) return;
    setStatus('verifying');
    const res = await fetch('/api/account/2fa/disable', { method: 'POST', body: JSON.stringify({ code: codeInput }) });
    const data = await res.json();
    if (!res.ok) { setStatus('error'); setMessage(data._error || 'Disable failed'); return; }
    setSecret(null); setOtpauth(null); setCode(''); setAlreadyEnabled(false); setStatus('disabled'); setMessage('2FA disabled');
  }

  return (
    <div className="max-w-xl mx-auto py-10 px-6 space-y-6">
      <h1 className="text-2xl font-semibold">Two-Factor Authentication</h1>
      {message && <div className="text-sm rounded bg-blue-50 border border-blue-200 px-3 py-2 text-blue-700">{message}</div>}
      {alreadyEnabled || status==='enabled' ? (
        <div className="space-y-4">
          <p className="text-green-600 font-medium">Two-factor authentication is enabled.</p>
          <div className="flex gap-3">
            <Link href="/dashboard" className="text-blue-600 underline">Dashboard</Link>
            <button onClick={disable} className="text-red-600 underline">Disable</button>
          </div>
        </div>
      ) : (
        <div className="space-y-6">
          {!secret && (
            <div>
              <p className="text-sm text-gray-600 mb-3">Secure your account by enabling 2FA. You will scan a QR code with an authenticator app and confirm a 6‑digit code.</p>
              <button onClick={start} disabled={status==='init'} className="px-4 py-2 bg-indigo-600 text-white rounded disabled:opacity-50">Generate Secret</button>
            </div>
          )}
          {secret && (
            <div className="space-y-4">
              <div className="flex flex-col items-center gap-3">
                {buildQrDataUrl() && <img src={buildQrDataUrl() || ''} alt="2FA QR" className="border rounded" />}
                <code className="text-xs break-all bg-gray-100 px-2 py-1 rounded">{secret}</code>
                <p className="text-xs text-gray-500">Scan the QR or manually enter the Base32 key above in your authenticator app.</p>
              </div>
              <div className="flex gap-2 items-end">
                <div className="flex flex-col flex-1">
                  <label className="text-xs font-medium mb-1">Enter 6-digit code</label>
                  <input value={code} onChange={e=>setCode(e.target.value)} maxLength={6} className="border rounded px-2 py-1 text-center tracking-widest" />
                </div>
                <button onClick={verify} disabled={status==='verifying' || code.length<6} className="px-4 py-2 bg-green-600 text-white rounded disabled:opacity-50">Verify</button>
              </div>
              <button onClick={()=>{ setSecret(null); setOtpauth(null); setCode(''); }} className="text-xs text-gray-500 underline">Start over</button>
            </div>
          )}
        </div>
      )}
      <div>
        <Link className="text-sm text-gray-500 underline" href="/logout">Sign out</Link>
      </div>
    </div>
  );
}
