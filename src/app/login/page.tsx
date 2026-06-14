'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '@/store/auth';
import { ApiError } from '@/lib/api-client';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const { login, register } = useAuthStore();
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      if (isRegister) {
        await register(email, password, name || undefined);
      } else {
        await login(email, password);
      }
      router.push('/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Authentication failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      <div className="hidden flex-1 flex-col justify-between border-r border-surface-border bg-surface-elevated/50 p-12 lg:flex">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white shadow-glow">
            32
          </div>
          <span className="text-lg font-semibold text-white">SN32 Tracker</span>
        </div>
        <div className="max-w-md">
          <h2 className="text-3xl font-semibold tracking-tight text-white">
            Monitor your subnet 32 miners with clarity
          </h2>
          <p className="mt-4 text-slate-400">
            Track coldkey balances, hotkey performance, eval scores, and emissions — synced from
            chain and validator data.
          </p>
          <ul className="mt-8 space-y-3 text-sm text-slate-500">
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />
              Real-time TAO &amp; Alpha pricing
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-accent" />
              WandB eval scores &amp; history
            </li>
            <li className="flex items-center gap-2">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              Automated sync &amp; alerts
            </li>
          </ul>
        </div>
        <p className="text-xs text-slate-600">Bittensor Subnet 32 · AI Detection</p>
      </div>

      <div className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md animate-fade-in">
          <div className="mb-8 lg:hidden">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-brand-500 to-brand-700 text-sm font-bold text-white">
                32
              </div>
              <span className="text-lg font-semibold">SN32 Tracker</span>
            </div>
          </div>

          <div className="card">
            <h1 className="text-xl font-semibold text-white">
              {isRegister ? 'Create account' : 'Welcome back'}
            </h1>
            <p className="mt-1 text-sm text-slate-400">
              {isRegister ? 'Start tracking your miners' : 'Sign in to your dashboard'}
            </p>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              {isRegister && (
                <div>
                  <label className="label">Name</label>
                  <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
                </div>
              )}
              <div>
                <label className="label">Email</label>
                <input
                  className="input"
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
              <div>
                <label className="label">Password</label>
                <input
                  className="input"
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                />
              </div>
              {error && (
                <p className="rounded-lg bg-red-500/10 px-3 py-2 text-sm text-red-400 ring-1 ring-red-500/20">
                  {error}
                </p>
              )}
              <button type="submit" className="btn-primary w-full" disabled={loading}>
                {loading ? 'Please wait…' : isRegister ? 'Create account' : 'Sign in'}
              </button>
            </form>

            <button
              type="button"
              className="link-brand mt-5 w-full text-center text-sm"
              onClick={() => setIsRegister(!isRegister)}
            >
              {isRegister ? 'Already have an account? Sign in' : 'Need an account? Register'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
