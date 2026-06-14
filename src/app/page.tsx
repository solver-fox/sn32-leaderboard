'use client';

import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { PageHeader } from '@/components/PageHeader';
import { StatCard, LoadingState, EmptyState } from '@/components/Layout';
import { useTokenMetrics } from '@/hooks/useTokenMetrics';
import { api, PortfolioDashboard, formatNumber, truncateAddress } from '@/lib/api-client';

function DashboardContent() {
  const { data, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.get<PortfolioDashboard>('/portfolio/dashboard'),
  });
  const { format, fieldLabel, columnLabel, unit } = useTokenMetrics();

  if (isLoading) return <LoadingState />;
  if (!data) return null;

  const { coldkeySummary, hotkeySummary, coldkeys } = data;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Portfolio Overview"
        description="Balances, emissions, and miner performance across your coldkeys"
      />

      <section>
        <h3 className="section-title mb-4">Coldkey Summary</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard accent="brand" label={fieldLabel('tao')} value={format('tao', coldkeySummary.totalTao)} />
          <StatCard accent="accent" label={fieldLabel('alpha')} value={format('alpha', coldkeySummary.totalAlpha)} />
          <StatCard label={fieldLabel('stake')} value={format('stake', coldkeySummary.totalStake)} />
          <StatCard label={fieldLabel('emission')} value={format('emission', coldkeySummary.dailyEmission)} />
          <StatCard
            label={unit === 'usd' ? 'Weekly Emission' : fieldLabel('emission').replace('Daily', 'Weekly')}
            value={format('emission', coldkeySummary.weeklyEmission)}
          />
          <StatCard
            label={unit === 'usd' ? 'Monthly Emission' : fieldLabel('emission').replace('Daily', 'Monthly')}
            value={format('emission', coldkeySummary.monthlyEmission)}
          />
        </div>
      </section>

      <section>
        <h3 className="section-title mb-4">Hotkey Summary</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Miners" value={hotkeySummary.minerCount} />
          <StatCard label="Average F1" value={formatNumber(hotkeySummary.averageF1)} />
          <StatCard label="Average Rank" value={formatNumber(hotkeySummary.averageRank, 0)} />
          <StatCard
            label="Best Miner F1"
            value={hotkeySummary.bestMiner ? formatNumber(hotkeySummary.bestMiner.f1) : '—'}
            sub={
              hotkeySummary.bestMiner?.label ??
              truncateAddress(hotkeySummary.bestMiner?.address ?? '')
            }
            accent="brand"
          />
          <StatCard
            label="Worst Miner F1"
            value={hotkeySummary.worstMiner ? formatNumber(hotkeySummary.worstMiner.f1) : '—'}
            sub={
              hotkeySummary.worstMiner?.label ??
              truncateAddress(hotkeySummary.worstMiner?.address ?? '')
            }
          />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="section-title">Your Coldkeys</h3>
          <Link href="/coldkeys" className="link-brand text-sm">
            Manage coldkeys →
          </Link>
        </div>
        {coldkeys.length === 0 ? (
          <EmptyState
            title="No coldkeys yet"
            description="Add a coldkey to start tracking balances and linked hotkeys."
            action={
              <Link href="/coldkeys" className="btn-primary">
                Add coldkey
              </Link>
            }
          />
        ) : (
          <div className="table-wrap overflow-x-auto">
            <table className="w-full min-w-[640px]">
              <thead>
                <tr>
                  <th className="table-head">Label</th>
                  <th className="table-head">Address</th>
                  <th className="table-head">{columnLabel('tao')}</th>
                  <th className="table-head">{columnLabel('alpha')}</th>
                  <th className="table-head">{columnLabel('stake')}</th>
                  <th className="table-head">Miners</th>
                </tr>
              </thead>
              <tbody>
                {coldkeys.map((c) => (
                  <tr key={c.id} className="transition hover:bg-slate-800/25">
                    <td className="table-cell font-medium text-slate-200">{c.label || '—'}</td>
                    <td className="table-cell font-mono text-xs text-slate-400">{truncateAddress(c.address, 8)}</td>
                    <td className="table-cell font-mono text-sm">{format('tao', c.taoBalance)}</td>
                    <td className="table-cell font-mono text-sm">{format('alpha', c.alphaBalance)}</td>
                    <td className="table-cell font-mono text-sm">{format('stake', c.alphaStake)}</td>
                    <td className="table-cell">
                      <span className="badge-muted">{c.hotkeyCount}</span>
                    </td>
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

export default function HomePage() {
  return (
    <AuthGuard>
      <DashboardContent />
    </AuthGuard>
  );
}
