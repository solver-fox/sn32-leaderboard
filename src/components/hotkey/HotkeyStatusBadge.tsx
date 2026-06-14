import { getHotkeySubnetStatus, HotkeySubnetStatus } from '@/lib/api-client';

const STATUS_CLASS: Record<HotkeySubnetStatus, string> = {
  registered: 'badge-success',
  deregistered: 'bg-red-500/15 text-red-600 ring-1 ring-red-500/25 dark:text-red-300',
  pending: 'badge-muted',
};

export function HotkeyStatusBadge({
  isRegistered,
  lastSyncAt,
  compact = false,
}: {
  isRegistered: boolean | null;
  lastSyncAt?: string | null;
  compact?: boolean;
}) {
  const { status, label } = getHotkeySubnetStatus({ isRegistered, lastSyncAt });

  return (
    <span
      className={`badge ${STATUS_CLASS[status]} ${compact ? 'text-[10px]' : ''}`}
      title={getHotkeySubnetStatus({ isRegistered, lastSyncAt }).description}
    >
      {label}
    </span>
  );
}
