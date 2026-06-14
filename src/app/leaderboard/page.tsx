'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { LoadingState } from '@/components/Layout';
import { useTokenMetrics } from '@/hooks/useTokenMetrics';
import { api, LeaderboardItem, formatNumber, truncateAddress } from '@/lib/api-client';

interface LeaderboardResponse {
  items: LeaderboardItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

function LeaderboardContent() {
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState('rank');
  const [sortOrder, setSortOrder] = useState<'asc' | 'desc'>('asc');
  const { format, unit } = useTokenMetrics();

  const { data, isLoading } = useQuery({
    queryKey: ['leaderboard', search, page, sortBy, sortOrder],
    queryFn: () =>
      api.get<LeaderboardResponse>(
        `/leaderboard?search=${encodeURIComponent(search)}&page=${page}&sortBy=${sortBy}&sortOrder=${sortOrder}`,
      ),
  });

  const toggleSort = (field: string) => {
    if (sortBy === field) setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    else {
      setSortBy(field);
      setSortOrder('asc');
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Leaderboard</h2>
        <p className="text-slate-400">All tracked hotkeys ranked by performance</p>
      </div>

      <input
        className="input max-w-sm"
        placeholder="Search hotkey or label..."
        value={search}
        onChange={(e) => {
          setSearch(e.target.value);
          setPage(1);
        }}
      />

      {isLoading ? (
        <LoadingState />
      ) : (
        <>
          <div className="overflow-x-auto rounded-xl border border-surface-border">
            <table className="w-full min-w-[960px]">
              <thead className="bg-slate-900/50">
                <tr>
                  {[
                    ['rank', 'Rank'],
                    ['f1', 'F1'],
                    ['precision', 'AP Score'],
                    ['recall', 'FP Score'],
                    ['emission', 'Emission'],
                  ].map(([field, label]) => (
                    <th
                      key={field}
                      className="table-head cursor-pointer select-none hover:text-slate-200"
                      onClick={() => toggleSort(field)}
                    >
                      {label}
                      {sortBy === field && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </th>
                  ))}
                  <th className="table-head">Hotkey</th>
                  <th className="table-head">UID</th>
                  <th
                    className="table-head cursor-pointer select-none hover:text-slate-200"
                    onClick={() => toggleSort('stake')}
                  >
                    Stake {unit === 'tao' ? '(α)' : unit === 'usd' ? '($)' : '(α)'}
                    {sortBy === 'stake' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </th>
                  <th className="table-head">IP</th>
                  <th className="table-head">Port</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="table-cell py-8 text-center text-slate-400">
                      No hotkeys yet.{' '}
                      <Link href="/hotkeys" className="text-brand-100 hover:underline">
                        Add hotkeys
                      </Link>{' '}
                      and run sync in Settings.
                    </td>
                  </tr>
                ) : (
                  data?.items.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-800/30">
                    <td className="table-cell">{item.rank ?? '—'}</td>
                    <td className="table-cell">{formatNumber(item.f1)}</td>
                    <td className="table-cell">{formatNumber(item.precision)}</td>
                    <td className="table-cell">{formatNumber(item.recall)}</td>
                    <td className="table-cell">{formatNumber(item.emission)}</td>
                    <td className="table-cell">
                      <Link href={`/hotkeys/${item.id}`} className="text-brand-100 hover:underline">
                        {item.label || truncateAddress(item.hotkey, 8)}
                      </Link>
                    </td>
                    <td className="table-cell">{item.uid ?? '—'}</td>
                    <td className="table-cell">{format('stake', item.stake)}</td>
                    <td className="table-cell font-mono text-xs">{item.axonIp ?? '—'}</td>
                    <td className="table-cell">{item.axonPort ?? '—'}</td>
                  </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-400">
                Page {data.pagination.page} of {data.pagination.totalPages}
              </p>
              <div className="flex gap-2">
                <button className="btn-secondary" disabled={page <= 1} onClick={() => setPage(page - 1)}>
                  Previous
                </button>
                <button
                  className="btn-secondary"
                  disabled={page >= data.pagination.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default function LeaderboardPage() {
  return (
    <AuthGuard>
      <LeaderboardContent />
    </AuthGuard>
  );
}
