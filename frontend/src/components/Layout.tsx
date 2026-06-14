import { NavLink, Outlet } from 'react-router-dom';
import { useAuthStore } from '../store/auth';

const nav = [
  { to: '/', label: 'Dashboard', end: true },
  { to: '/leaderboard', label: 'Leaderboard' },
  { to: '/coldkeys', label: 'Coldkeys' },
  { to: '/hotkeys', label: 'Hotkeys' },
  { to: '/settings', label: 'Settings' },
];

export function Layout() {
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
          {nav.map((item) => (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.end}
              className={({ isActive }) =>
                `block rounded-lg px-3 py-2 text-sm font-medium transition ${
                  isActive
                    ? 'bg-brand-600/20 text-brand-100'
                    : 'text-slate-400 hover:bg-slate-800 hover:text-slate-100'
                }`
              }
            >
              {item.label}
            </NavLink>
          ))}
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
        <div className="p-8">
          <Outlet />
        </div>
      </main>
    </div>
  );
}
