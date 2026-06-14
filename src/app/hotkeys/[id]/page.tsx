'use client';

import { useState } from 'react';
import { useParams } from 'next/navigation';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from 'recharts';
import { AuthGuard } from '@/components/AuthGuard';
import { StatCard, LoadingState } from '@/components/Layout';
import { api, Hotkey, MetricHistory, formatNumber, formatWeight } from '@/lib/api-client';

const RANGES = ['24h', '7d', '30d', '90d', 'all'] as const;

function formatTimestamp(ts: string) {
  return new Date(ts).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
}

function HotkeyDetailContent() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [range, setRange] = useState<(typeof RANGES)[number]>('7d');

  const { data: hotkey, isLoading: hotkeyLoading } = useQuery({
    queryKey: ['hotkey', id],
    queryFn: () => api.get<Hotkey>(`/hotkeys/${id}`),
    enabled: !!id,
  });

  const { data: metrics, isLoading: metricsLoading } = useQuery({
    queryKey: ['metrics', id, range],
    queryFn: () => api.get<MetricHistory>(`/metrics/hotkeys/${id}?range=${range}`),
    enabled: !!id,
  });

  if (hotkeyLoading || metricsLoading) return <LoadingState />;
  if (!hotkey || !metrics) return null;

  const chartData = metrics.history.map((h) => ({
    time: formatTimestamp(h.timestamp),
    weight: h.weight,
    reward: h.reward,
    fp: h.fp,
    f1: h.f1,
    ap: h.ap,
  }));

  const tableRows = [...metrics.history].reverse();

  return (
    <div className="space-y-6">
      <div>
        <Link href="/hotkeys" className="text-sm text-brand-100 hover:underline">
          ← Back to hotkeys
        </Link>
        <h2 className="mt-2 text-2xl font-bold">{hotkey.label || 'Hotkey Detail'}</h2>
        <p className="font-mono text-sm text-slate-400">{hotkey.address}</p>
        {metrics.current.uid != null && (
          <p className="text-sm text-slate-500">UID {metrics.current.uid} · Rank {metrics.current.rank ?? '—'}</p>
        )}
      </div>

      <section>
        <h3 className="mb-3 text-lg font-semibold text-slate-200">Current Eval Scores</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Weight" value={formatWeight(metrics.current.weight)} />
          <StatCard label="Reward" value={formatNumber(metrics.current.reward)} />
          <StatCard label="FP Score" value={formatNumber(metrics.current.fp)} />
          <StatCard label="F1 Score" value={formatNumber(metrics.current.f1)} />
          <StatCard label="AP Score" value={formatNumber(metrics.current.ap)} />
        </div>
      </section>

      <div className="flex gap-2">
        {RANGES.map((r) => (
          <button
            key={r}
            className={`rounded-lg px-3 py-1.5 text-sm ${
              range === r ? 'bg-brand-600 text-white' : 'bg-surface-card text-slate-400 hover:text-white'
            }`}
            onClick={() => setRange(r)}
          >
            {r === 'all' ? 'All' : r.toUpperCase()}
          </button>
        ))}
      </div>

      <ChartCard
        title="Eval Scores Over Time"
        data={chartData}
        emptyMessage="No history yet. Scores are recorded on each sync (every 10 minutes by default)."
        lines={[
          { key: 'reward', color: '#22c55e', name: 'Reward' },
          { key: 'f1', color: '#6366f1', name: 'F1' },
          { key: 'fp', color: '#f59e0b', name: 'FP' },
          { key: 'ap', color: '#ec4899', name: 'AP' },
        ]}
      />

      <ChartCard
        title="Weight Over Time"
        data={chartData}
        emptyMessage="No weight history yet."
        lines={[{ key: 'weight', color: '#38bdf8', name: 'Weight' }]}
        yTickFormatter={(v) => (Math.abs(v) < 0.0001 && v !== 0 ? v.toExponential(1) : String(v))}
      />

      <section className="card overflow-hidden p-0">
        <div className="border-b border-surface-border px-6 py-4">
          <h3 className="font-semibold">History</h3>
          <p className="text-sm text-slate-400">
            Only timestamps where weight, reward, FP, F1, AP, or rank changed
          </p>
        </div>
        {tableRows.length === 0 ? (
          <p className="px-6 py-8 text-center text-sm text-slate-500">
            No snapshots in this range. Trigger a sync in Settings to start collecting history.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[720px]">
              <thead className="bg-slate-900/50">
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
                {tableRows.map((row) => (
                  <tr key={row.timestamp} className="hover:bg-slate-800/30">
                    <td className="table-cell whitespace-nowrap text-slate-300">
                      {formatTimestamp(row.timestamp)}
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
        )}
      </section>
    </div>
  );
}

function ChartCard({
  title,
  data,
  lines,
  emptyMessage,
  yTickFormatter,
}: {
  title: string;
  data: Record<string, string | number | null>[];
  lines: { key: string; color: string; name: string }[];
  emptyMessage: string;
  yTickFormatter?: (value: number) => string;
}) {
  return (
    <div className="card">
      <h3 className="mb-4 font-semibold">{title}</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} tickFormatter={yTickFormatter} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
              formatter={(value: number, name: string) => {
                if (name === 'Weight') return formatWeight(value);
                return formatNumber(value);
              }}
            />
            <Legend />
            {lines.map((l) => (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                name={l.name}
                stroke={l.color}
                dot={false}
                strokeWidth={2}
                connectNulls
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}

export default function HotkeyDetailPage() {
  return (
    <AuthGuard>
      <HotkeyDetailContent />
    </AuthGuard>
  );
}
