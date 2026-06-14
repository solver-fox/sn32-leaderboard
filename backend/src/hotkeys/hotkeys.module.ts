import { Module } from '@nestjs/common';
import { HotkeysService } from './hotkeys.service';
import { HotkeysController } from './hotkeys.controller';

@Module({
  controllers: [HotkeysController],
  providers: [HotkeysService],
  exports: [HotkeysService],
})
export class HotkeysModule {}
