import { prisma } from '@/lib/prisma';
import { fetchMetricsForHotkeys, fetchColdkeyBalances, findMinerMetrics } from '@/lib/sync/bittensor';

let running = false;

export interface SyncResult {
  coldkeysProcessed: number;
  hotkeysUpdated: number;
  hotkeysNotFound: number;
}

export async function runSyncJob(): Promise<SyncResult> {
  if (running) {
    return { coldkeysProcessed: 0, hotkeysUpdated: 0, hotkeysNotFound: 0 };
  }
  running = true;

  const result: SyncResult = {
    coldkeysProcessed: 0,
    hotkeysUpdated: 0,
    hotkeysNotFound: 0,
  };

  try {
    const now = new Date();
    const coldkeys = await prisma.coldkey.findMany({ include: { hotkeys: true } });
    const allHotkeys = coldkeys.flatMap((c) => c.hotkeys);
    const metricsByHotkey = await fetchMetricsForHotkeys(allHotkeys.map((h) => h.address));

    for (const coldkey of coldkeys) {
      result.coldkeysProcessed += 1;
      const balances = await fetchColdkeyBalances(coldkey.address);

      await prisma.coldkey.update({
        where: { id: coldkey.id },
        data: {
          taoBalance: balances.taoBalance,
          alphaBalance: balances.alphaBalance,
          alphaStake: balances.alphaStake,
          lastSyncAt: now,
        },
      });

      await prisma.balanceSnapshot.create({
        data: {
          coldkeyId: coldkey.id,
          taoBalance: balances.taoBalance,
          alphaBalance: balances.alphaBalance,
          alphaStake: balances.alphaStake,
        },
      });

      for (const hotkey of coldkey.hotkeys) {
        const updated = await syncHotkey(hotkey, metricsByHotkey, now, coldkey.userId);

        if (updated) result.hotkeysUpdated += 1;
        else result.hotkeysNotFound += 1;
      }
    }
  } finally {
    running = false;
  }

  return result;
}

type StoredHotkey = {
  id: string;
  address: string;
  rank: number | null;
  emission: { toString(): string } | null;
  f1: { toString(): string } | null;
  precision: { toString(): string } | null;
  recall: { toString(): string } | null;
  weight: { toString(): string } | null;
  reward: { toString(): string } | null;
};

async function syncHotkey(
  hotkey: StoredHotkey,
  metricsByHotkey: Map<string, import('@/lib/sync/bittensor').SubnetMinerMetrics>,
  now: Date,
  userId: string,
): Promise<boolean> {
  const metrics = findMinerMetrics(metricsByHotkey, hotkey.address);

  if (!metrics) {
    return false;
  }

  const scoresChanged = hasMetricsChange(hotkey, metrics);

  await prisma.hotkey.update({
    where: { id: hotkey.id },
    data: {
      uid: metrics.uid,
      rank: metrics.rank,
      incentive: metrics.incentive,
      emission: metrics.emission,
      trust: metrics.trust,
      consensus: metrics.consensus,
      f1: metrics.f1,
      precision: metrics.precision,
      recall: metrics.recall,
      weight: metrics.weight,
      reward: metrics.reward,
      stake: metrics.stake,
      axonIp: metrics.axonIp,
      axonPort: metrics.axonPort,
      registeredBlock: metrics.registeredBlock,
      registeredAt: metrics.registeredAt,
      fp: metrics.fp,
      fn: metrics.fn,
      lastSyncAt: now,
    },
  });

  if (scoresChanged) {
    await prisma.metricSnapshot.create({
      data: {
        hotkeyId: hotkey.id,
        rank: metrics.rank,
        emission: metrics.emission,
        incentive: metrics.incentive,
        f1: metrics.f1,
        precision: metrics.precision,
        recall: metrics.recall,
        weight: metrics.weight,
        reward: metrics.reward,
        fp: metrics.fp,
        fn: metrics.fn,
      },
    });
  }

  await checkAlerts(hotkey.id, userId, {
    previousRank: hotkey.rank,
    previousEmission: hotkey.emission ? Number(hotkey.emission) : null,
    previousF1: hotkey.f1 ? Number(hotkey.f1) : null,
    currentRank: metrics.rank ?? 0,
    currentEmission: metrics.emission,
    currentF1: metrics.f1 ?? 0,
  });

  return true;
}

function decEqual(stored: { toString(): string } | null | undefined, value: number | null | undefined): boolean {
  const a = stored != null ? Number(stored) : null;
  const b = value ?? null;
  if (a === null && b === null) return true;
  if (a === null || b === null) return false;
  return Math.abs(a - b) < 1e-10;
}

function hasMetricsChange(hotkey: StoredHotkey, metrics: import('@/lib/sync/bittensor').SubnetMinerMetrics): boolean {
  return (
    hotkey.rank !== metrics.rank ||
    !decEqual(hotkey.weight, metrics.weight) ||
    !decEqual(hotkey.reward, metrics.reward) ||
    !decEqual(hotkey.recall, metrics.recall) ||
    !decEqual(hotkey.f1, metrics.f1) ||
    !decEqual(hotkey.precision, metrics.precision)
  );
}

async function checkAlerts(
  hotkeyId: string,
  userId: string,
  data: {
    previousRank: number | null;
    previousEmission: number | null;
    previousF1: number | null;
    currentRank: number;
    currentEmission: number;
    currentF1: number;
  },
) {
  const alerts = await prisma.alert.findMany({
    where: { userId, enabled: true, OR: [{ hotkeyId }, { hotkeyId: null }] },
  });

  for (const alert of alerts) {
    const threshold = Number(alert.threshold);
    let triggered = false;
    let message = '';

    if (alert.type === 'EMISSION_DROP' && data.previousEmission && data.previousEmission > 0) {
      const dropPct = ((data.previousEmission - data.currentEmission) / data.previousEmission) * 100;
      if (dropPct >= threshold) {
        triggered = true;
        message = `Emission dropped ${dropPct.toFixed(1)}% (threshold ${threshold}%)`;
      }
    }

    if (alert.type === 'RANK_DROP' && data.previousRank !== null && data.currentRank > 0) {
      const rankDrop = data.currentRank - data.previousRank;
      if (rankDrop >= threshold) {
        triggered = true;
        message = `Rank dropped by ${rankDrop} positions (threshold ${threshold})`;
      }
    }

    if (alert.type === 'F1_DROP' && data.previousF1 !== null && data.previousF1 > 0 && data.currentF1 > 0) {
      const f1Drop = data.previousF1 - data.currentF1;
      if (f1Drop >= threshold) {
        triggered = true;
        message = `F1 dropped by ${f1Drop.toFixed(4)} (threshold ${threshold})`;
      }
    }

    if (triggered && alert.channel === 'DISCORD') {
      await fetch(alert.destination, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `[SN32 Tracker] ${message}` }),
      }).catch(() => undefined);
    }
  }
}

export async function getSyncConfig() {
  return prisma.syncConfig.findUnique({ where: { id: 'default' } });
}

export async function updateSyncInterval(minutes: number) {
  const allowed = [5, 10, 30, 60];
  if (!allowed.includes(minutes)) throw new Error('Interval must be 5, 10, 30, or 60 minutes');
  return prisma.syncConfig.update({
    where: { id: 'default' },
    data: { intervalMinutes: minutes },
  });
}

export async function ensureSyncConfig() {
  const intervalMinutes = parseInt(process.env.SYNC_INTERVAL_MINUTES || '10', 10);
  return prisma.syncConfig.upsert({
    where: { id: 'default' },
    create: { id: 'default', intervalMinutes },
    update: { intervalMinutes },
  });
}
