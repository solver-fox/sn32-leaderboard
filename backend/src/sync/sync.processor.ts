import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Logger } from '@nestjs/common';
import { Job } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { BittensorService } from './bittensor.service';

export const SYNC_QUEUE = 'sync';

@Processor(SYNC_QUEUE)
export class SyncProcessor extends WorkerHost {
  private readonly logger = new Logger(SyncProcessor.name);

  constructor(
    private prisma: PrismaService,
    private bittensor: BittensorService,
  ) {
    super();
  }

  async process(_job: Job): Promise<void> {
    this.logger.log('Starting sync job');
    const now = new Date();
    const subnetMetrics = await this.bittensor.fetchSubnetMetrics();

    const coldkeys = await this.prisma.coldkey.findMany({ include: { hotkeys: true } });

    for (const coldkey of coldkeys) {
      const balances = await this.bittensor.fetchColdkeyBalances(coldkey.address);
      await this.prisma.coldkey.update({
        where: { id: coldkey.id },
        data: {
          taoBalance: balances.taoBalance,
          alphaBalance: balances.alphaBalance,
          alphaStake: balances.alphaStake,
          lastSyncAt: now,
        },
      });
      await this.prisma.balanceSnapshot.create({
        data: {
          coldkeyId: coldkey.id,
          taoBalance: balances.taoBalance,
          alphaBalance: balances.alphaBalance,
          alphaStake: balances.alphaStake,
        },
      });

      for (const hotkey of coldkey.hotkeys) {
        const metrics = this.bittensor.findMinerMetrics(subnetMetrics, hotkey.address);
        if (!metrics) continue;

        const previousRank = hotkey.rank;
        const previousEmission = hotkey.emission ? Number(hotkey.emission) : null;
        const previousF1 = hotkey.f1 ? Number(hotkey.f1) : null;

        await this.prisma.hotkey.update({
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

        await this.prisma.metricSnapshot.create({
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

        await this.checkAlerts(hotkey.id, coldkey.userId, {
          previousRank,
          previousEmission,
          previousF1,
          currentRank: metrics.rank,
          currentEmission: metrics.emission,
          currentF1: metrics.f1,
        });
      }
    }

    this.logger.log(`Sync complete: ${coldkeys.length} coldkeys processed`);
  }

  private async checkAlerts(
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
    const alerts = await this.prisma.alert.findMany({
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

      if (triggered) {
        await this.sendAlert(alert.channel, alert.destination, message);
      }
    }
  }

  private async sendAlert(channel: string, destination: string, message: string) {
    if (channel === 'DISCORD') {
      await fetch(destination, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: `[SN32 Tracker] ${message}` }),
      }).catch(() => undefined);
    }
    this.logger.log(`Alert (${channel}): ${message}`);
  }
}
