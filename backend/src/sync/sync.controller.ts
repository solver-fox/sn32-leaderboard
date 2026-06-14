import { Controller, Get, Post, Patch, Body, UseGuards } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { SyncSchedulerService } from './sync.scheduler';

@Controller('sync')
@UseGuards(JwtAuthGuard)
export class SyncController {
  constructor(private syncScheduler: SyncSchedulerService) {}

  @Get('config')
  getConfig() {
    return this.syncScheduler.getConfig();
  }

  @Patch('config')
  updateConfig(@Body('intervalMinutes') intervalMinutes: number) {
    return this.syncScheduler.updateInterval(intervalMinutes);
  }

  @Post('trigger')
  trigger() {
    return this.syncScheduler.triggerSync();
  }
}
