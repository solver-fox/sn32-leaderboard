import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { api, Coldkey, Hotkey } from '../lib/api';
import { formatNumber, truncateAddress, LoadingState } from '../components/StatCard';

export function HotkeysPage() {
  const queryClient = useQueryClient();
  const [address, setAddress] = useState('');
  const [label, setLabel] = useState('');
  const [coldkeyId, setColdkeyId] = useState('');

  const { data: coldkeys } = useQuery({
    queryKey: ['coldkeys'],
    queryFn: () => api.get<Coldkey[]>('/coldkeys'),
  });

  const { data: hotkeys, isLoading } = useQuery({
    queryKey: ['hotkeys'],
    queryFn: () => api.get<Hotkey[]>('/hotkeys'),
  });

  const createMutation = useMutation({
    mutationFn: () =>
      api.post('/hotkeys', { address, label: label || undefined, coldkeyId }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotkeys'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      setAddress('');
      setLabel('');
    },
  });

  const deleteMutation = useMutation({
    mutationFn: (id: string) => api.delete(`/hotkeys/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['hotkeys'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold">Hotkeys</h2>
        <p className="text-slate-400">Track miner hotkeys linked to your coldkeys</p>
      </div>

      <div className="card">
        <h3 className="mb-4 font-semibold">Add Hotkey</h3>
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
            className="input min-w-[280px] flex-1"
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
      ) : (
        <div className="overflow-hidden rounded-xl border border-surface-border">
          <table className="w-full">
            <thead className="bg-slate-900/50">
              <tr>
                <th className="table-head">Label</th>
                <th className="table-head">Address</th>
                <th className="table-head">UID</th>
                <th className="table-head">Rank</th>
                <th className="table-head">F1</th>
                <th className="table-head">Emission</th>
                <th className="table-head">Coldkey</th>
                <th className="table-head">Actions</th>
              </tr>
            </thead>
            <tbody>
              {hotkeys?.map((h) => (
                <tr key={h.id} className="hover:bg-slate-800/30">
                  <td className="table-cell">
                    <Link to={`/hotkeys/${h.id}`} className="text-brand-100 hover:underline">
                      {h.label || '—'}
                    </Link>
                  </td>
                  <td className="table-cell font-mono text-xs">{truncateAddress(h.address, 10)}</td>
                  <td className="table-cell">{h.uid ?? '—'}</td>
                  <td className="table-cell">{h.rank ?? '—'}</td>
                  <td className="table-cell">{formatNumber(h.f1 ? Number(h.f1) : null)}</td>
                  <td className="table-cell">{formatNumber(h.emission ? Number(h.emission) : null)}</td>
                  <td className="table-cell text-xs">
                    {h.coldkey?.label || truncateAddress(h.coldkey?.address ?? '', 6)}
                  </td>
                  <td className="table-cell">
                    <button
                      className="text-xs text-red-400 hover:underline"
                      onClick={() => {
                        if (confirm('Remove this hotkey?')) deleteMutation.mutate(h.id);
                      }}
                    >
                      Delete
                    </button>
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
