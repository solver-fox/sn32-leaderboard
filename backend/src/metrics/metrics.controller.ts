import { Controller, Get, Param, Query, UseGuards, Req, NotFoundException } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { MetricsService } from './metrics.service';

@Controller('metrics')
@UseGuards(JwtAuthGuard)
export class MetricsController {
  constructor(private metricsService: MetricsService) {}

  @Get('hotkeys/:id')
  async getHotkeyMetrics(
    @Req() req: { user: { userId: string } },
    @Param('id') id: string,
    @Query('range') range?: '24h' | '7d' | '30d' | '90d' | 'all',
  ) {
    const result = await this.metricsService.getHotkeyMetrics(req.user.userId, id, range ?? '7d');
    if (!result) throw new NotFoundException('Hotkey not found');
    return result;
  }
}
