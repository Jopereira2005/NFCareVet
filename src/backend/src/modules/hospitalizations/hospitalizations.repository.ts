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

  async getTimeline(
    hospitalizationId: string,
    options: {
      skip: number;
      take: number;
      eventType?: EventType;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where: any = {
      hospitalizationId,
    };

    if (options.eventType) {
      where.eventType = options.eventType;
    }

    if (options.startDate || options.endDate) {
      where.recordedAt = {};
      if (options.startDate) where.recordedAt.gte = options.startDate;
      if (options.endDate) where.recordedAt.lte = options.endDate;
    }

    const [items, total] = await Promise.all([
      this.prisma.clinicalEvent.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { recordedAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
      this.prisma.clinicalEvent.count({ where }),
    ]);

    return { items, total };
  }

  async getPatientTimeline(
    patientId: string,
    options: {
      skip: number;
      take: number;
      eventType?: EventType;
      startDate?: Date;
      endDate?: Date;
    },
  ) {
    const where: any = {
      hospitalization: {
        patientId,
      },
    };

    if (options.eventType) {
      where.eventType = options.eventType;
    }

    if (options.startDate || options.endDate) {
      where.recordedAt = {};
      if (options.startDate) where.recordedAt.gte = options.startDate;
      if (options.endDate) where.recordedAt.lte = options.endDate;
    }

    const [items, total] = await Promise.all([
      this.prisma.clinicalEvent.findMany({
        where,
        skip: options.skip,
        take: options.take,
        orderBy: { recordedAt: 'desc' },
        include: {
          user: {
            select: { id: true, name: true, role: true },
          },
        },
      }),
      this.prisma.clinicalEvent.count({ where }),
    ]);

    return { items, total };
  }

  async getLatestVitalSigns(hospitalizationId: string) {
    return this.prisma.clinicalEvent.findFirst({
      where: {
        hospitalizationId,
        eventType: EventType.VITAL_SIGNS,
      },
      orderBy: { recordedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async getLatestVitalSignsByPatient(patientId: string) {
    return this.prisma.clinicalEvent.findFirst({
      where: {
        hospitalization: { patientId },
        eventType: EventType.VITAL_SIGNS,
      },
      orderBy: { recordedAt: 'desc' },
      include: {
        user: { select: { id: true, name: true, role: true } },
      },
    });
  }

  async getTemporalSummary() {
    const now = new Date();

    const startOfToday = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      0,
      0,
      0,
      0,
    );

    const startOfWeek = new Date(now);
    startOfWeek.setDate(now.getDate() - 7);
    startOfWeek.setHours(0, 0, 0, 0);

    const startOfMonth = new Date(
      now.getFullYear(),
      now.getMonth(),
      1,
      0,
      0,
      0,
      0,
    );

    const [
      admissionsToday,
      dischargesToday,
      activeToday,
      admissionsWeek,
      dischargesWeek,
      admissionsMonth,
      dischargesMonth,
      currentlyActive,
      totalKennels,
    ] = await Promise.all([
      this.prisma.hospitalization.count({
        where: { admissionDate: { gte: startOfToday } },
      }),
      this.prisma.hospitalization.count({
        where: { dischargeDate: { gte: startOfToday } },
      }),
      this.prisma.hospitalization.count({
        where: {
          OR: [
            { status: HospitalizationStatus.ACTIVE },
            { dischargeDate: { gte: startOfToday } },
          ],
        },
      }),
      this.prisma.hospitalization.count({
        where: { admissionDate: { gte: startOfWeek } },
      }),
      this.prisma.hospitalization.count({
        where: { dischargeDate: { gte: startOfWeek } },
      }),
      this.prisma.hospitalization.count({
        where: { admissionDate: { gte: startOfMonth } },
      }),
      this.prisma.hospitalization.count({
        where: { dischargeDate: { gte: startOfMonth } },
      }),
      this.prisma.hospitalization.count({
        where: { status: HospitalizationStatus.ACTIVE },
      }),
      this.prisma.kennel.count({
        where: { isActive: true },
      }),
    ]);

    const occupancyRatePercentage =
      totalKennels > 0
        ? parseFloat(((currentlyActive / totalKennels) * 100).toFixed(1))
        : 0;

    return {
      today: {
        admittedCount: admissionsToday,
        dischargedCount: dischargesToday,
        activeCount: activeToday,
      },
      thisWeek: {
        admittedCount: admissionsWeek,
        dischargedCount: dischargesWeek,
      },
      thisMonth: {
        admittedCount: admissionsMonth,
        dischargedCount: dischargesMonth,
      },
      currentlyActive,
      totalKennels,
      occupancyRatePercentage,
    };
  }
}

