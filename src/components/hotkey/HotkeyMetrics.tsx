'use client';

import { useMemo } from 'react';
import { StatCard } from '@/components/Layout';
import { SortableColumn, SortableTable } from '@/components/SortableTable';
import { MetricHistory, formatNumber, formatWeight } from '@/lib/api-client';

export function HotkeyEvalStats({ current }: { current: MetricHistory['current'] }) {
  return (
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
      <StatCard label="Weight" value={formatWeight(current.weight)} />
      <StatCard label="Reward" value={formatNumber(current.reward)} />
      <StatCard label="FP Score" value={formatNumber(current.fp)} />
      <StatCard label="F1 Score" value={formatNumber(current.f1)} />
      <StatCard label="AP Score" value={formatNumber(current.ap)} />
    </div>
  );
}

export const METRIC_RANGES = ['24h', '7d', '30d', '90d', 'all'] as const;
export type MetricRange = (typeof METRIC_RANGES)[number];

export function MetricRangePicker({
  range,
  onChange,
}: {
  range: MetricRange;
  onChange: (range: MetricRange) => void;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="section-title mr-1">Range</span>
      {METRIC_RANGES.map((r) => (
        <button
          key={r}
          type="button"
          className={`rounded-xl px-3 py-1.5 text-xs font-medium transition ${
            range === r
              ? 'bg-brand-600 text-white ring-1 ring-brand-500/40'
              : 'border border-surface-border bg-surface-elevated/60 text-slate-600 hover:border-slate-300 hover:text-slate-900 dark:text-slate-400 dark:hover:border-slate-500/40 dark:hover:text-slate-200'
          }`}
          onClick={() => onChange(r)}
        >
          {r === 'all' ? 'All' : r.toUpperCase()}
        </button>
      ))}
    </div>
  );
}

export function formatMetricTimestamp(ts: string) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

type HistoryRow = MetricHistory['history'][number];

export function HotkeyHistoryTable({
  history,
  compact = false,
}: {
  history: MetricHistory['history'];
  compact?: boolean;
}) {
  const rows = [...history].reverse();

  const columns = useMemo<SortableColumn<HistoryRow>[]>(
    () => [
      {
        id: 'time',
        label: 'Time',
        cellClassName: 'whitespace-nowrap font-mono text-xs text-slate-500',
        render: (row) => formatMetricTimestamp(row.timestamp),
      },
      {
        id: 'weight',
        label: 'Weight',
        cellClassName: 'font-mono text-xs',
        render: (row) => formatWeight(row.weight),
      },
      {
        id: 'reward',
        label: 'Reward',
        render: (row) => formatNumber(row.reward),
      },
      {
        id: 'fp',
        label: 'FP',
        render: (row) => formatNumber(row.fp),
      },
      {
        id: 'f1',
        label: 'F1',
        render: (row) => formatNumber(row.f1),
      },
      {
        id: 'ap',
        label: 'AP',
        render: (row) => formatNumber(row.ap),
      },
      {
        id: 'rank',
        label: 'Rank',
        render: (row) => row.rank ?? '—',
      },
    ],
    [],
  );

  if (rows.length === 0) {
    return (
      <p className="px-4 py-10 text-center text-sm text-slate-500">
        No score changes in this range. Trigger a sync in Settings to collect history.
      </p>
    );
  }

  return (
    <div className={`overflow-x-auto ${compact ? 'max-h-[420px] overflow-y-auto' : ''}`}>
      <SortableTable
        tableId="hotkey-history"
        columns={columns}
        defaultOrder={['time', 'weight', 'reward', 'fp', 'f1', 'ap', 'rank']}
        data={rows}
        getRowKey={(row) => row.timestamp}
        minWidth="640px"
        theadClassName="sticky top-0 z-[1] bg-slate-100/95 backdrop-blur-sm dark:bg-slate-900/95"
      />
    </div>
  );
}
