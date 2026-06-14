import { Module } from '@nestjs/common';
import { ColdkeysService } from './coldkeys.service';
import { ColdkeysController } from './coldkeys.controller';

@Module({
  controllers: [ColdkeysController],
  providers: [ColdkeysService],
  exports: [ColdkeysService],
})
export class ColdkeysModule {}
