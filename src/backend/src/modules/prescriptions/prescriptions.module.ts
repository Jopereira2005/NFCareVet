import { Module } from '@nestjs/common';
import { PrescriptionsService } from './prescriptions.service';
import { PrescriptionsController } from './prescriptions.controller';
import { PrescriptionsRepository } from './prescriptions.repository';
import { HospitalizationsModule } from '../hospitalizations/hospitalizations.module';
import { UsersModule } from '../users/users.module';

@Module({
  imports: [HospitalizationsModule, UsersModule],
  controllers: [PrescriptionsController],
  providers: [PrescriptionsService, PrescriptionsRepository],
  exports: [PrescriptionsService, PrescriptionsRepository],
})
export class PrescriptionsModule {}
