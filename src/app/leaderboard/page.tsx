'use client';

import { useMemo, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import Link from 'next/link';
import { AuthGuard } from '@/components/AuthGuard';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/Layout';
import { SortableColumn, SortableTable } from '@/components/SortableTable';
import { useTokenMetrics } from '@/hooks/useTokenMetrics';
import { api, LeaderboardItem, formatNumber, truncateAddress } from '@/lib/api-client';

interface LeaderboardResponse {
  items: LeaderboardItem[];
  pagination: { page: number; limit: number; total: number; totalPages: number };
}

const LEADERBOARD_COLUMN_ORDER = [
  'uid',
  'rank',
  'coldkey',
  'hotkey',
  'emission',
  'f1',
  'ap',
  'fp',
  'stake',
  'ip',
  'port',
] as const;

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

  const columns = useMemo<SortableColumn<LeaderboardItem>[]>(
    () => [
      {
        id: 'uid',
        label: 'UID',
        sortField: 'uid',
        cellClassName: 'font-mono text-xs text-slate-500',
        render: (item) => item.uid ?? '—',
      },
      {
        id: 'rank',
        label: 'Rank',
        sortField: 'rank',
        render: (item) =>
          item.rank != null ? <span className="badge-brand">{item.rank}</span> : '—',
      },
      {
        id: 'coldkey',
        label: 'Coldkey',
        render: (item) => (
          <span className="font-medium text-slate-800 dark:text-slate-200">
            {item.coldkeyLabel || truncateAddress(item.coldkeyAddress ?? '', 8)}
          </span>
        ),
      },
      {
        id: 'hotkey',
        label: 'Hotkey',
        render: (item) => (
          <Link href={`/hotkeys/${item.id}`} className="link-brand font-medium">
            {item.label || truncateAddress(item.hotkey, 8)}
          </Link>
        ),
      },
      {
        id: 'emission',
        label: 'Emission',
        sortField: 'emission',
        cellClassName: 'font-mono text-sm',
        render: (item) => formatNumber(item.emission),
      },
      {
        id: 'f1',
        label: 'F1',
        sortField: 'f1',
        cellClassName: 'font-mono text-sm',
        render: (item) => formatNumber(item.f1),
      },
      {
        id: 'ap',
        label: 'AP',
        sortField: 'precision',
        cellClassName: 'font-mono text-sm',
        render: (item) => formatNumber(item.precision),
      },
      {
        id: 'fp',
        label: 'FP',
        sortField: 'recall',
        cellClassName: 'font-mono text-sm',
        render: (item) => formatNumber(item.recall),
      },
      {
        id: 'stake',
        label: <>Stake {unit === 'usd' ? '($)' : '(α)'}</>,
        sortField: 'stake',
        cellClassName: 'font-mono text-sm',
        render: (item) => format('stake', item.stake),
      },
      {
        id: 'ip',
        label: 'IP',
        cellClassName: 'font-mono text-xs text-slate-500',
        render: (item) => item.axonIp ?? '—',
      },
      {
        id: 'port',
        label: 'Port',
        cellClassName: 'font-mono text-xs',
        render: (item) => item.axonPort ?? '—',
      },
    ],
    [format, unit],
  );

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
            <SortableTable
              tableId="leaderboard"
              columns={columns}
              defaultOrder={[...LEADERBOARD_COLUMN_ORDER]}
              data={data?.items ?? []}
              getRowKey={(item) => item.id}
              minWidth="1100px"
              sortBy={sortBy}
              sortOrder={sortOrder}
              onSort={toggleSort}
              emptyRow={
                <tr>
                  <td colSpan={LEADERBOARD_COLUMN_ORDER.length} className="table-cell py-12 text-center text-slate-500">
                    No hotkeys yet.{' '}
                    <Link href="/hotkeys" className="link-brand">
                      Add hotkeys
                    </Link>{' '}
                    and run sync in Settings.
                  </td>
                </tr>
              }
            />
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
