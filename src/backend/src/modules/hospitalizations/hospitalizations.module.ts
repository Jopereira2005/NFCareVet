import { Module } from '@nestjs/common';
import { HospitalizationsController } from './hospitalizations.controller';
import { HospitalizationsService } from './hospitalizations.service';
import { HospitalizationsRepository } from './hospitalizations.repository';
import { NfcTagsModule } from '../nfc-tags/nfc-tags.module';

@Module({
  imports: [NfcTagsModule],
  controllers: [HospitalizationsController],
  providers: [HospitalizationsService, HospitalizationsRepository],
  exports: [HospitalizationsService, HospitalizationsRepository],
})
export class HospitalizationsModule {}
