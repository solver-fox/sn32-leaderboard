import { StatCard } from '@/components/Layout';
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
    <div className="flex flex-wrap gap-2">
      {METRIC_RANGES.map((r) => (
        <button
          key={r}
          type="button"
          className={`rounded-lg px-3 py-1.5 text-sm ${
            range === r ? 'bg-brand-600 text-white' : 'bg-surface-card text-slate-400 hover:text-white'
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

export function HotkeyHistoryTable({
  history,
  compact = false,
}: {
  history: MetricHistory['history'];
  compact?: boolean;
}) {
  const rows = [...history].reverse();

  if (rows.length === 0) {
    return (
      <p className="px-4 py-8 text-center text-sm text-slate-500">
        No score changes in this range. Trigger a sync in Settings to collect history.
      </p>
    );
  }

  return (
    <div className={`overflow-x-auto ${compact ? 'max-h-[420px] overflow-y-auto' : ''}`}>
      <table className="w-full min-w-[640px]">
        <thead className="sticky top-0 bg-slate-900/95">
          <tr>
            <th className="table-head">Time</th>
            <th className="table-head">Weight</th>
            <th className="table-head">Reward</th>
            <th className="table-head">FP</th>
            <th className="table-head">F1</th>
            <th className="table-head">AP</th>
            <th className="table-head">Rank</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.timestamp} className="hover:bg-slate-800/30">
              <td className="table-cell whitespace-nowrap text-slate-300">
                {formatMetricTimestamp(row.timestamp)}
              </td>
              <td className="table-cell font-mono text-xs">{formatWeight(row.weight)}</td>
              <td className="table-cell">{formatNumber(row.reward)}</td>
              <td className="table-cell">{formatNumber(row.fp)}</td>
              <td className="table-cell">{formatNumber(row.f1)}</td>
              <td className="table-cell">{formatNumber(row.ap)}</td>
              <td className="table-cell">{row.rank ?? '—'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
