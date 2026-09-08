import { Controller, Get, Post, Param, Body } from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { BedsideService } from './bedside.service';
import { ApplyMedicationDto } from './dto/apply-medication.dto';
import { QuickRecordResponseDto } from './dto/quick-record-response.dto';
import { ApplyMedicationResponseDto } from './dto/apply-medication-response.dto';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';

@Controller('bedside')
export class BedsideController {
  constructor(private readonly bedsideService: BedsideService) {}

  @Roles(UserRole.ADMIN, UserRole.VET, UserRole.REC)
  @Get(':publicCode')
  async getQuickRecord(
    @Param('publicCode') publicCode: string,
  ): Promise<QuickRecordResponseDto> {
    return this.bedsideService.getQuickRecordByTag(publicCode);
  }

  @Roles(UserRole.ADMIN, UserRole.VET)
  @Post('prescriptions/:id/apply')
  async applyMedication(
    @Param('id') prescriptionId: string,
    @CurrentUser('userId') userId: string,
    @Body() applyMedicationDto: ApplyMedicationDto,
  ): Promise<ApplyMedicationResponseDto> {
    return this.bedsideService.applyMedication(
      prescriptionId,
      userId,
      applyMedicationDto?.bedsideNotes,
    );
  }
}