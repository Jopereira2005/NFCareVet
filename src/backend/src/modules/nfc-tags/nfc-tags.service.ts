import { Injectable, ConflictException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { CreateNfcTagDto } from './dto/create-nfc-tag.dto';
import { NfcTagsRepository } from './nfc-tags.repository';
import { NfcTagResponseDto } from './dto/nfc-tag-response.dto';

@Injectable()
export class NfcTagsService {
  constructor(
    private readonly nfcTagsRepository: NfcTagsRepository,
    private readonly configService: ConfigService,
  ) {}

  async registerTag(dto: CreateNfcTagDto): Promise<NfcTagResponseDto> {
    const existingTag = await this.nfcTagsRepository.findByTagUid(dto.tagUid);

    if (existingTag) {
      throw new ConflictException(
        `Tag física [${dto.tagUid}] já cadastrada no inventário.`,
      );
    }

    const publicCode = `tag-${randomUUID()}`;
    const newTag = await this.nfcTagsRepository.create({
      tagUid: dto.tagUid,
      publicCode,
      active: true,
    });

    const appBaseUrl = this.configService.get<string>(
      'APP_BASE_URL',
      'https://app.suaclinica.com',
    );
    const targetUrl = `${appBaseUrl}/bedside/${newTag.publicCode}`;

    return {
      id: newTag.id,
      tagUid: newTag.tagUid,
      publicCode: newTag.publicCode,
      active: newTag.active,
      targetUrl,
      createdAt: newTag.createdAt,
    };
  }
}
