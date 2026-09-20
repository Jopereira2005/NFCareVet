import { Module } from '@nestjs/common';
import { HospitalizationsController } from './hospitalizations.controller';
import { HospitalizationsService } from './hospitalizations.service';
import { HospitalizationsRepository } from './hospitalizations.repository';

@Module({
  controllers: [HospitalizationsController],
  providers: [HospitalizationsService, HospitalizationsRepository],
  exports: [HospitalizationsService, HospitalizationsRepository],
})
export class HospitalizationsModule {}
