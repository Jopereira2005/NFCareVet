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

    const { patient, prescriptions, kennelIdentifier, id: hospitalizationId } = tag.hospitalization;

    return {
      hospitalizationId,
      kennelIdentifier,
      patient: {
        id: patient.id,
        name: patient.name,
        species: patient.species,
        breed: patient.breed,
        weightKg: patient.weightKg,
        photoUrl: patient.photoUrl,
        allergies: patient.allergies,
        isFasting: patient.isFasting,
        behaviorNotes: patient.behaviorNotes,
      },
      prescriptions,
    };
  }

  async applyMedication(
    prescriptionId: string,
    userId: string,
    bedsideNotes?: string,
  ): Promise<ApplyMedicationResponseDto> {
    const prescription = await this.bedsideRepository.findPrescriptionById(prescriptionId);

    if (!prescription) {
      throw new NotFoundException('Prescrição não encontrada.');
    }

    if (prescription.status === PrescriptionStatus.APPLIED) {
      throw new BadRequestException('Esta dose já foi registrada como aplicada.');
    }

    const { updatedPrescription, auditLog } = await this.bedsideRepository.applyMedication(
      prescriptionId,
      userId,
      bedsideNotes,
    );

    return {
      message: 'Procedimento registrado com sucesso',
      prescription: updatedPrescription,
      auditLog,
    };
  }
}