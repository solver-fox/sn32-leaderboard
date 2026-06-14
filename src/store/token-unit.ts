'use client';

import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import { TokenUnit } from '@/lib/token-format';

interface TokenUnitState {
  unit: TokenUnit;
  setUnit: (unit: TokenUnit) => void;
}

export const useTokenUnitStore = create<TokenUnitState>()(
  persist(
    (set) => ({
      unit: 'tao',
      setUnit: (unit) => set({ unit }),
    }),
    { name: 'sn32-token-unit' },
  ),
);
