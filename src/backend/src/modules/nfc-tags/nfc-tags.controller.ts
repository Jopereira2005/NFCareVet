import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { NfcTagsService } from './nfc-tags.service';
import { CreateNfcTagDto } from './dto/create-nfc-tag.dto';

@Controller('nfc-tags')
export class NfcTagsController {
  constructor(private readonly nfcTagsService: NfcTagsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  async create(@Body() createNfcTagDto: CreateNfcTagDto) {
    return this.nfcTagsService.registerTag(createNfcTagDto);
  }
}
