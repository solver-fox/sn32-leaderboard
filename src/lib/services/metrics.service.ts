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

function toNum(value: unknown): number | null {
  if (value === null || value === undefined) return null;
  return Number(value);
}

export interface MetricHistoryPoint {
  timestamp: Date;
  rank: number | null;
  weight: number | null;
  reward: number | null;
  fp: number | null;
  f1: number | null;
  ap: number | null;
  emission: number | null;
  incentive: number | null;
}

function numEqual(a: number | null, b: number | null): boolean {
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return Math.abs(a - b) < 1e-10;
}

function hasScoreChange(current: MetricHistoryPoint, previous: MetricHistoryPoint): boolean {
  return (
    current.rank !== previous.rank ||
    !numEqual(current.weight, previous.weight) ||
    !numEqual(current.reward, previous.reward) ||
    !numEqual(current.fp, previous.fp) ||
    !numEqual(current.f1, previous.f1) ||
    !numEqual(current.ap, previous.ap)
  );
}

export function filterChangedHistory(history: MetricHistoryPoint[]): MetricHistoryPoint[] {
  if (history.length === 0) return [];

  const changed: MetricHistoryPoint[] = [history[0]];
  for (let i = 1; i < history.length; i++) {
    if (hasScoreChange(history[i], history[i - 1])) {
      changed.push(history[i]);
    }
  }
  return changed;
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

  const allHistory: MetricHistoryPoint[] = snapshots.map((s) => ({
    timestamp: s.timestamp,
    rank: s.rank,
    weight: toNum(s.weight),
    reward: toNum(s.reward),
    fp: toNum(s.recall),
    f1: toNum(s.f1),
    ap: toNum(s.precision),
    emission: toNum(s.emission),
    incentive: toNum(s.incentive),
  }));

  const history = filterChangedHistory(allHistory);

  return {
    current: {
      rank: hotkey.rank,
      uid: hotkey.uid,
      weight: toNum(hotkey.weight),
      reward: toNum(hotkey.reward),
      fp: toNum(hotkey.recall),
      f1: toNum(hotkey.f1),
      ap: toNum(hotkey.precision),
      emission: toNum(hotkey.emission),
      incentive: toNum(hotkey.incentive),
    },
    history: history.map((s) => ({
      timestamp: s.timestamp,
      rank: s.rank,
      weight: s.weight,
      reward: s.reward,
      fp: s.fp,
      f1: s.f1,
      ap: s.ap,
      emission: s.emission,
      incentive: s.incentive,
    })),
  };
}
