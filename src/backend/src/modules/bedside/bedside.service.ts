import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { BedsideRepository } from './bedside.repository';
import {
  HospitalizationStatus,
  PrescriptionStatus,
  Patient,
} from '@prisma/client';
import {
  QuickRecordResponseDto,
  BedsidePendingTaskDto,
} from './dto/quick-record-response.dto';
import { FullRecordResponseDto } from './dto/full-record-response.dto';
import { ApplyMedicationResponseDto } from './dto/apply-medication-response.dto';
import { calculateAgeDisplay } from '../../common/utils/date.utils';

@Injectable()
export class BedsideService {
  private readonly logger = new Logger(BedsideService.name);

  constructor(private readonly bedsideRepository: BedsideRepository) {}

  async getBriefRecordByTag(identifier: string): Promise<QuickRecordResponseDto> {
    const tag = await this.bedsideRepository.findBriefRecordByTag(identifier);

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
      id: hospitalizationId,
      admissionReason,
      admissionDate,
    } = tag.hospitalization;

    const latestVitalSignsEvent =
      await this.bedsideRepository.findLatestVitalSigns(hospitalizationId);

    const now = new Date();
    const pendingTasks: BedsidePendingTaskDto[] = [];

    if (prescriptions && prescriptions.length > 0) {
      for (const prescription of prescriptions) {
        if (prescription.items) {
          for (const item of prescription.items) {
            pendingTasks.push({
              id: item.id,
              itemType: item.itemType,
              title: item.title,
              dosage: item.dosage,
              route: item.route,
              scheduledTime: item.scheduledTime,
              isOverdue: new Date(item.scheduledTime) < now,
              instructions: item.instructions,
            });
          }
        }
      }
    }

    pendingTasks.sort(
      (a, b) =>
        new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime(),
    );

    this.logger.log(
      `[BEDSIDE] Prontuário breve consultado via coleira NFC: identifier=${identifier}, internacaoId=${hospitalizationId}, paciente=${patient.name}`,
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
      pendingTasks,
    };
  }

  async getFullRecordByTag(identifier: string): Promise<FullRecordResponseDto> {
    const tag = await this.bedsideRepository.findFullRecordByTag(identifier);

    if (!tag || !tag.hospitalization) {
      this.logger.warn(
        `[BEDSIDE] Consulta de prontuário completo falhou: nenhuma internação ativa vinculada à coleira NFC [${identifier}].`,
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

    const latestVitalSignsEvent =
      await this.bedsideRepository.findLatestVitalSigns(hospitalizationId);

    const now = new Date();
    const pendingTasks: BedsidePendingTaskDto[] = [];

    if (prescriptions && prescriptions.length > 0) {
      for (const prescription of prescriptions) {
        if (prescription.items) {
          for (const item of prescription.items) {
            if (item.status === 'PENDING') {
              pendingTasks.push({
                id: item.id,
                itemType: item.itemType,
                title: item.title,
                dosage: item.dosage,
                route: item.route,
                scheduledTime: item.scheduledTime,
                isOverdue: new Date(item.scheduledTime) < now,
                instructions: item.instructions,
              });
            }
          }
        }
      }
    }

    pendingTasks.sort(
      (a, b) =>
        new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime(),
    );

    this.logger.log(
      `[BEDSIDE] Prontuário COMPLETO consultado via coleira NFC: identifier=${identifier}, internacaoId=${hospitalizationId}, paciente=${patient.name}`,
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
      pendingTasks,
      prescriptions: prescriptions || [],
      clinicalEvents: clinicalEvents || [],
    };
  }

  async getQuickRecordByTag(identifier: string): Promise<QuickRecordResponseDto> {
    return this.getBriefRecordByTag(identifier);
  }

  async applyMedication(
    itemId: string,
    userId: string,
    bedsideNotes?: string,
    metrics?: Record<string, any>,
    idempotencyKey?: string,
  ): Promise<ApplyMedicationResponseDto> {
    const trimmedKey = idempotencyKey?.trim() || undefined;

    if (trimmedKey) {
      const existingEvent =
        await this.bedsideRepository.findClinicalEventByIdempotencyKey(
          trimmedKey,
        );

      if (existingEvent) {
        if (existingEvent.prescriptionItemId && existingEvent.prescriptionItemId !== itemId) {
          throw new ConflictException(
            'Esta chave de idempotência (Idempotency-Key) já foi utilizada para outro item de prescrição.',
          );
        }

        if (existingEvent.prescriptionItem) {
          this.logger.log(
            `[BEDSIDE] Requisição idempotente detectada (Idempotency-Key=${trimmedKey}): retornando resultado já registrado para itemId=${itemId}.`,
          );
          const { prescriptionItem, ...clinicalEventData } = existingEvent;
          return {
            message: 'Procedimento registrado com sucesso',
            prescriptionItem,
            clinicalEvent: clinicalEventData,
          };
        }
      }
    }

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

    if (item.status === PrescriptionStatus.CANCELLED || item.status !== PrescriptionStatus.PENDING) {
      this.logger.warn(
        `[BEDSIDE] Falha ao aplicar: item [${itemId}] encontra-se cancelado/suspenso.`,
      );
      throw new BadRequestException(
        'Não é possível aplicar um item de prescrição que foi cancelado/suspenso.',
      );
    }

    if (!item.prescription.isActive) {
      this.logger.warn(
        `[BEDSIDE] Falha ao aplicar: prescrição [${item.prescriptionId}] do item [${itemId}] está inativa.`,
      );
      throw new BadRequestException(
        'Não é possível aplicar um item cuja prescrição foi inativada.',
      );
    }

    if (item.prescription.hospitalization.status !== HospitalizationStatus.ACTIVE) {
      this.logger.warn(
        `[BEDSIDE] Falha ao aplicar: internação [${item.prescription.hospitalizationId}] do item [${itemId}] não está ativa.`,
      );
      throw new BadRequestException(
        'Não é possível aplicar um item de prescrição em uma internação inativa ou encerrada.',
      );
    }

    try {
      const { updatedItem, clinicalEvent } = await this.bedsideRepository.applyPrescriptionItem(
        itemId,
        userId,
        bedsideNotes,
        metrics,
        trimmedKey,
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
      if (
        error instanceof NotFoundException ||
        error instanceof BadRequestException ||
        error instanceof ConflictException
      ) {
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