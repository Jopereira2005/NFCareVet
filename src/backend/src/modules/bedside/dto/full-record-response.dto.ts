import { ApiProperty } from '@nestjs/swagger';
import { QuickRecordResponseDto } from './quick-record-response.dto';

export class FullRecordResponseDto extends QuickRecordResponseDto {
  @ApiProperty({
    type: [Object],
    description: 'Protocolos completos de prescrições médicas ativas com todos os itens históricos',
  })
  prescriptions: any[];

  @ApiProperty({
    type: [Object],
    description: 'Histórico recente detalhado de eventos clínicos e cuidados de enfermagem',
  })
  clinicalEvents: any[];
}
