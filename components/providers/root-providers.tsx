'use client';

import { PropsWithChildren } from 'react';
import { ThemeProvider } from '@/components/theme-provider';
import { AuthProvider } from '@/components/contexts/AuthContext';
import { ToastProvider } from '@/components/contexts/ToastContext';
import AuthSessionProvider from '@/components/providers/auth-session';
import ErrorBoundary from '@/components/ErrorBoundary';

export function Providers({ children }: PropsWithChildren) {
  return (
    <ErrorBoundary level="global">
      <AuthSessionProvider>
        <ThemeProvider 
          attribute="class" 
          defaultTheme="system" 
          enableSystem 
          disableTransitionOnChange
        >
          <ToastProvider>
            <AuthProvider>
              {children}
            </AuthProvider>
          </ToastProvider>
        </ThemeProvider>
      </AuthSessionProvider>
    </ErrorBoundary>
  );
}