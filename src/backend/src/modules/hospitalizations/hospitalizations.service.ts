import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventType, HospitalizationStatus, Patient } from '@prisma/client';
import { DischargeReason } from '@nfcarevet/common';
import {
  HospitalizationsRepository,
  HospitalizationWithRelations,
} from './hospitalizations.repository';
import { CreateHospitalizationDto } from './dto/create-hospitalization.dto';
import { TransferKennelDto } from './dto/transfer-kennel.dto';
import { LinkTagDto } from './dto/link-tag.dto';
import { UnlinkTagDto } from './dto/unlink-tag.dto';
import { DischargeDto } from './dto/discharge.dto';
import {
  HospitalizationResponseDto,
  LinkTagResponseDto,
  UnlinkTagResponseDto,
  TransferKennelResponseDto,
  DischargeResponseDto,
} from './dto/hospitalization-response.dto';

@Injectable()
export class HospitalizationsService {
  constructor(
    private readonly repository: HospitalizationsRepository,
    private readonly configService: ConfigService,
  ) {}

  async create(
    dto: CreateHospitalizationDto,
    currentUserId: string,
  ): Promise<HospitalizationResponseDto> {
    const patient = await this.repository.findPatientById(dto.patientId);
    if (!patient) {
      throw new NotFoundException(
        `Paciente com ID "${dto.patientId}" não encontrado.`,
      );
    }

    const activePatientHosp = await this.repository.findActiveByPatientId(
      dto.patientId,
    );
    if (activePatientHosp) {
      throw new ConflictException(
        `O paciente "${patient.name}" já possui uma internação ativa em andamento.`,
      );
    }

    const kennel = await this.repository.findKennelById(dto.kennelId);
    if (!kennel) {
      throw new NotFoundException(
        `Baia/Canil com ID "${dto.kennelId}" não encontrada.`,
      );
    }
    if (!kennel.isActive) {
      throw new BadRequestException(
        `A baia "${kennel.name}" está inativa e não pode receber novas internações.`,
      );
    }

    const activeKennelHosp = await this.repository.findActiveByKennelId(
      dto.kennelId,
    );
    if (activeKennelHosp) {
      const occupantName =
        activeKennelHosp.patient?.name || activeKennelHosp.id;
      throw new ConflictException(
        `A baia "${kennel.name}" já está ocupada pelo paciente "${occupantName}".`,
      );
    }

    const responsibleVetId = dto.responsibleVetId || currentUserId;
    const vet = await this.repository.findUserById(responsibleVetId);
    if (!vet) {
      throw new NotFoundException(
        `Veterinário responsável com ID "${responsibleVetId}" não encontrado.`,
      );
    }

    let tagIdToLink: string | null = null;
    let tagInfo: { tagUid: string; publicCode: string } | null = null;

    if (dto.tagIdentifier) {
      const tag = await this.repository.findTagByIdentifier(dto.tagIdentifier);
      if (!tag) {
        throw new NotFoundException(
          `Tag NFC com identificador "${dto.tagIdentifier}" não encontrada no inventário.`,
        );
      }
      if (!tag.active) {
        throw new BadRequestException(
          `A tag NFC [${tag.tagUid}] está inativada no inventário e não pode ser vinculada.`,
        );
      }
      if (
        tag.hospitalization &&
        tag.hospitalization.status === HospitalizationStatus.ACTIVE
      ) {
        const linkedPatient =
          tag.hospitalization.patient?.name || tag.hospitalization.id;
        throw new ConflictException(
          `A tag NFC [${tag.tagUid}] já está vinculada ao paciente "${linkedPatient}".`,
        );
      }
      tagIdToLink = tag.id;
      tagInfo = { tagUid: tag.tagUid, publicCode: tag.publicCode };
    }

    const tagDesc = tagInfo ? ` Tag NFC [${tagInfo.tagUid}] associada.` : '';
    const created = await this.repository.createHospitalization(
      {
        patientId: dto.patientId,
        kennelId: dto.kennelId,
        admissionReason: dto.admissionReason,
        nfcTagId: tagIdToLink,
      },
      {
        userId: responsibleVetId,
        eventType: EventType.OBSERVATION,
        title: 'Admissão Hospitalar (Check-in)',
        description: `Paciente ${patient.name} admitido na baia "${kennel.name}". Motivo: ${dto.admissionReason}. Diagnóstico preliminar: ${dto.preliminaryDiagnosis}.${tagDesc}`,
        metrics: {
          admissionReason: dto.admissionReason,
          preliminaryDiagnosis: dto.preliminaryDiagnosis,
          kennelName: kennel.name,
          responsibleVetId,
          tagUid: tagInfo?.tagUid,
          publicCode: tagInfo?.publicCode,
        },
      },
    );

    return this.toResponseDto(created);
  }

  async transferKennel(
    hospitalizationId: string,
    dto: TransferKennelDto,
    userId: string,
  ): Promise<TransferKennelResponseDto> {
    const hospitalization = await this.repository.findById(hospitalizationId);

    if (!hospitalization) {
      throw new NotFoundException(
        `Internação com ID "${hospitalizationId}" não encontrada.`,
      );
    }

    if (hospitalization.status !== HospitalizationStatus.ACTIVE) {
      throw new BadRequestException(
        'Não é possível transferir de baia uma internação que não está ativa.',
      );
    }

    if (hospitalization.kennelId === dto.targetKennelId) {
      throw new BadRequestException(
        'O paciente já se encontra alojado nesta baia/canil.',
      );
    }

    const targetKennel = await this.repository.findKennelById(dto.targetKennelId);
    if (!targetKennel) {
      throw new NotFoundException(
        `Baia/Canil de destino com ID "${dto.targetKennelId}" não encontrada.`,
      );
    }
    if (!targetKennel.isActive) {
      throw new BadRequestException(
        `A baia de destino "${targetKennel.name}" está inativa.`,
      );
    }

    const activeHospInTarget = await this.repository.findActiveByKennelId(
      dto.targetKennelId,
    );
    if (activeHospInTarget) {
      const currentPatientName =
        activeHospInTarget.patient?.name || activeHospInTarget.id;
      throw new ConflictException(
        `A baia de destino "${targetKennel.name}" já está ocupada pelo paciente "${currentPatientName}".`,
      );
    }

    const fromKennelName = hospitalization.kennel?.name || 'Baia anterior';
    const reasonText = dto.reason ? ` Motivo: ${dto.reason}` : '';

    const updated = await this.repository.transferKennel(
      hospitalization.id,
      dto.targetKennelId,
      {
        userId,
        eventType: EventType.OBSERVATION,
        title: 'Transferência de Baia/Leito',
        description: `Paciente ${hospitalization.patient.name} transferido da baia "${fromKennelName}" para "${targetKennel.name}".${reasonText}`,
        metrics: {
          fromKennelId: hospitalization.kennelId,
          fromKennelName,
          toKennelId: targetKennel.id,
          toKennelName: targetKennel.name,
          reason: dto.reason,
        },
      },
    );

    return {
      message: `Paciente transferido com sucesso para a baia "${targetKennel.name}".`,
      fromKennelId: hospitalization.kennelId,
      toKennelId: targetKennel.id,
      hospitalization: this.toResponseDto(updated),
    };
  }

  async linkTag(
    hospitalizationId: string,
    dto: LinkTagDto,
    userId: string,
  ): Promise<LinkTagResponseDto> {
    const hospitalization = await this.repository.findById(hospitalizationId);

    if (!hospitalization) {
      throw new NotFoundException(
        `Internação com ID "${hospitalizationId}" não encontrada.`,
      );
    }

    if (hospitalization.status !== HospitalizationStatus.ACTIVE) {
      throw new BadRequestException(
        'Não é possível vincular uma tag NFC a uma internação que não está ativa.',
      );
    }

    const tag = await this.repository.findTagByIdentifier(dto.tagIdentifier);

    if (!tag) {
      throw new NotFoundException(
        `Tag NFC com identificador "${dto.tagIdentifier}" não encontrada no inventário.`,
      );
    }

    if (!tag.active) {
      throw new BadRequestException(
        `A tag NFC [${tag.tagUid}] está inativada no inventário e não pode ser vinculada a um paciente.`,
      );
    }

    if (
      tag.hospitalization &&
      tag.hospitalization.id !== hospitalizationId &&
      tag.hospitalization.status === HospitalizationStatus.ACTIVE
    ) {
      const patientName =
        tag.hospitalization.patient?.name || tag.hospitalization.id;
      throw new ConflictException(
        `A tag NFC [${tag.tagUid}] já está vinculada à internação ativa do paciente "${patientName}".`,
      );
    }

    if (hospitalization.nfcTagId === tag.id) {
      return {
        message: 'A tag NFC já está vinculada a esta internação.',
        hospitalization: this.toResponseDto(hospitalization),
      };
    }

    const updated = await this.repository.linkTag(hospitalization.id, tag.id, {
      userId,
      eventType: EventType.OBSERVATION,
      title: 'Vínculo de Tag NFC',
      description: `Tag NFC [${tag.tagUid}] vinculada ao paciente ${hospitalization.patient.name}.`,
      metrics: {
        tagUid: tag.tagUid,
        publicCode: tag.publicCode,
      },
    });

    return {
      message: 'Tag NFC vinculada ao paciente com sucesso.',
      hospitalization: this.toResponseDto(updated),
    };
  }

  async linkTagToPatient(
    patientId: string,
    dto: LinkTagDto,
    userId: string,
  ): Promise<LinkTagResponseDto> {
    const hospitalization = await this.repository.findActiveByPatientId(patientId);

    if (!hospitalization) {
      throw new NotFoundException(
        `Nenhuma internação ativa encontrada para o paciente com ID "${patientId}".`,
      );
    }

    return this.linkTag(hospitalization.id, dto, userId);
  }

  async unlinkTag(
    hospitalizationId: string,
    dto: UnlinkTagDto,
    userId: string,
  ): Promise<UnlinkTagResponseDto> {
    const hospitalization = await this.repository.findById(hospitalizationId);

    if (!hospitalization) {
      throw new NotFoundException(
        `Internação com ID "${hospitalizationId}" não encontrada.`,
      );
    }

    if (hospitalization.status !== HospitalizationStatus.ACTIVE) {
      throw new BadRequestException(
        'Não é possível desvincular uma tag NFC de uma internação que não está ativa.',
      );
    }

    if (!hospitalization.nfcTagId || !hospitalization.nfcTag) {
      throw new BadRequestException(
        'Esta internação não possui nenhuma tag NFC vinculada atualmente.',
      );
    }

    const oldTag = hospitalization.nfcTag;
    const reasonText = dto?.reason ? ` Motivo: ${dto.reason}` : '';

    await this.repository.unlinkTag(hospitalization.id, {
      userId,
      eventType: EventType.OBSERVATION,
      title: 'Desvinculação de Tag NFC',
      description: `Tag NFC [${oldTag.tagUid}] desvinculada do paciente ${hospitalization.patient.name}.${reasonText}`,
      metrics: {
        tagUid: oldTag.tagUid,
        publicCode: oldTag.publicCode,
        reason: dto?.reason,
      },
    });

    return {
      message:
        'Tag NFC desvinculada com sucesso. A tag agora está disponível no inventário.',
      hospitalizationId: hospitalization.id,
      freedTagUid: oldTag.tagUid,
      freedPublicCode: oldTag.publicCode,
    };
  }

  async unlinkTagFromPatient(
    patientId: string,
    dto: UnlinkTagDto,
    userId: string,
  ): Promise<UnlinkTagResponseDto> {
    const hospitalization = await this.repository.findActiveByPatientId(patientId);

    if (!hospitalization) {
      throw new NotFoundException(
        `Nenhuma internação ativa encontrada para o paciente com ID "${patientId}".`,
      );
    }

    return this.unlinkTag(hospitalization.id, dto, userId);
  }

  async discharge(
    hospitalizationId: string,
    dto: DischargeDto,
    userId: string,
  ): Promise<DischargeResponseDto> {
    const hospitalization = await this.repository.findById(hospitalizationId);

    if (!hospitalization) {
      throw new NotFoundException(
        `Internação com ID "${hospitalizationId}" não encontrada.`,
      );
    }

    if (hospitalization.status !== HospitalizationStatus.ACTIVE) {
      throw new BadRequestException(
        'Esta internação já foi finalizada ou não está ativa.',
      );
    }

    const freedTag = hospitalization.nfcTag;
    const dischargeDate = new Date();

    const targetStatus =
      dto?.dischargeReason === DischargeReason.EXTERNAL_TRANSFER
        ? HospitalizationStatus.TRANSFERRED
        : HospitalizationStatus.DISCHARGED;

    const descriptionParts: string[] = [
      `Encerramento de internação concedido ao paciente ${hospitalization.patient.name}.`,
    ];
    if (dto?.dischargeReason) {
      descriptionParts.push(`Motivo da alta: ${dto.dischargeReason}`);
    }
    if (dto?.dischargeNotes) {
      descriptionParts.push(`Evolução/Instruções: ${dto.dischargeNotes}`);
    }
    if (dto?.medicalRecommendations) {
      descriptionParts.push(`Recomendações ao tutor: ${dto.medicalRecommendations}`);
    }
    if (freedTag) {
      descriptionParts.push(`Tag NFC [${freedTag.tagUid}] desvinculada e liberada no inventário.`);
    }

    const updated = await this.repository.discharge(
      hospitalization.id,
      targetStatus,
      dischargeDate,
      {
        userId,
        eventType: EventType.OBSERVATION,
        title:
          targetStatus === HospitalizationStatus.TRANSFERRED
            ? 'Transferência Externa Hospitalar'
            : 'Alta Médica Hospitalar',
        description: descriptionParts.join(' | '),
        metrics: {
          dischargeReason: dto?.dischargeReason,
          dischargeNotes: dto?.dischargeNotes,
          medicalRecommendations: dto?.medicalRecommendations,
          freedTagUid: freedTag?.tagUid,
          freedPublicCode: freedTag?.publicCode,
        },
      },
    );

    return {
      message: 'Alta hospitalar realizada com sucesso.',
      hospitalizationId: updated.id,
      status: updated.status,
      dischargeReason: dto?.dischargeReason || null,
      patient: this.toResponseDto(updated).patient,
      dischargeDate: updated.dischargeDate ?? dischargeDate,
      freedTagUid: freedTag?.tagUid || null,
      freedPublicCode: freedTag?.publicCode || null,
    };
  }

  async dischargeByPatient(
    patientId: string,
    dto: DischargeDto,
    userId: string,
  ): Promise<DischargeResponseDto> {
    const hospitalization = await this.repository.findActiveByPatientId(patientId);

    if (!hospitalization) {
      throw new NotFoundException(
        `Nenhuma internação ativa encontrada para o paciente com ID "${patientId}".`,
      );
    }

    return this.discharge(hospitalization.id, dto, userId);
  }

  async findAllActive(): Promise<HospitalizationResponseDto[]> {
    const list = await this.repository.findAllActive();
    return list.map((item) => this.toResponseDto(item));
  }

  async findHistoryByPatient(
    patientId: string,
  ): Promise<HospitalizationResponseDto[]> {
    const patient = await this.repository.findPatientById(patientId);
    if (!patient) {
      throw new NotFoundException(
        `Paciente com ID "${patientId}" não encontrado.`,
      );
    }

    const list = await this.repository.findHistoryByPatientId(patientId);
    return list.map((item) => this.toResponseDto(item));
  }

  async findById(id: string): Promise<HospitalizationResponseDto> {
    const hospitalization = await this.repository.findById(id);
    if (!hospitalization) {
      throw new NotFoundException(
        `Internação com ID "${id}" não encontrada.`,
      );
    }
    return this.toResponseDto(hospitalization);
  }

  async findActiveByPatient(
    patientId: string,
  ): Promise<HospitalizationResponseDto> {
    const hospitalization = await this.repository.findActiveByPatientId(patientId);
    if (!hospitalization) {
      throw new NotFoundException(
        `Nenhuma internação ativa encontrada para o paciente com ID "${patientId}".`,
      );
    }
    return this.toResponseDto(hospitalization);
  }

  private generateClinicalAlerts(patient: Patient): string[] {
    const alerts: string[] = [];

    if (patient.isFasting) {
      alerts.push('JEJUM OBRIGATÓRIO');
    }

    if (patient.allergies && patient.allergies.trim().length > 0) {
      alerts.push(`ALERGIA: ${patient.allergies.trim()}`);
    }

    if (patient.behaviorNotes && patient.behaviorNotes.trim().length > 0) {
      alerts.push(`COMPORTAMENTO: ${patient.behaviorNotes.trim()}`);
    }

    return alerts;
  }

  private toResponseDto(
    item: HospitalizationWithRelations,
  ): HospitalizationResponseDto {
    const appBaseUrl = this.configService.get<string>(
      'APP_BASE_URL',
      'https://app.suaclinica.com',
    );

    const guardian = item.patient.guardian
      ? {
          id: item.patient.guardian.id,
          name: item.patient.guardian.name,
          phone: item.patient.guardian.phone,
          email: item.patient.guardian.email || null,
        }
      : null;

    return {
      id: item.id,
      patientId: item.patientId,
      kennelId: item.kennelId,
      nfcTagId: item.nfcTagId,
      admissionReason: item.admissionReason,
      status: item.status,
      admissionDate: item.admissionDate,
      dischargeDate: item.dischargeDate,
      clinicalAlerts: this.generateClinicalAlerts(item.patient),
      patient: {
        id: item.patient.id,
        name: item.patient.name,
        species: item.patient.species,
        breed: item.patient.breed,
        weightKg: item.patient.weightKg,
        isFasting: item.patient.isFasting,
        isCastrated: item.patient.isCastrated,
        allergies: item.patient.allergies,
        behaviorNotes: item.patient.behaviorNotes,
        guardian,
      },
      kennel: {
        id: item.kennel.id,
        name: item.kennel.name,
        notes: item.kennel.notes,
      },
      nfcTag: item.nfcTag
        ? {
            id: item.nfcTag.id,
            tagUid: item.nfcTag.tagUid,
            publicCode: item.nfcTag.publicCode,
            active: item.nfcTag.active,
            targetUrl: `${appBaseUrl}/bedside/${item.nfcTag.publicCode}`,
          }
        : null,
      clinicalEvents: item.clinicalEvents
        ? item.clinicalEvents.map((evt) => ({
            id: evt.id,
            eventType: evt.eventType,
            title: evt.title,
            description: evt.description,
            metrics: evt.metrics,
            recordedAt: evt.recordedAt,
          }))
        : undefined,
    };
  }
}
