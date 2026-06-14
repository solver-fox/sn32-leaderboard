'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { AuthGuard } from '@/components/AuthGuard';
import { PageHeader } from '@/components/PageHeader';
import { LoadingState } from '@/components/Layout';
import { api } from '@/lib/api-client';

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

function SettingsContent() {
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
    mutationFn: () => api.post<{ hotkeysUpdated: number; hotkeysNotFound: number }>('/sync/trigger', {}),
    onSuccess: (result) => {
      queryClient.invalidateQueries({ queryKey: ['portfolio'] });
      queryClient.invalidateQueries({ queryKey: ['leaderboard'] });
      queryClient.invalidateQueries({ queryKey: ['hotkeys'] });
      queryClient.invalidateQueries({ queryKey: ['coldkeys'] });
      queryClient.invalidateQueries({ queryKey: ['metrics'] });
    },
  });

  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Sync schedule, chain data refresh, and performance alerts" />

      <section className="card max-w-2xl">
        <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Sync Configuration</h3>
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
          <p className="badge-success mt-3 inline-flex">
            Sync completed — {triggerSync.data?.hotkeysUpdated ?? 0} hotkey(s) updated
            {(triggerSync.data?.hotkeysNotFound ?? 0) > 0 &&
              `, ${triggerSync.data?.hotkeysNotFound} not found on subnet`}
            .
          </p>
        )}
        {triggerSync.isError && (
          <p className="mt-2 text-sm text-red-400">Sync failed. Check server logs and RPC connectivity.</p>
        )}
      </section>

      <section className="card max-w-2xl">
        <h3 className="mb-1 text-sm font-semibold text-slate-900 dark:text-white">Create Alert</h3>
        <p className="mb-4 text-sm text-slate-500">Get notified when miner performance drops below a threshold.</p>
        <div className="space-y-4">
          <div>
            <label className="label">Alert type</label>
            <select className="input" value={alertType} onChange={(e) => setAlertType(e.target.value)}>
            <option value="EMISSION_DROP">Emission Drop</option>
            <option value="RANK_DROP">Rank Drop</option>
            <option value="F1_DROP">F1 Drop</option>
          </select>
          </div>
          <div>
            <label className="label">Channel</label>
            <select className="input" value={alertChannel} onChange={(e) => setAlertChannel(e.target.value)}>
            <option value="DISCORD">Discord Webhook</option>
            <option value="EMAIL">Email</option>
          </select>
          </div>
          <div>
            <label className="label">Threshold</label>
            <input
              className="input"
              placeholder="e.g. 10"
              value={threshold}
              onChange={(e) => setThreshold(e.target.value)}
            />
          </div>
          <div>
            <label className="label">Destination</label>
            <input
              className="input"
              placeholder="Webhook URL or email"
              value={destination}
              onChange={(e) => setDestination(e.target.value)}
            />
          </div>
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
        <h3 className="section-title mb-4">Active Alerts</h3>
        {alertsLoading ? (
          <LoadingState />
        ) : alerts?.length === 0 ? (
          <div className="empty-state py-12">
            <p className="font-medium text-slate-300">No alerts configured</p>
            <p className="mt-1 text-sm text-slate-500">Create an alert above to monitor emission or score drops.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {alerts?.map((a) => (
              <div key={a.id} className="card-compact flex items-center justify-between gap-4">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-medium text-slate-800 dark:text-slate-200">{a.type.replace('_', ' ')}</p>
                    <span className="badge-muted">{a.channel}</span>
                  </div>
                  <p className="mt-1 text-xs text-slate-500">Threshold: {a.threshold}</p>
                </div>
                <button
                  className="btn-danger text-xs"
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

export default function SettingsPage() {
  return (
    <AuthGuard>
      <SettingsContent />
    </AuthGuard>
  );
}
