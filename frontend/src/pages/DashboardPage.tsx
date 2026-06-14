import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, PortfolioDashboard } from '../lib/api';
import { StatCard, formatNumber, truncateAddress, LoadingState } from '../components/StatCard';

export function DashboardPage() {
  const { data, isLoading } = useQuery({
    queryKey: ['portfolio'],
    queryFn: () => api.get<PortfolioDashboard>('/portfolio/dashboard'),
  });

  if (isLoading) return <LoadingState />;
  if (!data) return null;

  const { coldkeySummary, hotkeySummary, coldkeys } = data;

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Portfolio Dashboard</h2>
        <p className="text-slate-400">Overview of your coldkeys and miner performance</p>
      </div>

      <section>
        <h3 className="mb-4 text-lg font-semibold text-slate-200">Coldkey Summary</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6">
          <StatCard label="Total TAO" value={formatNumber(coldkeySummary.totalTao)} />
          <StatCard label="Total Alpha" value={formatNumber(coldkeySummary.totalAlpha)} />
          <StatCard label="Total Stake" value={formatNumber(coldkeySummary.totalStake)} />
          <StatCard label="Daily Emission" value={formatNumber(coldkeySummary.dailyEmission)} />
          <StatCard label="Weekly Emission" value={formatNumber(coldkeySummary.weeklyEmission)} />
          <StatCard label="Monthly Emission" value={formatNumber(coldkeySummary.monthlyEmission)} />
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-lg font-semibold text-slate-200">Hotkey Summary</h3>
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
          <StatCard label="Miners" value={hotkeySummary.minerCount} />
          <StatCard
            label="Average F1"
            value={formatNumber(hotkeySummary.averageF1)}
          />
          <StatCard
            label="Average Rank"
            value={formatNumber(hotkeySummary.averageRank, 0)}
          />
          <StatCard
            label="Best Miner F1"
            value={
              hotkeySummary.bestMiner
                ? formatNumber(hotkeySummary.bestMiner.f1)
                : '—'
            }
            sub={hotkeySummary.bestMiner?.label ?? truncateAddress(hotkeySummary.bestMiner?.address ?? '')}
          />
          <StatCard
            label="Worst Miner F1"
            value={
              hotkeySummary.worstMiner
                ? formatNumber(hotkeySummary.worstMiner.f1)
                : '—'
            }
            sub={hotkeySummary.worstMiner?.label ?? truncateAddress(hotkeySummary.worstMiner?.address ?? '')}
          />
        </div>
      </section>

      <section>
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-slate-200">Your Coldkeys</h3>
          <Link to="/coldkeys" className="text-sm text-brand-100 hover:underline">
            Manage coldkeys
          </Link>
        </div>
        {coldkeys.length === 0 ? (
          <div className="card text-center text-slate-400">
            No coldkeys yet.{' '}
            <Link to="/coldkeys" className="text-brand-100 hover:underline">
              Add your first coldkey
            </Link>
          </div>
        ) : (
          <div className="overflow-hidden rounded-xl border border-surface-border">
            <table className="w-full">
              <thead className="bg-slate-900/50">
                <tr>
                  <th className="table-head">Label</th>
                  <th className="table-head">Address</th>
                  <th className="table-head">TAO</th>
                  <th className="table-head">Alpha</th>
                  <th className="table-head">Stake</th>
                  <th className="table-head">Miners</th>
                </tr>
              </thead>
              <tbody>
                {coldkeys.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-800/30">
                    <td className="table-cell">{c.label || '—'}</td>
                    <td className="table-cell font-mono text-xs">{truncateAddress(c.address, 8)}</td>
                    <td className="table-cell">{formatNumber(c.taoBalance)}</td>
                    <td className="table-cell">{formatNumber(c.alphaBalance)}</td>
                    <td className="table-cell">{formatNumber(c.alphaStake)}</td>
                    <td className="table-cell">{c.hotkeyCount}</td>
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
