import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { CreatePrescriptionDto } from './dto/create-prescription.dto';
import {
  Prescription,
  PrescriptionItem,
  User,
  ClinicalEvent,
  PrescriptionStatus,
  HospitalizationStatus,
  PrescriptionItemType,
  EventType,
} from '@prisma/client';

export type PrescriptionItemWithRelations = PrescriptionItem & {
  clinicalEvents?: (ClinicalEvent & { user?: User | null })[];
};

export type PrescriptionWithRelations = Prescription & {
  prescribedBy?: User | null;
  items?: PrescriptionItemWithRelations[];
};

export type PendingScheduleItemRaw = PrescriptionItem & {
  prescription: Prescription & {
    hospitalization: {
      id: string;
      kennelId: string;
      patient: {
        id: string;
        name: string;
        species: string;
        breed: string | null;
        isFasting: boolean;
        allergies: string | null;
        behaviorNotes: string | null;
      };
      kennel: {
        id: string;
        name: string;
      };
    };
  };
};

@Injectable()
export class PrescriptionsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async createPrescription(
    hospitalizationId: string,
    prescribedById: string,
    dto: CreatePrescriptionDto,
  ): Promise<PrescriptionWithRelations> {
    return this.prisma.$transaction(async (tx) => {
      if (dto.autoDeactivatePrevious !== false) {
        await tx.prescription.updateMany({
          where: {
            hospitalizationId,
            isActive: true,
          },
          data: { isActive: false },
        });
      }

      return tx.prescription.create({
        data: {
          hospitalizationId,
          prescribedById,
          generalRecommendations: dto.generalRecommendations,
          validUntil: dto.validUntil ? new Date(dto.validUntil) : null,
          isActive: true,
          items: {
            create: dto.items.map((item) => ({
              itemType: item.itemType,
              title: item.title,
              dosage: item.dosage,
              route: item.route,
              scheduledTime: new Date(item.scheduledTime),
              instructions: item.instructions,
            })),
          },
        },
        include: {
          prescribedBy: true,
          items: {
            orderBy: { scheduledTime: 'asc' },
            include: {
              clinicalEvents: {
                include: { user: true },
              },
            },
          },
        },
      });
    });
  }

  async findActiveByHospitalizationId(
    hospitalizationId: string,
  ): Promise<PrescriptionWithRelations | null> {
    return this.prisma.prescription.findFirst({
      where: {
        hospitalizationId,
        isActive: true,
      },
      orderBy: { createdAt: 'desc' },
      include: {
        prescribedBy: true,
        items: {
          orderBy: { scheduledTime: 'asc' },
          include: {
            clinicalEvents: {
              include: { user: true },
            },
          },
        },
      },
    });
  }

  async findById(id: string): Promise<PrescriptionWithRelations | null> {
    return this.prisma.prescription.findUnique({
      where: { id },
      include: {
        prescribedBy: true,
        items: {
          orderBy: { scheduledTime: 'asc' },
          include: {
            clinicalEvents: {
              include: { user: true },
            },
          },
        },
      },
    });
  }

  async findItemById(itemId: string) {
    return this.prisma.prescriptionItem.findUnique({
      where: { id: itemId },
      include: {
        prescription: {
          include: { hospitalization: true },
        },
        clinicalEvents: {
          include: { user: true },
        },
      },
    });
  }

  async cancelPrescriptionItem(
    itemId: string,
    hospitalizationId: string,
    userId: string,
    itemTitle: string,
    justification: string,
    notes?: string,
  ): Promise<{ updatedItem: PrescriptionItemWithRelations; clinicalEvent: ClinicalEvent }> {
    return this.prisma.$transaction(async (tx) => {
      const updatedItem = await tx.prescriptionItem.update({
        where: { id: itemId },
        data: {
          status: PrescriptionStatus.CANCELLED,
        },
        include: {
          clinicalEvents: {
            include: { user: true },
          },
        },
      });

      const clinicalEvent = await tx.clinicalEvent.create({
        data: {
          hospitalizationId,
          prescriptionItemId: itemId,
          userId,
          eventType: EventType.OBSERVATION,
          title: `Item suspenso: ${itemTitle}`,
          description: `Justificativa médica: ${justification}${notes ? ` | Observações: ${notes}` : ''}`,
          metrics: {
            action: 'CANCEL_PRESCRIPTION_ITEM',
            justification,
            notes: notes || null,
          },
        },
      });

      return { updatedItem, clinicalEvent };
    });
  }

  async deactivatePrescription(
    prescriptionId: string,
    cancelPendingItems: boolean,
  ): Promise<{ prescription: PrescriptionWithRelations; cancelledItemsCount: number }> {
    return this.prisma.$transaction(async (tx) => {
      let cancelledItemsCount = 0;

      if (cancelPendingItems) {
        const updateResult = await tx.prescriptionItem.updateMany({
          where: {
            prescriptionId,
            status: PrescriptionStatus.PENDING,
          },
          data: {
            status: PrescriptionStatus.CANCELLED,
          },
        });
        cancelledItemsCount = updateResult.count;
      }

      const prescription = await tx.prescription.update({
        where: { id: prescriptionId },
        data: {
          isActive: false,
        },
        include: {
          prescribedBy: true,
          items: {
            orderBy: { scheduledTime: 'asc' },
            include: {
              clinicalEvents: {
                include: { user: true },
              },
            },
          },
        },
      });

      return { prescription, cancelledItemsCount };
    });
  }

  async findPendingSchedule(query: {
    windowHours?: number;
    includeOverdue?: boolean;
    kennelId?: string;
    hospitalizationId?: string;
    itemType?: PrescriptionItemType;
  }): Promise<PendingScheduleItemRaw[]> {
    const now = new Date();
    const windowHours = query.windowHours ?? 4;
    const maxTime = new Date(now.getTime() + windowHours * 60 * 60 * 1000);

    const scheduledTimeFilter: { lte: Date; gte?: Date } = { lte: maxTime };
    if (query.includeOverdue === false) {
      scheduledTimeFilter.gte = now;
    }

    return this.prisma.prescriptionItem.findMany({
      where: {
        status: PrescriptionStatus.PENDING,
        scheduledTime: scheduledTimeFilter,
        ...(query.itemType ? { itemType: query.itemType } : {}),
        prescription: {
          isActive: true,
          hospitalization: {
            status: HospitalizationStatus.ACTIVE,
            ...(query.kennelId ? { kennelId: query.kennelId } : {}),
            ...(query.hospitalizationId ? { id: query.hospitalizationId } : {}),
          },
        },
      },
      orderBy: { scheduledTime: 'asc' },
      include: {
        prescription: {
          include: {
            hospitalization: {
              include: {
                patient: {
                  select: {
                    id: true,
                    name: true,
                    species: true,
                    breed: true,
                    isFasting: true,
                    allergies: true,
                    behaviorNotes: true,
                  },
                },
                kennel: {
                  select: {
                    id: true,
                    name: true,
                  },
                },
              },
            },
          },
        },
      },
    }) as unknown as PendingScheduleItemRaw[];
  }
}