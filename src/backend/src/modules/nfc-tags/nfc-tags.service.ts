import {
  Injectable,
  ConflictException,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { randomUUID } from 'crypto';
import { CreateNfcTagDto } from './dto/create-nfc-tag.dto';
import { NfcTagsRepository } from './nfc-tags.repository';
import { NfcTagResponseDto } from './dto/nfc-tag-response.dto';
import { NfcTag } from '@prisma/client';

@Injectable()
export class NfcTagsService {
  private readonly logger = new Logger(NfcTagsService.name);

  constructor(
    private readonly nfcTagsRepository: NfcTagsRepository,
    private readonly configService: ConfigService,
  ) {}

  async registerTag(dto: CreateNfcTagDto): Promise<NfcTagResponseDto> {
    const existingTag = await this.nfcTagsRepository.findByTagUid(dto.tagUid);

    if (existingTag) {
      this.logger.warn(
        `[NFC] Falha ao cadastrar tag: Tag física [${dto.tagUid}] já cadastrada no inventário.`,
      );
      throw new ConflictException(
        `Tag física [${dto.tagUid}] já cadastrada no inventário.`,
      );
    }

    try {
      const publicCode = `tag-${randomUUID()}`;
      const newTag = await this.nfcTagsRepository.create({
        tagUid: dto.tagUid,
        publicCode,
        active: true,
      });

      this.logger.log(
        `[NFC] Tag cadastrada com sucesso: id=${newTag.id}, tagUid=${newTag.tagUid}, publicCode=${newTag.publicCode}`,
      );

      return this.toResponseDto(newTag);
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error(
        `[NFC] Erro inesperado ao cadastrar tag [${dto.tagUid}]: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
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
      this.logger.warn(
        `[NFC] Falha ao inativar tag [${tag.tagUid}]: vinculada à internação ativa [hospitalizationId=${tag.hospitalization.id}].`,
      );
      throw new ConflictException(
        `Não é possível inativar a tag [${tag.tagUid}], pois ela está atualmente vinculada a uma internação ativa.`,
      );
    }

    try {
      const updatedTag = await this.nfcTagsRepository.update(tag.id, {
        active: false,
      });

      this.logger.log(
        `[NFC] Tag inativada com sucesso: id=${updatedTag.id}, tagUid=${updatedTag.tagUid}`,
      );

      return {
        message: `Tag NFC [${tag.tagUid}] inativada com sucesso.`,
        tag: this.toResponseDto(updatedTag),
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error(
        `[NFC] Erro inesperado ao inativar tag [${tag.tagUid}]: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async activateTag(
    identifier: string,
  ): Promise<{ message: string; tag: NfcTagResponseDto }> {
    const tag = await this.findTagByIdentifier(identifier);

    try {
      const updatedTag = await this.nfcTagsRepository.update(tag.id, {
        active: true,
      });

      this.logger.log(
        `[NFC] Tag reativada com sucesso: id=${updatedTag.id}, tagUid=${updatedTag.tagUid}`,
      );

      return {
        message: `Tag NFC [${tag.tagUid}] reativada com sucesso.`,
        tag: this.toResponseDto(updatedTag),
      };
    } catch (error) {
      this.logger.error(
        `[NFC] Erro inesperado ao reativar tag [${tag.tagUid}]: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  async removeTag(identifier: string): Promise<{ message: string }> {
    const tag = await this.findTagByIdentifier(identifier);

    if (tag.hospitalization && tag.hospitalization.status === 'ACTIVE') {
      this.logger.warn(
        `[NFC] Falha ao remover tag [${tag.tagUid}]: vinculada à internação ativa [hospitalizationId=${tag.hospitalization.id}].`,
      );
      throw new ConflictException(
        `Não é possível remover a tag [${tag.tagUid}], pois ela está atualmente vinculada a uma internação ativa.`,
      );
    }

    try {
      await this.nfcTagsRepository.delete(tag.id);

      this.logger.log(
        `[NFC] Tag removida com sucesso do inventário: id=${tag.id}, tagUid=${tag.tagUid}`,
      );

      return {
        message: `Tag NFC [${tag.tagUid}] removida com sucesso do inventário.`,
      };
    } catch (error) {
      if (error instanceof ConflictException) throw error;
      this.logger.error(
        `[NFC] Erro inesperado ao remover tag [${tag.tagUid}]: ${error instanceof Error ? error.message : error}`,
        error instanceof Error ? error.stack : undefined,
      );
      throw error;
    }
  }

  private async findTagByIdentifier(identifier: string) {
    const tag =
      (await this.nfcTagsRepository.findById(identifier)) ||
      (await this.nfcTagsRepository.findByTagUid(identifier)) ||
      (await this.nfcTagsRepository.findByPublicCode(identifier));

    if (!tag) {
      this.logger.warn(
        `[NFC] Falha na busca: Tag NFC com identificador [${identifier}] não encontrada.`,
      );
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
