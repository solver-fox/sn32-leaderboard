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
    <div className="space-y-6">
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
      <h3 className="section-title mb-4">{title}</h3>
      {data.length === 0 ? (
        <p className="py-10 text-center text-sm text-slate-500">{emptyMessage}</p>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data} margin={{ top: 4, right: 8, left: 0, bottom: 0 }}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
            <XAxis dataKey="time" tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} />
            <YAxis tick={{ fill: '#64748b', fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={yTickFormatter} />
            <Tooltip
              contentStyle={{
                background: 'rgba(15, 23, 42, 0.95)',
                border: '1px solid rgba(51, 65, 85, 0.8)',
                borderRadius: 12,
                fontSize: 12,
              }}
              formatter={(value: number, name: string) => {
                if (name === 'Weight') return formatWeight(value);
                return formatNumber(value);
              }}
            />
            <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
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
