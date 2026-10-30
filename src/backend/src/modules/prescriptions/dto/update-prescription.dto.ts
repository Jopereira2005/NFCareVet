import { PartialType } from '@nestjs/swagger';
import {
  CreatePrescriptionDto,
  CreatePrescriptionItemDto,
} from './create-prescription.dto';

export class UpdatePrescriptionItemDto extends PartialType(
  CreatePrescriptionItemDto,
) {}

export class UpdatePrescriptionDto extends PartialType(CreatePrescriptionDto) {}
