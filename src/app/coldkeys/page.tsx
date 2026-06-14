'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthGuard } from '@/components/AuthGuard';
import { LoadingState } from '@/components/Layout';
import { api, Coldkey, formatNumber, truncateAddress } from '@/lib/api-client';

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

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Coldkeys</h2>
        <p className="text-slate-400">Manage coldkey addresses and monitor balances</p>
      </div>

      <div className="card">
        <h3 className="mb-4 font-semibold">Add Coldkey</h3>
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
                <th className="table-head">Hotkeys</th>
                <th className="table-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {coldkeys?.map((c) => (
                <tr key={c.id} className="hover:bg-slate-800/30">
                  <td className="table-cell">
                    {editingId === c.id ? (
                      <form
                        className="flex gap-2"
                        onSubmit={(e) => {
                          e.preventDefault();
                          updateMutation.mutate({ id: c.id, label: editLabel });
                        }}
                      >
                        <input
                          className="input"
                          value={editLabel}
                          onChange={(e) => setEditLabel(e.target.value)}
                        />
                        <button type="submit" className="btn-primary text-xs">
                          Save
                        </button>
                      </form>
                    ) : (
                      c.label || '—'
                    )}
                  </td>
                  <td className="table-cell font-mono text-xs">{truncateAddress(c.address, 10)}</td>
                  <td className="table-cell">{formatNumber(Number(c.taoBalance))}</td>
                  <td className="table-cell">{formatNumber(Number(c.alphaBalance))}</td>
                  <td className="table-cell">{formatNumber(Number(c.alphaStake))}</td>
                  <td className="table-cell">{c.hotkeys?.length ?? 0}</td>
                  <td className="table-cell">
                    <div className="flex gap-2">
                      <button
                        className="text-xs text-brand-100 hover:underline"
                        onClick={() => {
                          setEditingId(c.id);
                          setEditLabel(c.label ?? '');
                        }}
                      >
                        Edit
                      </button>
                      <button
                        className="text-xs text-red-400 hover:underline"
                        onClick={() => {
                          if (confirm('Delete this coldkey and all its hotkeys?')) {
                            deleteMutation.mutate(c.id);
                          }
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
