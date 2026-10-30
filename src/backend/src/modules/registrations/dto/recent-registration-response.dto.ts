import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { PatientResponseDto } from '../../patients/dto/patient-response.dto';
import { GuardianResponseDto } from '../../guardians/dto/guardian-response.dto';

export type RecentRegistrationResponse =
  | { kind: 'patient'; patient: PatientResponseDto }
  | { kind: 'guardian'; guardian: GuardianResponseDto };

export class RecentRegistrationResponseDto {
  @ApiProperty({
    description: 'Tipo do registro recém-cadastrado (patient ou guardian)',
    enum: ['patient', 'guardian'],
    example: 'patient',
  })
  kind!: 'patient' | 'guardian';

  @ApiPropertyOptional({
    description: 'Dados do paciente (presente quando kind === "patient")',
    type: () => PatientResponseDto,
  })
  patient?: PatientResponseDto;

  @ApiPropertyOptional({
    description: 'Dados do tutor com seus pets (presente quando kind === "guardian")',
    type: () => GuardianResponseDto,
  })
  guardian?: GuardianResponseDto;
}
