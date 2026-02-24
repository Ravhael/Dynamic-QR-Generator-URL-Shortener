"use client";
import { useEffect, useState } from 'react';

export default function VerifyEmailPage() {
  const [status, setStatus] = useState<'pending'|'success'|'error'>('pending');
  const [message, setMessage] = useState('Memverifikasi email...');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const email = params.get('email');
    if (!token || !email) {
      setStatus('error');
      setMessage('Token atau email tidak ditemukan.');
      return;
    }
    (async () => {
      try {
        const res = await fetch('/api/auth/verify-email', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ token, email }) });
        const data = await res.json();
        if (res.ok && data.success) {
          setStatus('success');
          setMessage('Email berhasil diverifikasi. Anda bisa menutup halaman ini.');
        } else {
          setStatus('error');
          setMessage(data.message || 'Verifikasi gagal');
        }
      } catch (e:any) {
        setStatus('error');
        setMessage(e.message || 'Terjadi kesalahan');
      }
    })();
  }, []);

  return (
    <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50 dark:bg-gray-900">
      <div className="max-w-md w-full bg-white dark:bg-gray-800 rounded-lg shadow p-6 text-center space-y-4">
        <h1 className="text-xl font-semibold">Verifikasi Email</h1>
        <p className={status==='error'? 'text-red-600 dark:text-red-400' : status==='success' ? 'text-green-600 dark:text-green-400' : 'text-gray-600 dark:text-gray-300'}>{message}</p>
        {status==='success' && <a href="/dashboard" className="inline-block px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">Ke Dashboard</a>}
        {status==='error' && <a href="/login" className="inline-block px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700">Kembali</a>}
      </div>
    </div>
  );
}
