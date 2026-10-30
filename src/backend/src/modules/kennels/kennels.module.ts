import { Module } from '@nestjs/common';
import { KennelsController } from './kennels.controller';
import { KennelsService } from './kennels.service';
import { KennelsRepository } from './kennels.repository';

@Module({
  controllers: [KennelsController],
  providers: [KennelsService, KennelsRepository],
  exports: [KennelsService],
})
export class KennelsModule {}
