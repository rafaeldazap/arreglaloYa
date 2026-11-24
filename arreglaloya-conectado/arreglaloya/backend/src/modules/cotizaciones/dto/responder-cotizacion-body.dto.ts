import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsDateString, IsInt, IsOptional, Max, Min } from 'class-validator';

export class ResponderCotizacionBodyDto {
  @ApiPropertyOptional({
    example: '2026-11-25T10:00:00Z',
    description: 'Fecha/hora de inicio agendada al aceptar la cotización (RN-10)',
  })
  @IsOptional()
  @IsDateString()
  fechaInicioAgendada?: string;

  @ApiPropertyOptional({ example: 120, description: 'Duración estimada en minutos (15 a 1440)' })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(1440)
  duracionEstimadaMinutos?: number;
}
