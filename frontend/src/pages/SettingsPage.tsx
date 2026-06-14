import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { api } from '../lib/api';
import { LoadingState } from '../components/StatCard';

interface Alert {
  id: string;
  type: string;
  channel: string;
  threshold: number;
  destination: string;
  enabled: boolean;
}

interface SyncConfig {
  intervalMinutes: number;
}

export function SettingsPage() {
  const queryClient = useQueryClient();
  const [alertType, setAlertType] = useState('EMISSION_DROP');
  const [alertChannel, setAlertChannel] = useState('DISCORD');
  const [threshold, setThreshold] = useState('10');
  const [destination, setDestination] = useState('');
  const [interval, setInterval] = useState('10');

  const { data: alerts, isLoading: alertsLoading } = useQuery({
    queryKey: ['alerts'],
    queryFn: () => api.get<Alert[]>('/alerts'),
  });

  const { data: syncConfig } = useQuery({
    queryKey: ['sync-config'],
    queryFn: () => api.get<SyncConfig>('/sync/config'),
  });

  const createAlert = useMutation({
    mutationFn: () =>
      api.post('/alerts', {
        type: alertType,
        channel: alertChannel,
        threshold: parseFloat(threshold),
        destination,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['alerts'] });
      setDestination('');
    },
  });

  const deleteAlert = useMutation({
    mutationFn: (id: string) => api.delete(`/alerts/${id}`),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['alerts'] }),
  });

  const updateSync = useMutation({
    mutationFn: () => api.patch('/sync/config', { intervalMinutes: parseInt(interval, 10) }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['sync-config'] }),
  });

  const triggerSync = useMutation({
    mutationFn: () => api.post('/sync/trigger', {}),
  });

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold">Settings</h2>
        <p className="text-slate-400">Configure sync intervals and alerts</p>
      </div>

      <section className="card max-w-xl">
        <h3 className="mb-4 font-semibold">Sync Configuration</h3>
        <p className="mb-4 text-sm text-slate-400">
          Current interval: {syncConfig?.intervalMinutes ?? 10} minutes
        </p>
        <div className="flex flex-wrap gap-3">
          <select className="input max-w-xs" value={interval} onChange={(e) => setInterval(e.target.value)}>
            <option value="5">5 minutes</option>
            <option value="10">10 minutes</option>
            <option value="30">30 minutes</option>
            <option value="60">1 hour</option>
          </select>
          <button className="btn-primary" onClick={() => updateSync.mutate()} disabled={updateSync.isPending}>
            Update Interval
          </button>
          <button className="btn-secondary" onClick={() => triggerSync.mutate()} disabled={triggerSync.isPending}>
            Trigger Sync Now
          </button>
        </div>
        {triggerSync.isSuccess && (
          <p className="mt-2 text-sm text-green-400">Sync job queued successfully.</p>
        )}
      </section>

      <section className="card max-w-xl">
        <h3 className="mb-4 font-semibold">Create Alert</h3>
        <div className="space-y-3">
          <select className="input" value={alertType} onChange={(e) => setAlertType(e.target.value)}>
            <option value="EMISSION_DROP">Emission Drop</option>
            <option value="RANK_DROP">Rank Drop</option>
            <option value="F1_DROP">F1 Drop</option>
          </select>
          <select className="input" value={alertChannel} onChange={(e) => setAlertChannel(e.target.value)}>
            <option value="DISCORD">Discord Webhook</option>
            <option value="EMAIL">Email</option>
          </select>
          <input
            className="input"
            placeholder="Threshold (e.g. 10 for 10%)"
            value={threshold}
            onChange={(e) => setThreshold(e.target.value)}
          />
          <input
            className="input"
            placeholder="Webhook URL or email"
            value={destination}
            onChange={(e) => setDestination(e.target.value)}
          />
          <button
            className="btn-primary"
            onClick={() => createAlert.mutate()}
            disabled={createAlert.isPending || !destination}
          >
            Add Alert
          </button>
        </div>
      </section>

      <section>
        <h3 className="mb-4 text-lg font-semibold">Active Alerts</h3>
        {alertsLoading ? (
          <LoadingState />
        ) : alerts?.length === 0 ? (
          <div className="card text-center text-slate-400">No alerts configured.</div>
        ) : (
          <div className="space-y-2">
            {alerts?.map((a) => (
              <div key={a.id} className="card flex items-center justify-between py-4">
                <div>
                  <p className="font-medium">
                    {a.type.replace('_', ' ')} via {a.channel}
                  </p>
                  <p className="text-sm text-slate-400">
                    Threshold: {a.threshold} · {a.destination.slice(0, 40)}...
                  </p>
                </div>
                <button
                  className="text-sm text-red-400 hover:underline"
                  onClick={() => deleteAlert.mutate(a.id)}
                >
                  Remove
                </button>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
