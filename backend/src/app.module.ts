import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { BullModule } from '@nestjs/bullmq';
import { PrismaModule } from './prisma/prisma.module';
import { AuthModule } from './auth/auth.module';
import { ColdkeysModule } from './coldkeys/coldkeys.module';
import { HotkeysModule } from './hotkeys/hotkeys.module';
import { MetricsModule } from './metrics/metrics.module';
import { PortfolioModule } from './portfolio/portfolio.module';
import { AlertsModule } from './alerts/alerts.module';
import { SyncModule } from './sync/sync.module';
import { LeaderboardModule } from './leaderboard/leaderboard.module';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    BullModule.forRoot({
      connection: {
        url: process.env.REDIS_URL || 'redis://localhost:6379',
      },
    }),
    PrismaModule,
    AuthModule,
    ColdkeysModule,
    HotkeysModule,
    MetricsModule,
    PortfolioModule,
    AlertsModule,
    SyncModule,
    LeaderboardModule,
  ],
})
export class AppModule {}
