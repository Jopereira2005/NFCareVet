import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import {
  PrescriptionStatus,
  PrescriptionItem,
  ClinicalEvent,
  EventType,
  PrescriptionItemType,
} from '@prisma/client';

@Injectable()
export class BedsideRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findTagWithActiveHospitalization(identifier: string) {
    const includeHospitalization = {
      hospitalization: {
        where: { status: 'ACTIVE' as const },
        include: {
          patient: {
            include: {
              guardian: true,
            },
          },
          kennel: true,
          prescriptions: {
            where: { isActive: true },
            include: {
              prescribedBy: {
                select: { id: true, name: true, email: true },
              },
              items: {
                orderBy: { scheduledTime: 'asc' as const },
              },
            },
          },
          clinicalEvents: {
            take: 15,
            orderBy: { recordedAt: 'desc' as const },
            include: {
              user: {
                select: { id: true, name: true, role: true },
              },
            },
          },
        },
      },
    };

    let tag = await this.prisma.nfcTag.findUnique({
      where: { publicCode: identifier },
      include: includeHospitalization,
    });

    if (tag) return tag;

    const sanitizedUid = identifier.replace(/[:\s-]/g, '').toUpperCase();
    tag = await this.prisma.nfcTag.findUnique({
      where: { tagUid: sanitizedUid },
      include: includeHospitalization,
    });

    if (tag) return tag;

    return this.prisma.nfcTag.findUnique({
      where: { id: identifier },
      include: includeHospitalization,
    });
  }

  async findLatestVitalSigns(hospitalizationId: string) {
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

  async findPrescriptionItemById(itemId: string) {
    return this.prisma.prescriptionItem.findUnique({
      where: { id: itemId },
      include: {
        prescription: true,
      },
    });
  }

  async applyPrescriptionItem(
    itemId: string,
    userId: string,
    bedsideNotes?: string,
    metrics?: Record<string, any>,
  ): Promise<{ updatedItem: PrescriptionItem; clinicalEvent: ClinicalEvent }> {
    return this.prisma.$transaction(async (tx) => {
      const item = await tx.prescriptionItem.findUniqueOrThrow({
        where: { id: itemId },
        include: { prescription: true },
      });

      const updatedItem = await tx.prescriptionItem.update({
        where: { id: itemId },
        data: { status: PrescriptionStatus.APPLIED },
      });

      let eventType: EventType = EventType.MEDICATION_APPLICATION;
      if (item.itemType === PrescriptionItemType.VITAL_CHECK) {
        eventType = EventType.VITAL_SIGNS;
      } else if (item.itemType === PrescriptionItemType.PROCEDURE) {
        eventType = EventType.PROCEDURE;
      } else if (item.itemType === PrescriptionItemType.EXAM) {
        eventType = EventType.EXAM;
      }

      const clinicalEvent = await tx.clinicalEvent.create({
        data: {
          hospitalizationId: item.prescription.hospitalizationId,
          prescriptionItemId: item.id,
          userId,
          eventType,
          title: `Execução de item: ${item.title}`,
          description: bedsideNotes || null,
          metrics: metrics ? (metrics as any) : undefined,
        },
      });

      return { updatedItem, clinicalEvent };
    });
  }
}
