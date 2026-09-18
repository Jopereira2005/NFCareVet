import {
  Injectable,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { CreateNfcTagDto } from './dto/create-nfc-tag.dto';
import { NfcTagsRepository } from './nfc-tags.repository';
import { NfcTagResponseDto } from './dto/nfc-tag-response.dto';
import { NfcTag } from '@prisma/client';

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

    return this.toResponseDto(newTag);
  }

  async findAll(): Promise<NfcTagResponseDto[]> {
    const tags = await this.nfcTagsRepository.findAll();
    return tags.map((tag) => this.toResponseDto(tag));
  }

  async findOne(identifier: string): Promise<NfcTagResponseDto> {
    const tag = await this.findTagByIdentifier(identifier);
    return this.toResponseDto(tag);
  }

  async inactivateTag(
    identifier: string,
  ): Promise<{ message: string; tag: NfcTagResponseDto }> {
    const tag = await this.findTagByIdentifier(identifier);

    if (tag.hospitalization && tag.hospitalization.status === 'ACTIVE') {
      throw new ConflictException(
        `Não é possível inativar a tag [${tag.tagUid}], pois ela está atualmente vinculada a uma internação ativa.`,
      );
    }

    const updatedTag = await this.nfcTagsRepository.update(tag.id, {
      active: false,
    });

    return {
      message: `Tag NFC [${tag.tagUid}] inativada com sucesso.`,
      tag: this.toResponseDto(updatedTag),
    };
  }

  async activateTag(
    identifier: string,
  ): Promise<{ message: string; tag: NfcTagResponseDto }> {
    const tag = await this.findTagByIdentifier(identifier);

    const updatedTag = await this.nfcTagsRepository.update(tag.id, {
      active: true,
    });

    return {
      message: `Tag NFC [${tag.tagUid}] reativada com sucesso.`,
      tag: this.toResponseDto(updatedTag),
    };
  }

  async removeTag(identifier: string): Promise<{ message: string }> {
    const tag = await this.findTagByIdentifier(identifier);

    if (tag.hospitalization && tag.hospitalization.status === 'ACTIVE') {
      throw new ConflictException(
        `Não é possível remover a tag [${tag.tagUid}], pois ela está atualmente vinculada a uma internação ativa.`,
      );
    }

    await this.nfcTagsRepository.delete(tag.id);

    return {
      message: `Tag NFC [${tag.tagUid}] removida com sucesso do inventário.`,
    };
  }

  private async findTagByIdentifier(identifier: string) {
    const tag =
      (await this.nfcTagsRepository.findById(identifier)) ||
      (await this.nfcTagsRepository.findByTagUid(identifier)) ||
      (await this.nfcTagsRepository.findByPublicCode(identifier));

    if (!tag) {
      throw new NotFoundException(
        `Tag NFC com identificador "${identifier}" não encontrada no inventário.`,
      );
    }

    return tag;
  }

  private toResponseDto(tag: NfcTag): NfcTagResponseDto {
    const appBaseUrl = this.configService.get<string>(
      'APP_BASE_URL',
      'https://app.suaclinica.com',
    );
    const targetUrl = `${appBaseUrl}/bedside/${tag.publicCode}`;

    return {
      id: tag.id,
      tagUid: tag.tagUid,
      publicCode: tag.publicCode,
      active: tag.active,
      targetUrl,
      createdAt: tag.createdAt,
    };
  }
}
