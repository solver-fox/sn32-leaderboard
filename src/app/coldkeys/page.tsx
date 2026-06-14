'use client';

import { useMemo, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthGuard } from '@/components/AuthGuard';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState, EmptyState } from '@/components/Layout';
import { SortableColumn, SortableTable } from '@/components/SortableTable';
import { useTokenMetrics } from '@/hooks/useTokenMetrics';
import { api, Coldkey, truncateAddress } from '@/lib/api-client';

function ColdkeysContent() {
  const queryClient = useQueryClient();
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState('');

  const { data: coldkeys, isLoading } = useQuery({
    queryKey: ['coldkeys'],
    queryFn: () => api.get<Coldkey[]>('/coldkeys'),
  });
  const { format, columnLabel } = useTokenMetrics();

  const createMutation = useMutation({
    mutationFn: () => api.post('/coldkeys', { address, label: label || undefined }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coldkeys'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      setAddress('');
      setLabel('');
    },
  });

  const updateMutation = useMutation({
    mutationFn: ({ id, label: l }: { id: string; label: string }) =>
      api.patch(`/coldkeys/${id}`, { label: l }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coldkeys'] });
      setEditingId(null);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/coldkeys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['coldkeys'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['hotkeys'] });
    },
  });

  const columns = useMemo<SortableColumn<Coldkey>[]>(
    () => [
      {
        id: 'label',
        label: 'Label',
        render: (c) =>
          editingId === c.id ? (
            <form
              className="flex gap-2"
              onSubmit={(e) => {
                e.preventDefault();
                updateMutation.mutate({ id: c.id, label: editLabel });
              }}
            >
              <input className="input" value={editLabel} onChange={(e) => setEditLabel(e.target.value)} />
              <button type="submit" className="btn-primary text-xs">
                Save
              </button>
            </form>
          ) : (
            c.label || '—'
          ),
      },
      {
        id: 'address',
        label: 'Address',
        cellClassName: 'font-mono text-xs',
        render: (c) => truncateAddress(c.address, 10),
      },
      {
        id: 'tao',
        label: columnLabel('tao'),
        cellClassName: 'font-mono text-sm',
        render: (c) => format('tao', Number(c.taoBalance)),
      },
      {
        id: 'alpha',
        label: columnLabel('alpha'),
        cellClassName: 'font-mono text-sm',
        render: (c) => format('alpha', Number(c.alphaBalance) + Number(c.alphaStake)),
      },
      {
        id: 'stake',
        label: columnLabel('stake'),
        cellClassName: 'font-mono text-sm',
        render: (c) => format('stake', Number(c.alphaStake)),
      },
      {
        id: 'hotkeys',
        label: 'Hotkeys',
        render: (c) => c.hotkeys?.length ?? 0,
      },
      {
        id: 'actions',
        label: 'Actions',
        render: (c) => (
          <div className="flex gap-2">
            <button
              className="link-brand text-xs"
              onClick={() => {
                setEditingId(c.id);
                setEditLabel(c.label ?? '');
              }}
            >
              Edit
            </button>
            <button
              className="btn-danger text-xs"
              onClick={() => {
                if (confirm('Delete this coldkey and all its hotkeys?')) {
                  deleteMutation.mutate(c.id);
                }
              }}
            >
              Delete
            </button>
          </div>
        ),
      },
    ],
    [columnLabel, editLabel, editingId, format, updateMutation, deleteMutation],
  );

  return (
    <div className="space-y-6">
      <PageHeader
        title="Coldkeys"
        description="Manage coldkey addresses and monitor wallet balances"
      />

      <div className="card">
        <h3 className="mb-4 text-sm font-semibold text-slate-900 dark:text-white">Add Coldkey</h3>
        <form
          className="flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <input
            className="input min-w-[280px] flex-1"
            placeholder="SS58 address"
            value={address}
            onChange={(e) => setAddress(e.target.value)}
            required
            minLength={40}
          />
          <input
            className="input max-w-xs"
            placeholder="Label (optional)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
          />
          <button type="submit" className="btn-primary" disabled={createMutation.isPending}>
            Add
          </button>
        </form>
      </div>

      {isLoading ? (
        <LoadingState />
      ) : !coldkeys?.length ? (
        <EmptyState
          title="No coldkeys yet"
          description="Add a coldkey address above to track balances and link hotkeys."
        />
      ) : (
        <div className="table-wrap overflow-x-auto">
          <SortableTable
            tableId="coldkeys"
            columns={columns}
            defaultOrder={['label', 'address', 'tao', 'alpha', 'stake', 'hotkeys', 'actions']}
            data={coldkeys}
            getRowKey={(c) => c.id}
          />
        </div>
      )}
    </div>
  );
}

export default function ColdkeysPage() {
  return (
    <AuthGuard>
      <ColdkeysContent />
    </AuthGuard>
  );
}
