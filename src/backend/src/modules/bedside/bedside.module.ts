import { Module } from '@nestjs/common';
import { BedsideController } from './bedside.controller';
import { BedsideService } from './bedside.service';
import { BedsideRepository } from './bedside.repository';

@Module({
  controllers: [BedsideController],
  providers: [BedsideService, BedsideRepository],
  exports: [BedsideService, BedsideRepository],
})
export class BedsideModule {}
