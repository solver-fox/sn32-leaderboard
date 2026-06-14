import { prisma } from '@/lib/prisma';

type TimeRange = '24h' | '7d' | '30d' | '90d' | 'all';

function rangeToDate(range: TimeRange): Date | null {
  const ms: Record<Exclude<TimeRange, 'all'>, number> = {
    '24h': 24 * 60 * 60 * 1000,
    '7d': 7 * 24 * 60 * 60 * 1000,
    '30d': 30 * 24 * 60 * 60 * 1000,
    '90d': 90 * 24 * 60 * 60 * 1000,
  };
  if (range === 'all') return null;
  return new Date(Date.now() - ms[range]);
}

export async function getHotkeyMetrics(userId: string, hotkeyId: string, range: TimeRange = '7d') {
  const hotkey = await prisma.hotkey.findFirst({
    where: { id: hotkeyId, coldkey: { userId } },
  });
  if (!hotkey) return null;

  const since = rangeToDate(range);
  const snapshots = await prisma.metricSnapshot.findMany({
    where: {
      hotkeyId,
      ...(since ? { timestamp: { gte: since } } : {}),
    },
    orderBy: { timestamp: 'asc' },
  });

  return {
    current: {
      rank: hotkey.rank,
      emission: hotkey.emission != null ? Number(hotkey.emission) : null,
      incentive: hotkey.incentive != null ? Number(hotkey.incentive) : null,
      f1: hotkey.f1 != null ? Number(hotkey.f1) : null,
      precision: hotkey.precision != null ? Number(hotkey.precision) : null,
      recall: hotkey.recall != null ? Number(hotkey.recall) : null,
      fp: hotkey.fp,
      fn: hotkey.fn,
    },
    history: snapshots.map((s) => ({
      timestamp: s.timestamp,
      rank: s.rank,
      emission: s.emission != null ? Number(s.emission) : null,
      incentive: s.incentive != null ? Number(s.incentive) : null,
      f1: s.f1 != null ? Number(s.f1) : null,
      precision: s.precision != null ? Number(s.precision) : null,
      recall: s.recall != null ? Number(s.recall) : null,
      fp: s.fp,
      fn: s.fn,
    })),
  };
}
