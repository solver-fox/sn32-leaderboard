'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useAuthStore } from '@/store/auth';

const nav = [
  { href: '/', label: 'Dashboard' },
  { href: '/leaderboard', label: 'Leaderboard' },
  { href: '/coldkeys', label: 'Coldkeys' },
  { href: '/hotkeys', label: 'Hotkeys' },
  { href: '/settings', label: 'Settings' },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const { user, logout } = useAuthStore();

  return (
    <div className="flex min-h-screen">
      <aside className="fixed inset-y-0 left-0 z-10 w-64 border-r border-surface-border bg-slate-950">
        <div className="flex h-16 items-center gap-2 border-b border-surface-border px-6">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-brand-600 text-sm font-bold">
            S32
          </div>
          <div>
            <p className="text-sm font-semibold">SN32 Tracker</p>
            <p className="text-xs text-slate-400">Miner Analytics</p>
          </div>
        </div>
        <nav className="space-y-1 p-4">
          {nav.map((item) => {
            const active = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));
            return (
              <Link
                key={item.href}
                href={item.href}
                className={`block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  active
                    ? 'bg-brand-600/20 text-brand-100'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>
        <div className="absolute bottom-0 left-0 right-0 border-t border-surface-border p-4">
          <p className="truncate text-sm text-slate-300">{user?.email}</p>
          <button onClick={logout} className="mt-2 text-xs text-slate-500 hover:text-slate-300">
            Sign out
          </button>
        </div>
      </aside>

      <main className="ml-64 flex-1">
        <header className="sticky top-0 z-10 flex h-16 items-center border-b border-surface-border bg-surface/80 px-8 backdrop-blur">
          <h1 className="text-lg font-semibold text-slate-100">Bittensor SN32 Analytics</h1>
        </header>
        <div className="p-8">{children}</div>
      </main>
    </div>
  );
}

export function StatCard({
  label,
  value,
  sub,
}: {
  label: string;
  value: string | number;
  sub?: string;
}) {
  return (
    <div className="card">
      <p className="text-sm text-slate-400">{label}</p>
      <p className="mt-2 text-2xl font-bold text-white">{value}</p>
      {sub && <p className="mt-1 text-xs text-slate-500">{sub}</p>}
    </div>
  );
}

export function LoadingState() {
  return <div className="flex items-center justify-center py-20 text-slate-400">Loading...</div>;
}
