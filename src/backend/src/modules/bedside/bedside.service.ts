import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { BedsideRepository } from './bedside.repository';
import { PrescriptionStatus } from '@prisma/client';
import { QuickRecordResponseDto } from './dto/quick-record-response.dto';
import { ApplyMedicationResponseDto } from './dto/apply-medication-response.dto';

@Injectable()
export class BedsideService {
  constructor(private readonly bedsideRepository: BedsideRepository) {}

  async getQuickRecordByTag(publicCode: string): Promise<QuickRecordResponseDto> {
    const tag = await this.bedsideRepository.findTagWithActiveHospitalization(publicCode);

    if (!tag || !tag.hospitalization) {
      throw new NotFoundException('Nenhuma internação ativa encontrada para este identificador NFC.');
    }

    const { patient, kennel, prescriptions, clinicalEvents, id: hospitalizationId } = tag.hospitalization;

    return {
      hospitalizationId,
      kennel: {
        id: kennel.id,
        name: kennel.name,
        notes: kennel.notes,
      },
      patient: {
        id: patient.id,
        name: patient.name,
        species: patient.species,
        breed: patient.breed,
        weightKg: patient.weightKg,
        photoUrl: patient.photoUrl,
        allergies: patient.allergies,
        isFasting: patient.isFasting,
        isCastrated: patient.isCastrated,
        behaviorNotes: patient.behaviorNotes,
        guardian: {
          id: patient.guardian.id,
          name: patient.guardian.name,
          phone: patient.guardian.phone,
          email: patient.guardian.email,
          cpf: patient.guardian.cpf,
        },
      },
      prescriptions,
      clinicalEvents,
    };
  }

  async applyMedication(
    itemId: string,
    userId: string,
    bedsideNotes?: string,
    metrics?: Record<string, any>,
  ): Promise<ApplyMedicationResponseDto> {
    const item = await this.bedsideRepository.findPrescriptionItemById(itemId);

    if (!item) {
      throw new NotFoundException('Item de prescrição não encontrado.');
    }

    if (item.status === PrescriptionStatus.APPLIED) {
      throw new BadRequestException('Este item de prescrição já foi registrado como aplicado.');
    }

    const { updatedItem, clinicalEvent } = await this.bedsideRepository.applyPrescriptionItem(
      itemId,
      userId,
      bedsideNotes,
      metrics,
    );

    return {
      message: 'Procedimento registrado com sucesso',
      prescriptionItem: updatedItem,
      clinicalEvent,
    };
  }
}