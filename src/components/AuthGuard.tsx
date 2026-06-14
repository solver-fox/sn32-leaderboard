'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { Layout } from '@/components/Layout';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  const loadUser = useAuthStore((s) => s.loadUser);
  const router = useRouter();

  useEffect(() => {
    loadUser();
  }, [loadUser]);

  useEffect(() => {
    if (token === null) {
      const stored = localStorage.getItem('token');
      if (!stored) router.replace('/login');
    }
  }, [token, router]);

  if (!token && typeof window !== 'undefined' && !localStorage.getItem('token')) {
    return null;
  }

  return <Layout>{children}</Layout>;
}
