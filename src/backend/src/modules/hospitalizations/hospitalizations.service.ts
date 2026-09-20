import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { EventType } from '@prisma/client';
import {
  HospitalizationsRepository,
  HospitalizationWithRelations,
} from './hospitalizations.repository';
import { LinkTagDto } from './dto/link-tag.dto';
import { UnlinkTagDto } from './dto/unlink-tag.dto';
import {
  HospitalizationResponseDto,
  LinkTagResponseDto,
  UnlinkTagResponseDto,
} from './dto/hospitalization-response.dto';

@Injectable()
export class HospitalizationsService {
  constructor(
    private readonly repository: HospitalizationsRepository,
    private readonly configService: ConfigService,
  ) {}

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

    if (hospitalization.status !== 'ACTIVE') {
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
      tag.hospitalization.status === 'ACTIVE'
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

    if (hospitalization.status !== 'ACTIVE') {
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

  async findAllActive(): Promise<HospitalizationResponseDto[]> {
    const list = await this.repository.findAllActive();
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

  private toResponseDto(
    item: HospitalizationWithRelations,
  ): HospitalizationResponseDto {
    const appBaseUrl = this.configService.get<string>(
      'APP_BASE_URL',
      'https://app.suaclinica.com',
    );

    return {
      id: item.id,
      patientId: item.patientId,
      kennelId: item.kennelId,
      nfcTagId: item.nfcTagId,
      admissionReason: item.admissionReason,
      status: item.status,
      admissionDate: item.admissionDate,
      dischargeDate: item.dischargeDate,
      patient: {
        id: item.patient.id,
        name: item.patient.name,
        species: item.patient.species,
        breed: item.patient.breed,
        weightKg: item.patient.weightKg,
        isFasting: item.patient.isFasting,
        isCastrated: item.patient.isCastrated,
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
    };
  }
}
