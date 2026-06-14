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

export function formatNumber(n: number | null | undefined, digits = 4) {
  if (n === null || n === undefined) return '—';
  return n.toLocaleString(undefined, { maximumFractionDigits: digits });
}

export function truncateAddress(addr: string, chars = 6) {
  if (addr.length <= chars * 2 + 3) return addr;
  return `${addr.slice(0, chars)}...${addr.slice(-chars)}`;
}

export function LoadingState() {
  return (
    <div className="flex items-center justify-center py-20 text-slate-400">Loading...</div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <div className="card py-12 text-center text-slate-400">{message}</div>
  );
}
