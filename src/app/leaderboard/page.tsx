'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { PageHeader } from '@/components/PageHeader';
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
      <PageHeader
        title="Leaderboard"
        description="Tracked hotkeys ranked by validator eval scores and on-chain metrics"
      />

      <input
        className="input max-w-md"
        placeholder="Search hotkey or label…"
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
          <div className="table-wrap overflow-x-auto">
            <table className="w-full min-w-[960px]">
              <thead>
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
                      className="table-head cursor-pointer select-none transition hover:text-slate-300"
                      onClick={() => toggleSort(field)}
                    >
                      {label}
                      {sortBy === field && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                    </th>
                  ))}
                  <th className="table-head">Hotkey</th>
                  <th className="table-head">UID</th>
                  <th
                    className="table-head cursor-pointer select-none transition hover:text-slate-300"
                    onClick={() => toggleSort('stake')}
                  >
                    Stake {unit === 'usd' ? '($)' : '(α)'}
                    {sortBy === 'stake' && (sortOrder === 'asc' ? ' ↑' : ' ↓')}
                  </th>
                  <th className="table-head">IP</th>
                  <th className="table-head">Port</th>
                </tr>
              </thead>
              <tbody>
                {data?.items.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="table-cell py-12 text-center text-slate-500">
                      No hotkeys yet.{' '}
                      <Link href="/hotkeys" className="link-brand">
                        Add hotkeys
                      </Link>{' '}
                      and run sync in Settings.
                    </td>
                  </tr>
                ) : (
                  data?.items.map((item) => (
                    <tr key={item.id} className="transition hover:bg-slate-100 dark:hover:bg-slate-800/25">
                      <td className="table-cell">
                        {item.rank != null ? (
                          <span className="badge-brand">{item.rank}</span>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="table-cell font-mono text-sm">{formatNumber(item.f1)}</td>
                      <td className="table-cell font-mono text-sm">{formatNumber(item.precision)}</td>
                      <td className="table-cell font-mono text-sm">{formatNumber(item.recall)}</td>
                      <td className="table-cell font-mono text-sm">{formatNumber(item.emission)}</td>
                      <td className="table-cell">
                        <Link href={`/hotkeys/${item.id}`} className="link-brand font-medium">
                          {item.label || truncateAddress(item.hotkey, 8)}
                        </Link>
                      </td>
                      <td className="table-cell font-mono text-xs text-slate-400">{item.uid ?? '—'}</td>
                      <td className="table-cell font-mono text-sm">{format('stake', item.stake)}</td>
                      <td className="table-cell font-mono text-xs text-slate-400">{item.axonIp ?? '—'}</td>
                      <td className="table-cell font-mono text-xs">{item.axonPort ?? '—'}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {data && data.pagination.totalPages > 1 && (
            <div className="flex items-center justify-between">
              <p className="text-sm text-slate-500">
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
