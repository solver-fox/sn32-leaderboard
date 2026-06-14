import { Module } from '@nestjs/common';
import { BullModule } from '@nestjs/bullmq';
import { BittensorService } from './bittensor.service';
import { SyncProcessor, SYNC_QUEUE } from './sync.processor';
import { SyncSchedulerService } from './sync.scheduler';
import { SyncController } from './sync.controller';

@Module({
  imports: [BullModule.registerQueue({ name: SYNC_QUEUE })],
  controllers: [SyncController],
  providers: [BittensorService, SyncProcessor, SyncSchedulerService],
  exports: [BittensorService],
})
export class SyncModule {}
