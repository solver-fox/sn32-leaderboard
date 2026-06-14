'use client';

import { useEffect, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthGuard } from '@/components/AuthGuard';
import { HotkeyDashboard, HotkeyListItem } from '@/components/hotkey/HotkeyDashboard';
import { LoadingState } from '@/components/Layout';
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
    <div className="flex h-[calc(100vh-7rem)] min-h-[520px] flex-col gap-4">
      <div>
        <h2 className="text-2xl font-bold">Hotkeys</h2>
        <p className="text-slate-400">Select a hotkey to view its eval history and scores</p>
      </div>

      <div className="card shrink-0">
        <h3 className="mb-3 font-semibold">Add Hotkey</h3>
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
        <div className="card flex flex-1 items-center justify-center text-slate-400">
          No hotkeys yet. Add one above to get started.
        </div>
      ) : (
        <div className="flex min-h-0 flex-1 overflow-hidden rounded-xl border border-surface-border">
          <aside className="flex w-72 shrink-0 flex-col border-r border-surface-border bg-slate-900/30 lg:w-80">
            <div className="border-b border-surface-border px-4 py-3">
              <h3 className="text-sm font-semibold text-slate-300">Your hotkeys</h3>
              <p className="text-xs text-slate-500">{hotkeys.length} total</p>
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

          <main className="flex min-w-0 flex-1 flex-col overflow-hidden p-4 lg:p-6">
            {selectedId ? (
              <HotkeyDashboard hotkeyId={selectedId} variant="panel" />
            ) : (
              <div className="flex flex-1 items-center justify-center text-slate-400">
                Select a hotkey from the list
              </div>
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
