import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import { CancelPrescriptionItemDto } from './dto/cancel-prescription-item.dto';
import { DeactivatePrescriptionDto } from './dto/deactivate-prescription.dto';
import { PendingScheduleQueryDto } from './dto/pending-schedule-query.dto';
import {
  PrescriptionsRepository,
  PrescriptionWithRelations,
  PrescriptionItemWithRelations,
} from './prescriptions.repository';
import {
  PrescriptionResponseDto,
  PrescriptionItemResponseDto,
  CancelItemResponseDto,
  DeactivatePrescriptionResponseDto,
  PendingScheduleItemResponseDto,
} from './dto/prescription-response.dto';
import { HospitalizationsRepository } from '../hospitalizations/hospitalizations.repository';
import {
  HospitalizationStatus,
  PrescriptionStatus,
  EventType,
} from '@prisma/client';
import { UserRole } from '@nfcarevet/common';
import { UsersRepository } from '../users/repositories/users.repository';

@Injectable()
export class PrescriptionsService {
  constructor(
    private readonly prescriptionsRepository: PrescriptionsRepository,
    private readonly hospitalizationsRepository: HospitalizationsRepository,
    private readonly usersRepository: UsersRepository,
  ) {}

  async create(
    hospitalizationId: string,
    prescribedById: string,
    dto: CreatePrescriptionDto,
  ): Promise<PrescriptionResponseDto> {
    const hospitalization =
      await this.hospitalizationsRepository.findById(hospitalizationId);

    if (!hospitalization) {
      throw new NotFoundException(
        `Internação com ID "${hospitalizationId}" não encontrada.`,
      );
    }

    if (hospitalization.status !== HospitalizationStatus.ACTIVE) {
      throw new BadRequestException(
        'Não é possível prescrever para uma internação inativa.',
      );
    }

    const effectivePrescriberId = dto.prescribedById || prescribedById;
    const vet = await this.usersRepository.findById(effectivePrescriberId);
    if (!vet) {
      throw new NotFoundException(
        `Usuário prescritor com ID "${effectivePrescriberId}" não encontrado.`,
      );
    }

    const prescription = await this.prescriptionsRepository.createPrescription(
      hospitalizationId,
      effectivePrescriberId,
      dto,
    );

    return this.toResponseDto(prescription);
  }

  async findActiveByHospitalization(
    hospitalizationId: string,
  ): Promise<PrescriptionResponseDto> {
    const hospitalization =
      await this.hospitalizationsRepository.findById(hospitalizationId);

    if (!hospitalization) {
      throw new NotFoundException(
        `Internação com ID "${hospitalizationId}" não encontrada.`,
      );
    }

    const prescription =
      await this.prescriptionsRepository.findActiveByHospitalizationId(
        hospitalizationId,
      );

    if (!prescription) {
      throw new NotFoundException(
        `Nenhuma prescrição ativa encontrada para a internação "${hospitalizationId}".`,
      );
    }

    return this.toResponseDto(prescription);
  }

  async cancelItem(
    itemId: string,
    userId: string,
    dto: CancelPrescriptionItemDto,
  ): Promise<CancelItemResponseDto> {
    const item = await this.prescriptionsRepository.findItemById(itemId);

    if (!item) {
      throw new NotFoundException(
        `Item de prescrição com ID "${itemId}" não encontrado.`,
      );
    }

    if (item.status === PrescriptionStatus.APPLIED) {
      throw new BadRequestException(
        'Não é possível suspender um item que já foi aplicado à beira do leito.',
      );
    }

    if (item.status === PrescriptionStatus.CANCELLED) {
      throw new BadRequestException(
        'Este item de prescrição já se encontra cancelado/suspenso.',
      );
    }

    const { updatedItem, clinicalEvent } =
      await this.prescriptionsRepository.cancelPrescriptionItem(
        itemId,
        item.prescription.hospitalizationId,
        userId,
        item.title,
        dto.justification,
        dto.notes,
      );

    return {
      message: 'Item de prescrição cancelado com sucesso.',
      item: this.toItemResponseDto(updatedItem),
      clinicalEventId: clinicalEvent.id,
    };
  }

  async deactivate(
    prescriptionId: string,
    dto: DeactivatePrescriptionDto,
  ): Promise<DeactivatePrescriptionResponseDto> {
    const prescription =
      await this.prescriptionsRepository.findById(prescriptionId);

    if (!prescription) {
      throw new NotFoundException(
        `Prescrição com ID "${prescriptionId}" não encontrada.`,
      );
    }

    if (!prescription.isActive) {
      throw new BadRequestException(
        'Esta prescrição já se encontra inativa.',
      );
    }

    const cancelPending = dto?.cancelPendingItems !== false;
    const { prescription: updated, cancelledItemsCount } =
      await this.prescriptionsRepository.deactivatePrescription(
        prescriptionId,
        cancelPending,
      );

    return {
      message: 'Prescrição inativada com sucesso.',
      prescription: this.toResponseDto(updated),
      cancelledItemsCount,
    };
  }

  async findPendingSchedule(
    query: PendingScheduleQueryDto,
  ): Promise<PendingScheduleItemResponseDto[]> {
    const rawItems =
      await this.prescriptionsRepository.findPendingSchedule(query);

    const now = new Date();

    return rawItems.map((raw) => {
      const scheduledDate = new Date(raw.scheduledTime);
      const isOverdue = scheduledDate < now;
      const minutesOverdue = isOverdue
        ? Math.floor((now.getTime() - scheduledDate.getTime()) / 60000)
        : 0;

      return {
        item: this.toItemResponseDto(raw),
        hospitalizationId: raw.prescription.hospitalization.id,
        patient: raw.prescription.hospitalization.patient,
        kennel: raw.prescription.hospitalization.kennel,
        isOverdue,
        minutesOverdue,
      };
    });
  }

  private toResponseDto(
    item: PrescriptionWithRelations,
  ): PrescriptionResponseDto {
    const prescribedBy = item.prescribedBy
      ? {
          id: item.prescribedBy.id,
          name: item.prescribedBy.name,
          email: item.prescribedBy.email,
          role: item.prescribedBy.role as UserRole,
        }
      : undefined;

    return {
      id: item.id,
      hospitalizationId: item.hospitalizationId,
      prescribedById: item.prescribedById,
      generalRecommendations: item.generalRecommendations,
      isActive: item.isActive,
      validUntil: item.validUntil,
      createdAt: item.createdAt,
      prescribedBy,
      items: (item.items || []).map((prescriptionItem) =>
        this.toItemResponseDto(prescriptionItem),
      ),
    };
  }

  private toItemResponseDto(
    item: PrescriptionItemWithRelations,
  ): PrescriptionItemResponseDto {
    const now = new Date();
    const isOverdue =
      item.status === PrescriptionStatus.PENDING &&
      new Date(item.scheduledTime) < now;

    const applyEvent = item.clinicalEvents?.find(
      (evt) => evt.eventType === EventType.MEDICATION_APPLICATION,
    );

    return {
      id: item.id,
      prescriptionId: item.prescriptionId,
      itemType: item.itemType,
      title: item.title,
      dosage: item.dosage,
      route: item.route,
      scheduledTime: item.scheduledTime,
      status: item.status,
      instructions: item.instructions,
      createdAt: item.createdAt,
      isOverdue,
      appliedAt: applyEvent?.recordedAt || null,
      appliedBy: applyEvent?.user
        ? {
            id: applyEvent.user.id,
            name: applyEvent.user.name,
            email: applyEvent.user.email,
            role: applyEvent.user.role as UserRole,
          }
        : null,
    };
  }
}
