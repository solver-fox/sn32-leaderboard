'use client';

import { useTokenMetrics } from '@/hooks/useTokenMetrics';

function formatUsd(value: number, digits = 2) {
  if (!value || value <= 0) return '—';
  return value.toLocaleString(undefined, {
    style: 'currency',
    currency: 'USD',
    maximumFractionDigits: digits,
    minimumFractionDigits: Math.min(digits, 2),
  });
}

function formatTau(value: number) {
  if (!value || value <= 0) return '—';
  return `${value.toLocaleString(undefined, { maximumFractionDigits: 6 })} τ`;
}

export function TokenPriceDisplay() {
  const { prices } = useTokenMetrics();

  return (
    <div className="hidden items-center gap-2 rounded-xl border border-surface-border bg-surface-elevated/60 px-3 py-1.5 sm:flex lg:gap-3">
      <div className="flex items-center gap-1.5" title="TAO price (USD)">
        <span className="badge-brand px-1.5 py-0 text-[10px]">τ</span>
        <span className="font-mono text-xs font-medium text-slate-200">{formatUsd(prices.taoUsd)}</span>
      </div>
      <span className="text-slate-700">|</span>
      <div
        className="flex items-center gap-1.5"
        title={`SN32 Alpha · ${formatUsd(prices.alphaUsd, 4)} · ${formatTau(prices.alphaTao)}/α`}
      >
        <span className="rounded-md bg-accent/15 px-1.5 py-0 text-[10px] font-semibold text-accent ring-1 ring-accent/25">
          α
        </span>
        <span className="font-mono text-xs font-medium text-slate-200">{formatUsd(prices.alphaUsd, 4)}</span>
      </div>
    </div>
  );
}
