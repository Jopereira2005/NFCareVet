import { Module } from '@nestjs/common';
import { GuardiansController } from './guardians.controller';
import { GuardiansService } from './guardians.service';
import { GuardiansRepository } from './guardians.repository';

@Module({
  controllers: [GuardiansController],
  providers: [GuardiansService, GuardiansRepository],
  exports: [GuardiansService, GuardiansRepository],
})
export class GuardiansModule {}
