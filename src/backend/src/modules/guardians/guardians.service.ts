import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import {
  GuardianPatientWithRelations,
  GuardiansRepository,
  GuardianWithPatients,
} from './guardians.repository';
import { CreateGuardianDto } from './dto/create-guardian.dto';
import { UpdateGuardianDto } from './dto/update-guardian.dto';
import { GuardianResponseDto } from './dto/guardian-response.dto';
import { PatientResponseDto } from '../patients/dto/patient-response.dto';

function normalizeText(value: string): string {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

@Injectable()
export class GuardiansService {
  constructor(private readonly guardiansRepository: GuardiansRepository) {}

  async findById(id: string): Promise<GuardianResponseDto> {
    const guardian = await this.guardiansRepository.findById(id);

    if (!guardian) {
      throw new NotFoundException(`Tutor com ID "${id}" não encontrado.`);
    }

    return this.toResponseDto(guardian);
  }

  async search(query?: string): Promise<GuardianResponseDto[]> {
    const guardians = await this.guardiansRepository.findAll();
    const mapped = guardians.map((guardian) => this.toResponseDto(guardian));

    const term = normalizeText(query ?? '');
    if (!term) {
      return mapped;
    }

    const digitsTerm = term.replace(/\D/g, '');

    return mapped.filter((guardian) => {
      const searchable = [
        guardian.name,
        guardian.cpf ?? '',
        ...guardian.patients.map((patient) => patient.name),
      ];

      const matchesText = searchable.some((value) =>
        normalizeText(value).includes(term),
      );
      const matchesCpfDigits =
        digitsTerm.length > 0 &&
        Boolean(guardian.cpf?.replace(/\D/g, '').includes(digitsTerm));

      return matchesText || matchesCpfDigits;
    });
  }

  async create(dto: CreateGuardianDto): Promise<GuardianResponseDto> {
    const trimmedCpf = dto.cpf?.trim() || null;

    if (trimmedCpf) {
      const existingCpf = await this.guardiansRepository.findByCpf(trimmedCpf);
      if (existingCpf) {
        throw new ConflictException(
          'Já existe um tutor cadastrado com este CPF.',
        );
      }
    }

    const created = await this.guardiansRepository.create({
      name: dto.name.trim(),
      phone: dto.phone.trim(),
      cpf: trimmedCpf,
      email: dto.email?.trim().toLowerCase() || null,
      address: dto.address?.trim() || null,
    });

    return this.toResponseDto(created);
  }

  async update(
    id: string,
    dto: UpdateGuardianDto,
  ): Promise<GuardianResponseDto> {
    const existing = await this.guardiansRepository.findById(id);

    if (!existing) {
      throw new NotFoundException(`Tutor com ID "${id}" não encontrado.`);
    }

    if (dto.cpf !== undefined && dto.cpf !== null && dto.cpf.trim() !== '') {
      const trimmedCpf = dto.cpf.trim();
      const conflict = await this.guardiansRepository.findByCpf(trimmedCpf);
      if (conflict && conflict.id !== id) {
        throw new ConflictException(
          'Já existe outro tutor cadastrado com este CPF.',
        );
      }
    }

    const data: Prisma.GuardianUpdateInput = {};

    if (dto.name !== undefined) data.name = dto.name.trim();
    if (dto.phone !== undefined) data.phone = dto.phone.trim();
    if (dto.cpf !== undefined) {
      data.cpf = dto.cpf ? dto.cpf.trim() : null;
    }
    if (dto.email !== undefined) {
      data.email = dto.email ? dto.email.trim().toLowerCase() : null;
    }
    if (dto.address !== undefined) {
      data.address = dto.address ? dto.address.trim() : null;
    }

    const updated = await this.guardiansRepository.update(id, data);
    return this.toResponseDto(updated);
  }

  private toResponseDto(guardian: GuardianWithPatients): GuardianResponseDto {
    const guardianSummary = {
      id: guardian.id,
      name: guardian.name,
      cpf: guardian.cpf,
      email: guardian.email,
      phone: guardian.phone,
      address: guardian.address,
      createdAt: guardian.createdAt,
      updatedAt: guardian.updatedAt,
    };

    return {
      ...guardianSummary,
      isActive: true,
      patients: (guardian.patients ?? []).map((patient) =>
        this.toPatientDto(patient, guardianSummary),
      ),
    };
  }

  private toPatientDto(
    patient: GuardianPatientWithRelations,
    guardianSummary: {
      id: string;
      name: string;
      cpf: string | null;
      email: string | null;
      phone: string;
      address: string | null;
      createdAt: Date;
      updatedAt: Date;
    },
  ): PatientResponseDto {
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
      isFasting: patient.isFasting,
      isCastrated: patient.isCastrated,
      behaviorNotes: patient.behaviorNotes,
      createdAt: patient.createdAt,
      updatedAt: patient.updatedAt,
      guardian: guardianSummary,
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
