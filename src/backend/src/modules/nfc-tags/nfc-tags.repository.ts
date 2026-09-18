import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NfcTag, Prisma, Hospitalization } from '@prisma/client';

export type NfcTagWithHospitalization = NfcTag & {
  hospitalization: Hospitalization | null;
};

export interface INfcTagsRepository {
  findById(id: string): Promise<NfcTagWithHospitalization | null>;
  findByTagUid(tagUid: string): Promise<NfcTagWithHospitalization | null>;
  findByPublicCode(publicCode: string): Promise<NfcTagWithHospitalization | null>;
  findAll(): Promise<NfcTag[]>;
  create(data: Prisma.NfcTagCreateInput): Promise<NfcTag>;
  update(id: string, data: Prisma.NfcTagUpdateInput): Promise<NfcTag>;
  delete(id: string): Promise<NfcTag>;
}

@Injectable()
export class NfcTagsRepository implements INfcTagsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<NfcTagWithHospitalization | null> {
    return this.prisma.nfcTag.findUnique({
      where: { id },
      include: {
        hospitalization: true,
      },
    });
  }

  async findByTagUid(tagUid: string): Promise<NfcTagWithHospitalization | null> {
    return this.prisma.nfcTag.findUnique({
      where: { tagUid },
      include: {
        hospitalization: true,
      },
    });
  }

  async findByPublicCode(publicCode: string): Promise<NfcTagWithHospitalization | null> {
    return this.prisma.nfcTag.findUnique({
      where: { publicCode },
      include: {
        hospitalization: true,
      },
    });
  }

  async findAll(): Promise<NfcTag[]> {
    return this.prisma.nfcTag.findMany({
      orderBy: { createdAt: 'desc' },
      include: {
        hospitalization: true,
      },
    });
  }

  async create(data: Prisma.NfcTagCreateInput): Promise<NfcTag> {
    return this.prisma.nfcTag.create({
      data,
    });
  }

  async update(id: string, data: Prisma.NfcTagUpdateInput): Promise<NfcTag> {
    return this.prisma.nfcTag.update({
      where: { id },
      data,
    });
  }

  async delete(id: string): Promise<NfcTag> {
    return this.prisma.nfcTag.delete({
      where: { id },
    });
  }
}
