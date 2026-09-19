import { ApiProperty } from '@nestjs/swagger';

export class ApplyMedicationResponseDto {
  @ApiProperty({
    example: 'Item da prescrição checado e aplicado com sucesso!',
    description: 'Mensagem descritiva de sucesso da operação',
  })
  message: string;

  @ApiProperty({
    type: Object,
    description: 'Registro do item da prescrição atualizado (status alterado para APPLIED)',
  })
  prescriptionItem: any;

  @ApiProperty({
    type: Object,
    description: 'Evento clínico gerado no prontuário do paciente registrando o executor, data/hora e observações',
  })
  clinicalEvent: any;
}

