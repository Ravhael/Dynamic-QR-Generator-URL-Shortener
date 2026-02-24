import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Providers } from "@/components/providers/root-providers"
import { AccessDeniedNotifier } from "@/components/AccessDeniedNotifier"
import { loadSystemConfig } from '@/lib/systemConfig';
import { GAInjector } from '@/components/Analytics/GAInjector';
import { getEffectiveUserSettings } from '@/lib/userSettingsCache';
import { getServerSession } from 'next-auth';

const inter = Inter({ subsets: ["latin"] })

export async function generateMetadata(): Promise<Metadata> {
  // Try to derive a better title from user settings (first user) or fallback to system defaults
  let title = 'QR Code & URL Management Platform';
  let description = 'Comprehensive QR code generation and URL shortening platform with analytics';
  try {
    const cfg = await loadSystemConfig();
    if (cfg && (cfg as any).siteName) title = (cfg as any).siteName;
  } catch {}
  return { title, description };
}

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  // Attempt to pull user-specific branding (first authenticated session if any)
  let brandingName: string | null = null;
  try {
    // getServerSession only works if next-auth configured; ignore failures
    // @ts-ignore
    const session = await getServerSession();
    const userId = (session as any)?.user?.id;
    if (userId) {
      const eff = await getEffectiveUserSettings(userId);
      if (eff?.site_name && eff.enable_branding) brandingName = eff.site_name;
    }
  } catch {}
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
  {/* GA per-user (if enabled) */}
  <GAInjector />
      </head>
      <body className={inter.className}>
        <Providers>
          <AccessDeniedNotifier />
          {brandingName && (
            <div className="px-4 py-2 text-sm text-gray-600 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <span className="font-semibold">{brandingName}</span>
              <span className="opacity-60">Dashboard</span>
            </div>
          )}
          {children}
        </Providers>
      </body>
    </html>
  );
}
