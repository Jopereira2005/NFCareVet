import { Injectable } from '@nestjs/common';
import { HospitalizationStatus, Prisma } from '@prisma/client';
import { PrismaService } from '../../database/prisma.service';

const kennelWithActiveOccupancyInclude = {
  hospitalizations: {
    where: { status: HospitalizationStatus.ACTIVE },
    orderBy: { admissionDate: 'desc' as const },
    take: 1,
    select: {
      id: true,
      patient: {
        select: {
          id: true,
          name: true,
        },
      },
    },
  },
} satisfies Prisma.KennelInclude;

export type KennelWithActiveOccupancy = Prisma.KennelGetPayload<{
  include: typeof kennelWithActiveOccupancyInclude;
}>;

@Injectable()
export class KennelsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findAllActiveWithOccupant(): Promise<KennelWithActiveOccupancy[]> {
    return this.prisma.kennel.findMany({
      where: { isActive: true },
      orderBy: { name: 'asc' },
      include: kennelWithActiveOccupancyInclude,
    });
  }
}
