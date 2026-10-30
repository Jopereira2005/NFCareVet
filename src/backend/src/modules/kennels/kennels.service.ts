import { Injectable } from '@nestjs/common';
import {
  KennelsRepository,
  KennelWithActiveOccupancy,
} from './kennels.repository';
import { KennelResponseDto } from './dto/kennel-response.dto';

@Injectable()
export class KennelsService {
  constructor(private readonly repository: KennelsRepository) {}

  async listActive(): Promise<KennelResponseDto[]> {
    const kennels = await this.repository.findAllActiveWithOccupant();
    return kennels.map((kennel) => this.toResponseDto(kennel));
  }

  private toResponseDto(kennel: KennelWithActiveOccupancy): KennelResponseDto {
    const activeHospitalization = kennel.hospitalizations[0] ?? null;
    const occupant = activeHospitalization?.patient
      ? {
          patientId: activeHospitalization.patient.id,
          patientName: activeHospitalization.patient.name,
        }
      : null;

    return {
      id: kennel.id,
      name: kennel.name,
      notes: kennel.notes,
      isActive: kennel.isActive,
      createdAt: kennel.createdAt,
      occupant,
    };
  }
}
