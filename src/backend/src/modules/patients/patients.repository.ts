import { Injectable } from '@nestjs/common';
import {
  Guardian,
  Hospitalization,
  HospitalizationStatus,
  Kennel,
  NfcTag,
  Patient,
  PatientSex,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';
import { HistoryPeriod } from './dto/patient-visits-query.dto';

export type ActiveHospitalizationWithRelations = Hospitalization & {
  kennel: Kennel;
  nfcTag: NfcTag | null;
};

export type PatientWithRelations = Patient & {
  guardian: Guardian;
  hospitalizations: ActiveHospitalizationWithRelations[];
};

export type HospitalizationVisitWithPatient = Hospitalization & {
  patient: PatientWithRelations;
};

const patientRelationsInclude = {
  guardian: true,
  hospitalizations: {
    where: { status: HospitalizationStatus.ACTIVE },
    orderBy: { admissionDate: 'desc' as const },
    take: 1,
    include: {
      kennel: true,
      nfcTag: true,
    },
  },
};

@Injectable()
export class PatientsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<PatientWithRelations | null> {
    return this.prisma.patient.findUnique({
      where: { id },
      include: patientRelationsInclude,
    });
  }

  async findAll(filters: {
    species?: string;
    sex?: PatientSex;
    hospitalized?: boolean;
  }): Promise<PatientWithRelations[]> {
    const where: Prisma.PatientWhereInput = {};

    if (filters.species) {
      where.species = { equals: filters.species, mode: 'insensitive' };
    }

    if (filters.sex) {
      where.sex = filters.sex;
    }

    if (filters.hospitalized === true) {
      where.hospitalizations = {
        some: { status: HospitalizationStatus.ACTIVE },
      };
    } else if (filters.hospitalized === false) {
      where.hospitalizations = {
        none: { status: HospitalizationStatus.ACTIVE },
      };
    }

    return this.prisma.patient.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: patientRelationsInclude,
    });
  }

  async findVisitsByPeriod(
    period: HistoryPeriod,
  ): Promise<HospitalizationVisitWithPatient[]> {
    const now = new Date();
    let startDate: Date;

    if (period === 'today') {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        now.getDate(),
        0,
        0,
        0,
        0,
      );
    } else if (period === 'week') {
      startDate = new Date(now);
      startDate.setDate(now.getDate() - 7);
      startDate.setHours(0, 0, 0, 0);
    } else {
      startDate = new Date(
        now.getFullYear(),
        now.getMonth(),
        1,
        0,
        0,
        0,
        0,
      );
    }

    return this.prisma.hospitalization.findMany({
      where: {
        admissionDate: { gte: startDate },
      },
      orderBy: { admissionDate: 'desc' },
      include: {
        patient: {
          include: patientRelationsInclude,
        },
      },
    });
  }

  async findGuardianById(guardianId: string): Promise<Guardian | null> {
    return this.prisma.guardian.findUnique({
      where: { id: guardianId },
    });
  }

  async create(
    data: Prisma.PatientUncheckedCreateInput,
  ): Promise<PatientWithRelations> {
    return this.prisma.patient.create({
      data,
      include: patientRelationsInclude,
    });
  }

  async update(
    id: string,
    data: Prisma.PatientUncheckedUpdateInput,
  ): Promise<PatientWithRelations> {
    return this.prisma.patient.update({
      where: { id },
      data,
      include: patientRelationsInclude,
    });
  }
}
