import {
  Injectable,
  NotFoundException,
  BadRequestException,
  Logger,
} from '@nestjs/common';
import { BedsideRepository } from './bedside.repository';
import { PrescriptionStatus, Patient } from '@prisma/client';
import { QuickRecordResponseDto } from './dto/quick-record-response.dto';
import { ApplyMedicationResponseDto } from './dto/apply-medication-response.dto';
import { calculateAgeDisplay } from '../../common/utils/date.utils';

@Injectable()
export class BedsideService {
  private readonly logger = new Logger(BedsideService.name);

  constructor(private readonly bedsideRepository: BedsideRepository) {}

  async getQuickRecordByTag(identifier: string): Promise<QuickRecordResponseDto> {
    const tag = await this.bedsideRepository.findTagWithActiveHospitalization(identifier);

    if (!tag || !tag.hospitalization) {
      this.logger.warn(
        `[BEDSIDE] Consulta rápida falhou: nenhuma internação ativa vinculada à coleira NFC [${identifier}].`,
      );
      throw new NotFoundException(
        `Nenhuma internação ativa encontrada para a coleira NFC informada ("${identifier}").`,
      );
    }

    const {
      patient,
      kennel,
      prescriptions,
      clinicalEvents,
      id: hospitalizationId,
      admissionReason,
      admissionDate,
    } = tag.hospitalization;

    const latestVitalSignsEvent = await this.bedsideRepository.findLatestVitalSigns(hospitalizationId);

    this.logger.log(
      `[BEDSIDE] Prontuário consultado via coleira NFC: identifier=${identifier}, internacaoId=${hospitalizationId}, paciente=${patient.name}`,
    );

    return {
      hospitalizationId,
      admissionReason,
      admissionDate,
      clinicalAlerts: this.generateClinicalAlerts(patient),
      nfcTag: {
        id: tag.id,
        tagUid: tag.tagUid,
        publicCode: tag.publicCode,
      },
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
        birthDate: patient.birthDate,
        ageDisplay: calculateAgeDisplay(patient.birthDate),
        bloodType: patient.bloodType,
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
      latestVitalSigns: latestVitalSignsEvent
        ? {
            ...(latestVitalSignsEvent.metrics as any),
            recordedAt: latestVitalSignsEvent.recordedAt,
            measuredBy: latestVitalSignsEvent.user?.name,
          }
        : null,
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
      this.logger.warn(`[BEDSIDE] Falha ao aplicar: item de prescrição [${itemId}] não encontrado.`);
      throw new NotFoundException('Item de prescrição não encontrado.');
    }

    if (item.status === PrescriptionStatus.APPLIED) {
      this.logger.warn(
        `[BEDSIDE] Falha ao aplicar: item [${itemId}] já foi registrado como aplicado anteriormente.`,
      );
      throw new BadRequestException('Este item de prescrição já foi registrado como aplicado.');
    }

    try {
      const { updatedItem, clinicalEvent } = await this.bedsideRepository.applyPrescriptionItem(
        itemId,
        userId,
        bedsideNotes,
        metrics,
      );

      this.logger.log(
        `[BEDSIDE] Medicação aplicada com sucesso: itemId=${itemId}, executorUserId=${userId}, clinicalEventId=${clinicalEvent.id}`,
      );

      return {
        message: 'Procedimento registrado com sucesso',
        prescriptionItem: updatedItem,
        clinicalEvent,
      };
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error;
      }
      this.logger.error(
        `[BEDSIDE] Erro inesperado ao registrar medicação [${itemId}]: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private generateClinicalAlerts(patient: Patient): string[] {
    const alerts: string[] = [];

    if (patient.isFasting) {
      alerts.push('JEJUM OBRIGATÓRIO');
    }

    if (patient.bloodType && patient.bloodType.trim().length > 0) {
      alerts.push(`TIPO SANGUÍNEO: ${patient.bloodType.trim()}`);
    }

    if (patient.allergies && patient.allergies.trim().length > 0) {
      alerts.push(`ALERGIA: ${patient.allergies.trim()}`);
    }

    if (patient.behaviorNotes && patient.behaviorNotes.trim().length > 0) {
      alerts.push(`COMPORTAMENTO: ${patient.behaviorNotes.trim()}`);
    }

    return alerts;
  }
}