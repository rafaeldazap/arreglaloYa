import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class SuspenderTrabajadorDto {
  @ApiProperty({
    example: 'Incumplimiento reiterado de acuerdos y reclamos procedentes de clientes.',
    description: 'Motivo fundamentado de la suspensión temporal',
  })
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @IsNotEmpty({ message: 'El motivo de la suspensión es obligatorio' })
  @MaxLength(1000, { message: 'El motivo no puede exceder 1000 caracteres' })
  motivo: string;

  @ApiPropertyOptional({
    example: 7,
    description: 'Cantidad de días de suspensión (si no se proporciona fechaFin exacta)',
  })
  @IsOptional()
  @IsInt({ message: 'Los días deben ser un número entero' })
  @Min(1, { message: 'La suspensión debe ser de al menos 1 día' })
  @Max(365, { message: 'La suspensión no puede exceder 365 días' })
  dias?: number;

  @ApiPropertyOptional({
    example: '2026-12-01T00:00:00Z',
    description: 'Fecha y hora de inicio de la suspensión (por defecto: ahora)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'fechaInicio debe ser una fecha ISO válida' })
  fechaInicio?: string;

  @ApiPropertyOptional({
    example: '2026-12-08T23:59:59Z',
    description: 'Fecha y hora de fin de la suspensión (opcional si se especifica dias)',
  })
  @IsOptional()
  @IsDateString({}, { message: 'fechaFin debe ser una fecha ISO válida' })
  fechaFin?: string;
}
