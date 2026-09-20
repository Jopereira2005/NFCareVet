import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  Hospitalization,
  Patient,
  Kennel,
  NfcTag,
  EventType,
} from '@prisma/client';

export type HospitalizationWithRelations = Hospitalization & {
  patient: Patient;
  kennel: Kennel;
  nfcTag: NfcTag | null;
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

@Injectable()
export class HospitalizationsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<HospitalizationWithRelations | null> {
    return this.prisma.hospitalization.findUnique({
      where: { id },
      include: {
        patient: true,
        kennel: true,
        nfcTag: true,
      },
    });
  }

  async findActiveByPatientId(
    patientId: string,
  ): Promise<HospitalizationWithRelations | null> {
    return this.prisma.hospitalization.findFirst({
      where: {
        patientId,
        status: 'ACTIVE',
      },
      include: {
        patient: true,
        kennel: true,
        nfcTag: true,
      },
    });
  }

  async findAllActive(): Promise<HospitalizationWithRelations[]> {
    return this.prisma.hospitalization.findMany({
      where: { status: 'ACTIVE' },
      orderBy: { admissionDate: 'desc' },
      include: {
        patient: true,
        kennel: true,
        nfcTag: true,
      },
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
          patient: true,
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
          patient: true,
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
}
