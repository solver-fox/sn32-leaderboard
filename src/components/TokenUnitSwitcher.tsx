'use client';

import { useTokenUnitStore } from '@/store/token-unit';
import { TokenUnit } from '@/lib/token-format';

const UNITS: { id: TokenUnit; label: string }[] = [
  { id: 'tao', label: 'TAO' },
  { id: 'usd', label: 'USD' },
  { id: 'alpha', label: 'Alpha' },
];

export function TokenUnitSwitcher({ compact = false }: { compact?: boolean }) {
  const unit = useTokenUnitStore((s) => s.unit);
  const setUnit = useTokenUnitStore((s) => s.setUnit);

  return (
    <div
      className={`inline-flex rounded-lg border border-surface-border bg-slate-900/60 p-0.5 ${
        compact ? '' : ''
      }`}
      role="group"
      aria-label="Token display unit"
    >
      {UNITS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => setUnit(id)}
          className={`rounded-md px-3 py-1.5 text-xs font-medium transition ${
            unit === id
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-400 hover:text-slate-200'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
