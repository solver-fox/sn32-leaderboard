'use client';

import { useTokenUnitStore } from '@/store/token-unit';
import { TokenUnit } from '@/lib/token-format';

const UNITS: { id: TokenUnit; label: string }[] = [
  { id: 'tao', label: 'TAO' },
  { id: 'usd', label: 'USD' },
  { id: 'alpha', label: 'Alpha' },
];

export function TokenUnitSwitcher() {
  const unit = useTokenUnitStore((s) => s.unit);
  const setUnit = useTokenUnitStore((s) => s.setUnit);

  return (
    <div
      className="inline-flex rounded-xl border border-surface-border bg-surface-elevated/80 p-1"
      role="group"
      aria-label="Token display unit"
    >
      {UNITS.map(({ id, label }) => (
        <button
          key={id}
          type="button"
          onClick={() => setUnit(id)}
          className={`rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            unit === id
              ? 'bg-brand-600 text-white shadow-sm'
              : 'text-slate-500 hover:text-slate-300'
          }`}
        >
          {label}
        </button>
      ))}
    </div>
  );
}
