import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  Max,
  Min,
} from 'class-validator';

export class CrearCotizacionDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'El ID de la solicitud es obligatorio' })
  @IsInt()
  @Min(1)
  idSolicitud: number;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  requiereVisita?: boolean;

  @ApiPropertyOptional({ example: 0 })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(1000000)
  costoVisita?: number;

  @ApiProperty({ example: 150.0 })
  @IsNotEmpty({ message: 'El monto total propuesto es obligatorio' })
  @IsNumber()
  @Min(1)
  @Max(1000000)
  montoTotalPropuesto: number;

  @ApiPropertyOptional({ example: true })
  @IsOptional()
  @IsBoolean()
  incluyeMateriales?: boolean;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  esRecotizacion?: boolean;

  @ApiPropertyOptional({
    example: '2026-11-25T10:00:00Z',
    description: 'Horario propuesto para la visita/trabajo',
  })
  @IsOptional()
  @IsDateString()
  fechaInicioAgendada?: string;

  @ApiPropertyOptional({ example: 120, description: 'Duración estimada en minutos' })
  @IsOptional()
  @IsInt()
  @Min(15)
  @Max(1440)
  duracionEstimadaMinutos?: number;
}
