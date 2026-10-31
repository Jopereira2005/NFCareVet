import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  PatientsRepository,
  PatientWithRelations,
} from './patients.repository';
import { CreatePatientDto } from './dto/create-patient.dto';
import { UpdatePatientDto } from './dto/update-patient.dto';
import { PatientSearchQueryDto } from './dto/patient-search-query.dto';
import { HistoryPeriod } from './dto/patient-visits-query.dto';
import {
  PatientResponseDto,
  PatientVisitResponseDto,
} from './dto/patient-response.dto';

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

@Injectable()
export class PatientsService {
  constructor(private readonly patientsRepository: PatientsRepository) {}

  async findById(id: string): Promise<PatientResponseDto> {
    const patient = await this.patientsRepository.findById(id);

    if (!patient) {
      throw new NotFoundException(`Paciente com ID "${id}" não encontrado.`);
    }

    return this.toResponseDto(patient);
  }

  async listRecent(limit: number): Promise<PatientResponseDto[]> {
    const patients = await this.patientsRepository.findRecent(limit);
    return patients.map((patient) => this.toResponseDto(patient));
  }

  async search(queryDto: PatientSearchQueryDto): Promise<PatientResponseDto[]> {
    const patients = await this.patientsRepository.findAll({
      species: queryDto.species,
      sex: queryDto.sex,
      hospitalized: queryDto.hospitalized,
    });

    const mapped = patients.map((patient) => this.toResponseDto(patient));
    const term = normalizeText(queryDto.query ?? '');

    if (!term) {
      return mapped;
    }

    return mapped.filter((patient) => {
      const searchable = [
        patient.name,
        patient.breed ?? '',
        patient.guardian?.name ?? '',
        patient.nfcTag?.publicCode ?? '',
        patient.nfcTag?.tagUid ?? '',
      ];

      return searchable.some((value) => normalizeText(value).includes(term));
    });
  }

  async listVisits(
    period: HistoryPeriod = 'today',
  ): Promise<PatientVisitResponseDto[]> {
    const visits = await this.patientsRepository.findVisitsByPeriod(period);

    return visits.map((visit) => ({
      id: visit.id,
      visitedAt: visit.admissionDate,
      patient: this.toResponseDto(visit.patient),
    }));
  }

  async create(dto: CreatePatientDto): Promise<PatientResponseDto> {
    const guardian = await this.patientsRepository.findGuardianById(
      dto.guardianId,
    );

    if (!guardian) {
      throw new NotFoundException(
        `Tutor com ID "${dto.guardianId}" não encontrado.`,
      );
    }

    const created = await this.patientsRepository.create({
      guardianId: dto.guardianId,
      name: dto.name.trim(),
      species: dto.species.trim(),
      sex: dto.sex ?? null,
      breed: dto.breed?.trim() || null,
      birthDate: dto.birthDate ? new Date(dto.birthDate) : null,
      bloodType: dto.bloodType?.trim() || null,
      weightKg: dto.weightKg ?? null,
      photoUrl: dto.photoUrl?.trim() || null,
      allergies: dto.allergies?.trim() || null,
      treatments: (dto.treatments ?? [])
        .map((item) => item.trim())
        .filter(Boolean),
      isFasting: dto.isFasting ?? false,
      isCastrated: dto.isCastrated ?? false,
      behaviorNotes: dto.behaviorNotes?.trim() || null,
    });

    return this.toResponseDto(created);
  }

  async update(id: string, dto: UpdatePatientDto): Promise<PatientResponseDto> {
    const existing = await this.patientsRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Paciente com ID "${id}" não encontrado.`);
    }

    if (dto.guardianId && dto.guardianId !== existing.guardianId) {
      const guardian = await this.patientsRepository.findGuardianById(
        dto.guardianId,
      );
      if (!guardian) {
        throw new NotFoundException(
          `Tutor com ID "${dto.guardianId}" não encontrado.`,
        );
      }
    }

    const data: Prisma.PatientUncheckedUpdateInput = {};

    if (dto.guardianId !== undefined) data.guardianId = dto.guardianId;
    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.species !== undefined) data.species = dto.species.trim();
    if (dto.sex !== undefined) data.sex = dto.sex || null;
    if (dto.breed !== undefined) data.breed = dto.breed?.trim() || null;
    if (dto.birthDate !== undefined) {
      data.birthDate = dto.birthDate ? new Date(dto.birthDate) : null;
    }
    if (dto.bloodType !== undefined) {
      data.bloodType = dto.bloodType?.trim() || null;
    }
    if (dto.weightKg !== undefined) data.weightKg = dto.weightKg;
    if (dto.photoUrl !== undefined) {
      data.photoUrl = dto.photoUrl?.trim() || null;
    }
    if (dto.allergies !== undefined) {
      data.allergies = dto.allergies?.trim() || null;
    }
    if (dto.treatments !== undefined) {
      data.treatments = dto.treatments
        .map((item) => item.trim())
        .filter(Boolean);
    }
    if (dto.isFasting !== undefined) data.isFasting = dto.isFasting;
    if (dto.isCastrated !== undefined) data.isCastrated = dto.isCastrated;
    if (dto.behaviorNotes !== undefined) {
      data.behaviorNotes = dto.behaviorNotes?.trim() || null;
    }

    const updated = await this.patientsRepository.update(id, data);
    return this.toResponseDto(updated);
  }

  private toResponseDto(patient: PatientWithRelations): PatientResponseDto {
    const activeHosp = patient.hospitalizations?.[0] ?? null;
    const activeTag = activeHosp?.nfcTag ?? null;

    return {
      id: patient.id,
      guardianId: patient.guardianId,
      name: patient.name,
      species: patient.species,
      breed: patient.breed,
      sex: patient.sex,
      birthDate: patient.birthDate,
      bloodType: patient.bloodType,
      weightKg:
        patient.weightKg !== null && patient.weightKg !== undefined
          ? Number(patient.weightKg)
          : null,
      photoUrl: patient.photoUrl,
      allergies: patient.allergies,
      treatments: patient.treatments ?? [],
      isFasting: patient.isFasting,
      isCastrated: patient.isCastrated,
      behaviorNotes: patient.behaviorNotes,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      guardian: patient.guardian
        ? {
            id: patient.guardian.id,
            name: patient.guardian.name,
            cpf: patient.guardian.cpf,
            email: patient.guardian.email,
            phone: patient.guardian.phone,
            address: patient.guardian.address,
            photoUrl: patient.guardian.photoUrl,
            isActive: patient.guardian.isActive,
            financial:
              patient.guardian.financialStatus &&
              patient.guardian.paymentMethod
                ? {
                    status: patient.guardian.financialStatus,
                    paymentMethod: patient.guardian.paymentMethod,
                  }
                : null,
            createdAt: patient.guardian.createdAt,
            updatedAt: patient.guardian.updatedAt,
          }
        : undefined,
      nfcTag: activeTag
        ? {
            id: activeTag.id,
            tagUid: activeTag.tagUid,
            publicCode: activeTag.publicCode,
            active: activeTag.active,
            createdAt: activeTag.createdAt,
          }
        : null,
      activeHospitalization: activeHosp
        ? {
            id: activeHosp.id,
            status: activeHosp.status,
            admissionDate: activeHosp.admissionDate,
            admissionReason: activeHosp.admissionReason,
            kennel: activeHosp.kennel
              ? {
                  id: activeHosp.kennel.id,
                  name: activeHosp.kennel.name,
                }
              : null,
          }
        : null,
    };
  }
}
