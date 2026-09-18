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

  async findTagWithActiveHospitalization(publicCode: string) {
    return this.prisma.nfcTag.findUnique({
      where: { publicCode },
      include: {
        hospitalization: {
          where: { status: 'ACTIVE' },
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
                  orderBy: { scheduledTime: 'asc' },
                },
              },
            },
            clinicalEvents: {
              take: 10,
              orderBy: { recordedAt: 'desc' },
              include: {
                user: {
                  select: { id: true, name: true },
                },
              },
            },
          },
        },
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
