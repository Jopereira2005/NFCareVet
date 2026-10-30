import { Injectable } from '@nestjs/common';
import {
  Guardian,
  Hospitalization,
  HospitalizationStatus,
  Kennel,
  NfcTag,
  Patient,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

export type GuardianPatientWithRelations = Patient & {
  hospitalizations: (Hospitalization & {
    kennel: Kennel;
    nfcTag: NfcTag | null;
  })[];
};

export type GuardianWithPatients = Guardian & {
  patients: GuardianPatientWithRelations[];
};

const guardianInclude = {
  patients: {
    orderBy: { createdAt: 'desc' as const },
    include: {
      hospitalizations: {
        where: { status: HospitalizationStatus.ACTIVE },
        orderBy: { admissionDate: 'desc' as const },
        take: 1,
        include: {
          kennel: true,
          nfcTag: true,
        },
      },
    },
  },
};

@Injectable()
export class GuardiansRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<GuardianWithPatients | null> {
    return this.prisma.guardian.findUnique({
      where: { id },
      include: guardianInclude,
    });
  }

  async findRecent(limit: number): Promise<GuardianWithPatients[]> {
    return this.prisma.guardian.findMany({
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: guardianInclude,
    });
  }

  async findAll(): Promise<GuardianWithPatients[]> {
    return this.prisma.guardian.findMany({
      orderBy: { createdAt: 'desc' },
      include: guardianInclude,
    });
  }

  async findByCpf(cpf: string): Promise<Guardian | null> {
    const digits = cpf.replace(/\D/g, '');
    const guardians = await this.prisma.guardian.findMany({
      where: { cpf: { not: null } },
    });

    return (
      guardians.find(
        (g) => g.cpf === cpf || (digits.length > 0 && g.cpf?.replace(/\D/g, '') === digits),
      ) ?? null
    );
  }

  async create(
    data: Prisma.GuardianCreateInput,
  ): Promise<GuardianWithPatients> {
    return this.prisma.guardian.create({
      data,
      include: guardianInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.GuardianUpdateInput,
  ): Promise<GuardianWithPatients> {
    return this.prisma.guardian.update({
      where: { id },
      data,
      include: guardianInclude,
    });
  }
}
