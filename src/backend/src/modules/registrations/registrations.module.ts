import { Module } from '@nestjs/common';
import { PatientsModule } from '../patients/patients.module';
import { GuardiansModule } from '../guardians/guardians.module';
import { RegistrationsController } from './registrations.controller';
import { RegistrationsService } from './registrations.service';

@Module({
  imports: [PatientsModule, GuardiansModule],
  controllers: [RegistrationsController],
  providers: [RegistrationsService],
})
export class RegistrationsModule {}
