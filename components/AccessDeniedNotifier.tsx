"use client";
import { useEffect } from 'react';
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { useToast } from '@/hooks/use-toast';
import { accessDeniedMessage } from '@/lib/accessMessages';

export function AccessDeniedNotifier() {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const { toast } = useToast();

  useEffect(() => {
    if (searchParams.get('denied') === '1') {
      const from = searchParams.get('from') || undefined;
      toast(accessDeniedMessage(from));
      // Remove query params to avoid toast repetition
      const newParams = new URLSearchParams(searchParams.toString());
      newParams.delete('denied');
      if (from) newParams.delete('from');
      const qs = newParams.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname);
    }
  }, [searchParams, pathname, router, toast]);

  return null;
}
