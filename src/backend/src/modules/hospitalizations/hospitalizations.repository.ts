import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  Hospitalization,
  Patient,
  Kennel,
  NfcTag,
  Guardian,
  ClinicalEvent,
  EventType,
  HospitalizationStatus,
} from '@prisma/client';

export type HospitalizationWithRelations = Hospitalization & {
  patient: Patient & { guardian?: Guardian | null };
  kennel: Kennel;
  nfcTag: NfcTag | null;
  clinicalEvents?: ClinicalEvent[];
};

export type NfcTagWithActiveHospitalization = NfcTag & {
  hospitalization: (Hospitalization & { patient: Patient }) | null;
};

export interface ClinicalEventInput {
  userId: string;
  eventType: EventType;
  title: string;
  description?: string;
  metrics?: any;
}

export interface CreateHospitalizationData {
  patientId: string;
  kennelId: string;
  admissionReason: string;
  nfcTagId?: string | null;
}

@Injectable()
export class HospitalizationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<HospitalizationWithRelations | null> {
    return this.prisma.hospitalization.findUnique({
      where: { id },
      include: {
        patient: {
          include: { guardian: true },
        },
        kennel: true,
        nfcTag: true,
        clinicalEvents: {
          orderBy: { recordedAt: 'desc' },
        },
      },
    });
  }

  async findActiveByPatientId(
    patientId: string,
  ): Promise<HospitalizationWithRelations | null> {
    return this.prisma.hospitalization.findFirst({
      where: {
        patientId,
        status: HospitalizationStatus.ACTIVE,
      },
      include: {
        patient: {
          include: { guardian: true },
        },
        kennel: true,
        nfcTag: true,
      },
    });
  }

  async findAllActive(): Promise<HospitalizationWithRelations[]> {
    return this.prisma.hospitalization.findMany({
      where: { status: HospitalizationStatus.ACTIVE },
      orderBy: { admissionDate: 'desc' },
      include: {
        patient: {
          include: { guardian: true },
        },
        kennel: true,
        nfcTag: true,
      },
    });
  }

  async findHistoryByPatientId(
    patientId: string,
  ): Promise<HospitalizationWithRelations[]> {
    return this.prisma.hospitalization.findMany({
      where: { patientId },
      orderBy: { admissionDate: 'desc' },
      include: {
        patient: {
          include: { guardian: true },
        },
        kennel: true,
        nfcTag: true,
        clinicalEvents: {
          orderBy: { recordedAt: 'desc' },
        },
      },
    });
  }

  async findPatientById(
    patientId: string,
  ): Promise<(Patient & { guardian?: Guardian | null }) | null> {
    return this.prisma.patient.findUnique({
      where: { id: patientId },
      include: { guardian: true },
    });
  }

  async findKennelById(kennelId: string): Promise<Kennel | null> {
    return this.prisma.kennel.findUnique({
      where: { id: kennelId },
    });
  }

  async findActiveByKennelId(
    kennelId: string,
  ): Promise<HospitalizationWithRelations | null> {
    return this.prisma.hospitalization.findFirst({
      where: {
        kennelId,
        status: HospitalizationStatus.ACTIVE,
      },
      include: {
        patient: {
          include: { guardian: true },
        },
        kennel: true,
        nfcTag: true,
      },
    });
  }

  async findUserById(userId: string) {
    return this.prisma.user.findUnique({
      where: { id: userId },
    });
  }

  async findTagByIdentifier(
    identifier: string,
  ): Promise<NfcTagWithActiveHospitalization | null> {
    // 1. Tenta por ID direto (UUID)
    let tag = await this.prisma.nfcTag.findUnique({
      where: { id: identifier },
      include: {
        hospitalization: {
          include: { patient: true },
        },
      },
    });

    if (tag) return tag;

    // 2. Tenta por publicCode exato
    tag = await this.prisma.nfcTag.findUnique({
      where: { publicCode: identifier },
      include: {
        hospitalization: {
          include: { patient: true },
        },
      },
    });

    if (tag) return tag;

    // 3. Tenta por tagUid sanitizado (ex: 04:A2:3B -> 04A23B)
    const sanitizedUid = identifier.replace(/[:\s-]/g, '').toUpperCase();
    return this.prisma.nfcTag.findUnique({
      where: { tagUid: sanitizedUid },
      include: {
        hospitalization: {
          include: { patient: true },
        },
      },
    });
  }

  async createHospitalization(
    data: CreateHospitalizationData,
    clinicalEvent: ClinicalEventInput,
  ): Promise<HospitalizationWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const hospitalization = await tx.hospitalization.create({
        data: {
          patientId: data.patientId,
          kennelId: data.kennelId,
          admissionReason: data.admissionReason,
          nfcTagId: data.nfcTagId || null,
          status: HospitalizationStatus.ACTIVE,
          admissionDate: new Date(),
        },
        include: {
          patient: {
            include: { guardian: true },
          },
          kennel: true,
          nfcTag: true,
        },
      });

      await tx.clinicalEvent.create({
        data: {
          hospitalizationId: hospitalization.id,
          userId: clinicalEvent.userId,
          eventType: clinicalEvent.eventType,
          title: clinicalEvent.title,
          description: clinicalEvent.description || null,
          metrics: clinicalEvent.metrics || undefined,
        },
      });

      return hospitalization;
    });
  }

  async transferKennel(
    hospitalizationId: string,
    targetKennelId: string,
    clinicalEvent: ClinicalEventInput,
  ): Promise<HospitalizationWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hospitalization.update({
        where: { id: hospitalizationId },
        data: { kennelId: targetKennelId },
        include: {
          patient: {
            include: { guardian: true },
          },
          kennel: true,
          nfcTag: true,
        },
      });

      await tx.clinicalEvent.create({
        data: {
          hospitalizationId,
          userId: clinicalEvent.userId,
          eventType: clinicalEvent.eventType,
          title: clinicalEvent.title,
          description: clinicalEvent.description || null,
          metrics: clinicalEvent.metrics || undefined,
        },
      });

      return updated;
    });
  }

  async linkTag(
    hospitalizationId: string,
    nfcTagId: string,
    clinicalEvent: ClinicalEventInput,
  ): Promise<HospitalizationWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hospitalization.update({
        where: { id: hospitalizationId },
        data: { nfcTagId },
        include: {
          patient: {
            include: { guardian: true },
          },
          kennel: true,
          nfcTag: true,
        },
      });

      await tx.clinicalEvent.create({
        data: {
          hospitalizationId,
          userId: clinicalEvent.userId,
          eventType: clinicalEvent.eventType,
          title: clinicalEvent.title,
          description: clinicalEvent.description || null,
          metrics: clinicalEvent.metrics || undefined,
        },
      });

      return updated;
    });
  }

  async unlinkTag(
    hospitalizationId: string,
    clinicalEvent: ClinicalEventInput,
  ): Promise<HospitalizationWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hospitalization.update({
        where: { id: hospitalizationId },
        data: { nfcTagId: null },
        include: {
          patient: {
            include: { guardian: true },
          },
          kennel: true,
          nfcTag: true,
        },
      });

      await tx.clinicalEvent.create({
        data: {
          hospitalizationId,
          userId: clinicalEvent.userId,
          eventType: clinicalEvent.eventType,
          title: clinicalEvent.title,
          description: clinicalEvent.description || null,
          metrics: clinicalEvent.metrics || undefined,
        },
      });

      return updated;
    });
  }

  async discharge(
    hospitalizationId: string,
    status: HospitalizationStatus,
    dischargeDate: Date,
    clinicalEvent: ClinicalEventInput,
  ): Promise<HospitalizationWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.hospitalization.update({
        where: { id: hospitalizationId },
        data: {
          status,
          dischargeDate,
          nfcTagId: null,
        },
        include: {
          patient: {
            include: { guardian: true },
          },
          kennel: true,
          nfcTag: true,
        },
      });

      await tx.prescription.updateMany({
        where: {
          hospitalizationId,
          isActive: true,
        },
        data: {
          isActive: false,
        },
      });

      await tx.clinicalEvent.create({
        data: {
          hospitalizationId,
          userId: clinicalEvent.userId,
          eventType: clinicalEvent.eventType,
          title: clinicalEvent.title,
          description: clinicalEvent.description || null,
          metrics: clinicalEvent.metrics || undefined,
        },
      });

      return updated;
    });
  }
}
