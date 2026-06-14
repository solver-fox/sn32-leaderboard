import { prisma } from '@/lib/prisma';
import { fetchSubnetMetrics, fetchColdkeyBalances, findMinerMetrics } from '@/lib/sync/bittensor';

let running = false;

export async function runSyncJob() {
  if (running) return;
  running = true;

  try {
    const now = new Date();
    const subnetMetrics = await fetchSubnetMetrics();
    const coldkeys = await prisma.coldkey.findMany({ include: { hotkeys: true } });

    for (const coldkey of coldkeys) {
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
        const metrics = findMinerMetrics(subnetMetrics, hotkey.address);
        if (!metrics) continue;

        const previousRank = hotkey.rank;
        const previousEmission = hotkey.emission ? Number(hotkey.emission) : null;
        const previousF1 = hotkey.f1 ? Number(hotkey.f1) : null;

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
            fp: metrics.fp,
            fn: metrics.fn,
            lastSyncAt: now,
          },
        });

        await prisma.metricSnapshot.create({
          data: {
            hotkeyId: hotkey.id,
            rank: metrics.rank,
            emission: metrics.emission,
            incentive: metrics.incentive,
            f1: metrics.f1,
            precision: metrics.precision,
            recall: metrics.recall,
            fp: metrics.fp,
            fn: metrics.fn,
          },
        });

        await checkAlerts(hotkey.id, coldkey.userId, {
          previousRank,
          previousEmission,
          previousF1,
          currentRank: metrics.rank,
          currentEmission: metrics.emission,
          currentF1: metrics.f1,
        });
      }
    }
  } finally {
    running = false;
  }
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

    if (alert.type === 'RANK_DROP' && data.previousRank !== null) {
      const rankDrop = data.currentRank - data.previousRank;
      if (rankDrop >= threshold) {
        triggered = true;
        message = `Rank dropped by ${rankDrop} positions (threshold ${threshold})`;
      }
    }

    if (alert.type === 'F1_DROP' && data.previousF1 !== null && data.previousF1 > 0) {
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
