import { Injectable, Logger, OnModuleInit } from '@nestjs/common';
import { InjectQueue } from '@nestjs/bullmq';
import { Queue } from 'bullmq';
import { PrismaService } from '../prisma/prisma.service';
import { SYNC_QUEUE } from './sync.processor';

@Injectable()
export class SyncSchedulerService implements OnModuleInit {
  private readonly logger = new Logger(SyncSchedulerService.name);

  constructor(
    @InjectQueue(SYNC_QUEUE) private syncQueue: Queue,
    private prisma: PrismaService,
  ) {}

  async onModuleInit() {
    const intervalMinutes = parseInt(process.env.SYNC_INTERVAL_MINUTES || '10', 10);
    await this.prisma.syncConfig.upsert({
      where: { id: 'default' },
      create: { id: 'default', intervalMinutes },
      update: { intervalMinutes },
    });

    await this.syncQueue.add(
      'full-sync',
      {},
      {
        repeat: { every: intervalMinutes * 60 * 1000 },
        removeOnComplete: 100,
        removeOnFail: 50,
      },
    );

    this.logger.log(`Sync scheduled every ${intervalMinutes} minutes`);
  }

  async triggerSync() {
    await this.syncQueue.add('manual-sync', {});
    return { status: 'queued' };
  }

  async getConfig() {
    return this.prisma.syncConfig.findUnique({ where: { id: 'default' } });
  }

  async updateInterval(minutes: number) {
    const allowed = [5, 10, 30, 60];
    if (!allowed.includes(minutes)) {
      throw new Error('Interval must be 5, 10, 30, or 60 minutes');
    }
    await this.prisma.syncConfig.update({
      where: { id: 'default' },
      data: { intervalMinutes: minutes },
    });
    await this.syncQueue.obliterate({ force: true });
    await this.syncQueue.add(
      'full-sync',
      {},
      { repeat: { every: minutes * 60 * 1000 } },
    );
    return { intervalMinutes: minutes };
  }
}
