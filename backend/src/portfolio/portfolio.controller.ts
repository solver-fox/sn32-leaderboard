import { Controller, Get, UseGuards, Req } from '@nestjs/common';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { PortfolioService } from './portfolio.service';

@Controller('portfolio')
@UseGuards(JwtAuthGuard)
export class PortfolioController {
  constructor(private portfolioService: PortfolioService) {}

  @Get('dashboard')
  getDashboard(@Req() req: { user: { userId: string } }) {
    return this.portfolioService.getDashboard(req.user.userId);
  }
}
