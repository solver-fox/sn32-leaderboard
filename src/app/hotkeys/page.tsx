'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthGuard } from '@/components/AuthGuard';
import { PageHeader } from '@/components/PageHeader';
import { HotkeyDashboard, HotkeyListItem } from '@/components/hotkey/HotkeyDashboard';
import { EmptyState, LoadingState } from '@/components/Layout';
import { api, Coldkey, Hotkey, truncateAddress } from '@/lib/api-client';

function HotkeysContent() {
  const queryClient = useQueryClient();
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [coldkeyId, setColdkeyId] = useState('');
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const { data: coldkeys } = useQuery({
    queryKey: ['coldkeys'],
    queryFn: () => api.get<Coldkey[]>('/coldkeys'),
  });

  const { data: hotkeys, isLoading } = useQuery({
    queryKey: ['hotkeys'],
    queryFn: () => api.get<Hotkey[]>('/hotkeys'),
  });

  useEffect(() => {
    if (!hotkeys?.length) {
      setSelectedId(null);
      return;
    }
    if (!selectedId || !hotkeys.some((h) => h.id === selectedId)) {
      setSelectedId(hotkeys[0].id);
    }
  }, [hotkeys, selectedId]);

  const createMutation = useMutation({
    mutationFn: () =>
      api.post<Hotkey>('/hotkeys', { address, label: label || undefined, coldkeyId }),
    onSuccess: (created) => {
      queryClient.invalidateQueries({ queryKey: ['hotkeys'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      setSelectedId(created.id);
      setAddress('');
      setLabel('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/hotkeys/${id}`),
    onSuccess: (_data, id) => {
      queryClient.invalidateQueries({ queryKey: ['hotkeys'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      if (selectedId === id) setSelectedId(null);
    },
  });

  return (
    <div className="flex min-h-[calc(100vh-8rem)] flex-col gap-6">
      <PageHeader
        title="Hotkeys"
        description="Select a miner to inspect eval scores, weight history, and on-chain metrics"
      />

      <div className="card shrink-0">
        <h3 className="mb-4 text-sm font-semibold text-white">Add Hotkey</h3>
        <form
          className="flex flex-wrap gap-3"
          onSubmit={(e) => {
            e.preventDefault();
            createMutation.mutate();
          }}
        >
          <select
            className="input max-w-xs"
            value={coldkeyId}
            onChange={(e) => setColdkeyId(e.target.value)}
            required
          >
            <option value="">Select coldkey</option>
            {coldkeys?.map((c) => (
              <option key={c.id} value={c.id}>
                {c.label || truncateAddress(c.address, 6)}
              </option>
            ))}
          </select>
          <input
            className="input min-w-[240px] flex-1"
            placeholder="Hotkey SS58 address"
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
      ) : !hotkeys?.length ? (
        <EmptyState
          title="No hotkeys yet"
          description="Link a hotkey to a coldkey above to start tracking miner performance."
        />
      ) : (
        <div className="table-wrap flex min-h-[520px] flex-1 overflow-hidden">
          <aside className="flex w-72 shrink-0 flex-col border-r border-surface-border bg-surface-elevated/30 lg:w-80">
            <div className="border-b border-surface-border px-4 py-3.5">
              <p className="section-title">Your hotkeys</p>
              <p className="mt-0.5 text-xs text-slate-500">{hotkeys.length} registered</p>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto">
              {hotkeys.map((h) => (
                <HotkeyListItem
                  key={h.id}
                  hotkey={h}
                  selected={h.id === selectedId}
                  onSelect={() => setSelectedId(h.id)}
                  onDelete={() => {
                    if (confirm('Remove this hotkey?')) deleteMutation.mutate(h.id);
                  }}
                />
              ))}
            </div>
          </aside>

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden bg-surface-elevated/10 p-4 lg:p-6">
            {selectedId ? (
              <HotkeyDashboard hotkeyId={selectedId} variant="panel" />
            ) : (
              <EmptyState
                title="Select a hotkey"
                description="Choose a miner from the list to view scores and history."
              />
            )}
          </main>
        </div>
      )}
    </div>
  );
}

export default function HotkeysPage() {
  return (
    <AuthGuard>
      <HotkeysContent />
    </AuthGuard>
  );
}
