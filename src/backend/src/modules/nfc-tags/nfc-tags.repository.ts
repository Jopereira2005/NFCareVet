import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../database/prisma.service';
import { NfcTag, Prisma } from '@prisma/client';

export interface INfcTagsRepository {
  findByTagUid(tagUid: string): Promise<NfcTag | null>;
  findByPublicCode(publicCode: string): Promise<NfcTag | null>;
  create(data: Prisma.NfcTagCreateInput): Promise<NfcTag>;
}

@Injectable()
export class NfcTagsRepository implements INfcTagsRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByTagUid(tagUid: string): Promise<NfcTag | null> {
    return this.prisma.nfcTag.findUnique({
      where: { tagUid },
    });
  }

  async findByPublicCode(publicCode: string): Promise<NfcTag | null> {
    return this.prisma.nfcTag.findUnique({
      where: { publicCode },
    });
  }

  async create(data: Prisma.NfcTagCreateInput): Promise<NfcTag> {
    return this.prisma.nfcTag.create({
      data,
    });
  }
}
