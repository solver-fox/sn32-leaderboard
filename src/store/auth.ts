'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { api, AuthResponse, User } from '@/lib/api-client';

interface AuthState {
  token: string | null;
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  setAuth: (data: AuthResponse) => void;
  logout: () => void;
  loadUser: () => Promise<void>;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      token: null,
      user: null,
      login: async (email, password) => {
        const data = await api.post<AuthResponse>('/auth/login', { email, password });
        localStorage.setItem('token', data.token);
        set({ token: data.token, user: data.user });
      },
      register: async (email, password, name) => {
        const data = await api.post<AuthResponse>('/auth/register', { email, password, name });
        localStorage.setItem('token', data.token);
        set({ token: data.token, user: data.user });
      },
      setAuth: (data) => {
        localStorage.setItem('token', data.token);
        set({ token: data.token, user: data.user });
      },
      logout: () => {
        localStorage.removeItem('token');
        set({ token: null, user: null });
      },
      loadUser: async () => {
        if (!get().token) return;
        try {
          const user = await api.get<User>('/auth/me');
          set({ user });
        } catch {
          get().logout();
        }
      },
    }),
    {
      name: 'sn32-auth',
      partialize: (s) => ({ token: s.token, user: s.user }),
      onRehydrateStorage: () => (state) => {
        if (state?.token) localStorage.setItem('token', state.token);
      },
    },
  ),
);
