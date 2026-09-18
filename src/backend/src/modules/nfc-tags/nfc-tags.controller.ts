import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Param,
  Body,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
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

  @Get()
  async findAll() {
    return this.nfcTagsService.findAll();
  }

  @Get(':id')
  async findOne(@Param('id') id: string) {
    return this.nfcTagsService.findOne(id);
  }

  @Patch(':id/inactivate')
  async inactivate(@Param('id') id: string) {
    return this.nfcTagsService.inactivateTag(id);
  }

  @Patch(':id/activate')
  async activate(@Param('id') id: string) {
    return this.nfcTagsService.activateTag(id);
  }

  @Delete(':id')
  async remove(@Param('id') id: string) {
    return this.nfcTagsService.removeTag(id);
  }
}
