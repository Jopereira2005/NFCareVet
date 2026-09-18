import { Module } from '@nestjs/common';
import { NfcTagsController } from './nfc-tags.controller';
import { NfcTagsService } from './nfc-tags.service';
import { NfcTagsRepository } from './nfc-tags.repository';

@Module({
  controllers: [NfcTagsController],
  providers: [NfcTagsService, NfcTagsRepository],
  exports: [NfcTagsService, NfcTagsRepository],
})
export class NfcTagsModule {}
