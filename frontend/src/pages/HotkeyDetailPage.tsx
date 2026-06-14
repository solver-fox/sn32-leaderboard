import { useState } from 'react';
import { useParams, Link } from 'react-router-dom';
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
import { api, Hotkey, MetricHistory } from '../lib/api';
import { StatCard, formatNumber, LoadingState } from '../components/StatCard';

const RANGES = ['24h', '7d', '30d', '90d', 'all'] as const;

export function HotkeyDetailPage() {
  const { id } = useParams<{ id: string }>();
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
    time: new Date(h.timestamp).toLocaleDateString(undefined, {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
    }),
    f1: h.f1,
    emission: h.emission,
    rank: h.rank,
    precision: h.precision,
    recall: h.recall,
  }));

  return (
    <div className="space-y-6">
      <div>
        <Link to="/hotkeys" className="text-sm text-brand-100 hover:underline">
          ← Back to hotkeys
        </Link>
        <h2 className="mt-2 text-2xl font-bold">{hotkey.label || 'Hotkey Detail'}</h2>
        <p className="font-mono text-sm text-slate-400">{hotkey.address}</p>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 xl:grid-cols-8">
        <StatCard label="Rank" value={metrics.current.rank ?? '—'} />
        <StatCard label="Emission" value={formatNumber(metrics.current.emission)} />
        <StatCard label="Incentive" value={formatNumber(metrics.current.incentive)} />
        <StatCard label="F1" value={formatNumber(metrics.current.f1)} />
        <StatCard label="Precision" value={formatNumber(metrics.current.precision)} />
        <StatCard label="Recall" value={formatNumber(metrics.current.recall)} />
        <StatCard label="FP" value={metrics.current.fp ?? '—'} />
        <StatCard label="FN" value={metrics.current.fn ?? '—'} />
      </div>

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

      <div className="grid gap-6 lg:grid-cols-2">
        <ChartCard title="F1 Over Time" data={chartData} lines={[{ key: 'f1', color: '#6366f1' }]} />
        <ChartCard
          title="Emission Over Time"
          data={chartData}
          lines={[{ key: 'emission', color: '#22c55e' }]}
        />
        <ChartCard title="Rank Over Time" data={chartData} lines={[{ key: 'rank', color: '#f59e0b' }]} />
        <ChartCard
          title="Precision & Recall"
          data={chartData}
          lines={[
            { key: 'precision', color: '#06b6d4' },
            { key: 'recall', color: '#ec4899' },
          ]}
        />
      </div>
    </div>
  );
}

function ChartCard({
  title,
  data,
  lines,
}: {
  title: string;
  data: Record<string, string | number | null>[];
  lines: { key: string; color: string }[];
}) {
  return (
    <div className="card">
      <h3 className="mb-4 font-semibold">{title}</h3>
      {data.length === 0 ? (
        <p className="py-8 text-center text-sm text-slate-500">No historical data yet. Sync runs every 10 minutes.</p>
      ) : (
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" stroke="#334155" />
            <XAxis dataKey="time" tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <YAxis tick={{ fill: '#94a3b8', fontSize: 11 }} />
            <Tooltip
              contentStyle={{ background: '#1e293b', border: '1px solid #334155', borderRadius: 8 }}
            />
            <Legend />
            {lines.map((l) => (
              <Line
                key={l.key}
                type="monotone"
                dataKey={l.key}
                stroke={l.color}
                dot={false}
                strokeWidth={2}
              />
            ))}
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
