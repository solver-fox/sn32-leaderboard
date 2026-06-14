'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { LoadingState } from '@/components/Layout';
import {
  HotkeyEvalStats,
  HotkeyHistoryTable,
  MetricRangePicker,
  MetricRange,
} from '@/components/hotkey/HotkeyMetrics';
import { HotkeyMetricCharts } from '@/components/hotkey/HotkeyMetricCharts';
import { api, Hotkey, MetricHistory, truncateAddress, getHotkeyRegistration } from '@/lib/api-client';

interface HotkeyDashboardProps {
  hotkeyId: string;
  variant: 'panel' | 'full';
  backHref?: string;
}

export function HotkeyDashboard({ hotkeyId, variant, backHref }: HotkeyDashboardProps) {
  const [range, setRange] = useState<MetricRange>('7d');

  const { data: hotkey, isLoading: hotkeyLoading } = useQuery({
    queryKey: ['hotkey', hotkeyId],
    queryFn: () => api.get<Hotkey>(`/hotkeys/${hotkeyId}`),
    enabled: !!hotkeyId,
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics', hotkeyId, range],
    queryFn: () => api.get<MetricHistory>(`/metrics/hotkeys/${hotkeyId}?range=${range}`),
    enabled: !!hotkeyId,
  });

  if (hotkeyLoading || metricsLoading) return <LoadingState />;
  if (!hotkey || !metrics) return null;

  const isPanel = variant === 'panel';

  return (
    <div className={`flex h-full flex-col ${isPanel ? 'min-h-0' : 'space-y-6'}`}>
      <div className={`flex items-start justify-between gap-4 ${isPanel ? 'shrink-0 pb-4' : ''}`}>
        <div className="min-w-0">
          {backHref && (
            <Link href={backHref} className="link-brand inline-flex items-center gap-1 text-sm">
              <span aria-hidden>←</span> Back to hotkeys
            </Link>
          )}
          <h2 className={`font-semibold tracking-tight text-slate-900 dark:text-white ${backHref ? 'mt-2 text-2xl' : isPanel ? 'text-lg' : 'text-2xl'}`}>
            {hotkey.label || 'Hotkey'}
          </h2>
          <p className="truncate font-mono text-xs text-slate-500">{hotkey.address}</p>
          {metrics.current.uid != null && (
            <div className="mt-2 flex flex-wrap gap-2">
              <span className="badge-muted">UID {metrics.current.uid}</span>
              <span className="badge-brand">Rank {metrics.current.rank ?? '—'}</span>
            </div>
          )}
          {(() => {
            const reg = getHotkeyRegistration(hotkey);
            return (
              <p className="text-xs text-slate-500">
                {reg.source === 'subnet' ? 'Registered' : 'Tracked since'} {reg.label} · Age {reg.age}
              </p>
            );
          })()}
        </div>
        {isPanel && (
          <Link
            href={`/hotkeys/${hotkeyId}`}
            className="btn-secondary flex shrink-0 items-center gap-2 px-3 py-2 text-sm"
            title="Open full dashboard"
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="h-4 w-4">
              <path
                fillRule="evenodd"
                d="M3 4.25A2.25 2.25 0 015.25 2h5.5A2.25 2.25 0 0113 4.25v2a.75.75 0 01-1.5 0v-2a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75v-5a.75.75 0 011.5 0v5A2.25 2.25 0 0110.75 18h-5.5A2.25 2.25 0 013 15.75V4.25zM16.25 2A2.25 2.25 0 0118.5 4.25v11.5A2.25 2.25 0 0116.25 18h-5.5a2.25 2.25 0 01-2.25-2.25v-5a.75.75 0 011.5 0v5c0 .414.336.75.75.75h5.5a.75.75 0 00.75-.75V4.25a.75.75 0 00-.75-.75h-5.5a.75.75 0 00-.75.75v2a.75.75 0 01-1.5 0v-2A2.25 2.25 0 0110.75 2h5.5z"
                clipRule="evenodd"
              />
            </svg>
            Full screen
          </Link>
        )}
      </div>

      <section className={isPanel ? 'shrink-0 space-y-3' : 'space-y-3'}>
        {!isPanel && <h3 className="section-title">Current Eval Scores</h3>}
        <HotkeyEvalStats current={metrics.current} />
      </section>

      <div className="shrink-0 my-4">
        <MetricRangePicker range={range} onChange={setRange} />
      </div>

      {!isPanel && <HotkeyMetricCharts history={metrics.history} />}

      <section
        className={`overflow-hidden rounded-2xl border border-surface-border bg-surface-elevated/40 ${isPanel ? 'flex min-h-0 flex-1 flex-col' : 'card p-0'}`}
      >
        <div className="shrink-0 border-b border-surface-border px-4 py-3.5">
          <p className="text-sm font-semibold text-slate-900 dark:text-white">History</p>
          <p className="text-xs text-slate-500">
            Timestamps where weight, reward, FP, F1, AP, or rank changed
          </p>
        </div>
        <HotkeyHistoryTable history={metrics.history} compact={isPanel} />
      </section>
    </div>
  );
}

export function HotkeyListItem({
  hotkey,
  selected,
  onSelect,
  onDelete,
}: {
  hotkey: Hotkey;
  selected: boolean;
  onSelect: () => void;
  onDelete: () => void;
}) {
  const reg = getHotkeyRegistration(hotkey);

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onSelect}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect();
        }
      }}
      className={`group cursor-pointer border-b border-surface-border/60 px-4 py-3.5 transition ${
        selected
          ? 'border-l-2 border-l-brand-500 bg-brand-600/10'
          : 'border-l-2 border-l-transparent hover:bg-slate-100 dark:hover:bg-slate-800/40'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="min-w-0">
          <p className={`truncate text-sm font-medium ${selected ? 'text-brand-700 dark:text-brand-200' : 'text-slate-800 dark:text-slate-200'}`}>
            {hotkey.label || truncateAddress(hotkey.address, 8)}
          </p>
          <p className="truncate font-mono text-[11px] text-slate-500">{truncateAddress(hotkey.address, 10)}</p>
        </div>
        <button
          type="button"
          className="btn-danger shrink-0 text-xs opacity-0 group-hover:opacity-100"
          onClick={(e) => {
            e.stopPropagation();
            onDelete();
          }}
        >
          Delete
        </button>
      </div>
      <div className="mt-2.5 flex flex-wrap gap-1.5">
        <span className="badge-muted">Rank {hotkey.rank ?? '—'}</span>
        <span className="badge-brand">F1 {hotkey.f1 != null ? Number(hotkey.f1).toFixed(3) : '—'}</span>
      </div>
      <div className="mt-1 text-xs text-slate-500">
        {reg.source === 'subnet' ? 'Reg.' : 'Added'} {reg.label} · {reg.age}
      </div>
    </div>
  );
}
