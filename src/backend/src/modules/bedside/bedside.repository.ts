import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { PrescriptionStatus, Prescription, AuditLog } from '@prisma/client';

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
            patient: true,
            prescriptions: {
              orderBy: { scheduledTime: 'asc' },
            },
          },
        },
      },
    });
  }

  async findPrescriptionById(prescriptionId: string): Promise<Prescription | null> {
    return this.prisma.prescription.findUnique({
      where: { id: prescriptionId },
    });
  }

  async applyMedication(
    prescriptionId: string,
    userId: string,
    bedsideNotes?: string,
  ): Promise<{ updatedPrescription: Prescription; auditLog: AuditLog }> {
    return this.prisma.$transaction(async (tx) => {
      const updatedPrescription = await tx.prescription.update({
        where: { id: prescriptionId },
        data: { status: PrescriptionStatus.APPLIED },
      });

      const auditLog = await tx.auditLog.create({
        data: {
          prescriptionId,
          userId,
          bedsideNotes,
        },
      });

      return { updatedPrescription, auditLog };
    });
  }
}
