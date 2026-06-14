'use client';

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
import { MetricHistory, formatNumber, formatWeight } from '@/lib/api-client';
import { formatMetricTimestamp } from '@/components/hotkey/HotkeyMetrics';

export function HotkeyMetricCharts({ history }: { history: MetricHistory['history'] }) {
  const chartData = history.map((h) => ({
    time: formatMetricTimestamp(h.timestamp),
    weight: h.weight,
    reward: h.reward,
    fp: h.fp,
    f1: h.f1,
    ap: h.ap,
  }));

  return (
    <>
      <ChartCard
        title="Eval Scores Over Time"
        data={chartData}
        emptyMessage="No history yet. Scores are recorded when values change on sync."
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
    </>
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
