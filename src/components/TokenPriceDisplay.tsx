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
    <div className="flex items-center gap-2 text-[11px] text-slate-400 sm:gap-4 sm:text-xs">
      <div className="flex items-center gap-1.5" title="TAO price (USD)">
        <span className="font-medium text-slate-500">τ</span>
        <span className="font-semibold text-slate-200">{formatUsd(prices.taoUsd)}</span>
      </div>
      <span className="text-slate-600">·</span>
      <div
        className="flex items-center gap-1.5"
        title={`SN32 Alpha · ${formatUsd(prices.alphaUsd, 4)} · ${formatTau(prices.alphaTao)} per α`}
      >
        <span className="font-medium text-slate-500">α</span>
        <span className="hidden font-semibold text-slate-200 sm:inline">{formatUsd(prices.alphaUsd, 4)}</span>
        <span className="font-semibold text-slate-200 sm:hidden">{formatUsd(prices.alphaUsd, 2)}</span>
        <span className="hidden text-slate-500 sm:inline">({formatTau(prices.alphaTao)}/α)</span>
      </div>
    </div>
  );
}
