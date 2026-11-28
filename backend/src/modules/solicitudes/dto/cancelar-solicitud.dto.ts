import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import { IsEnum, IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';
import { MotivoCancelacion } from '../../../common/enums';

export class CancelarSolicitudDto {
  @ApiProperty({ enum: MotivoCancelacion, example: MotivoCancelacion.CAMBIO_DE_PLANES })
  @IsNotEmpty({ message: 'El motivo de la cancelación es obligatorio' })
  @IsEnum(MotivoCancelacion, {
    message: `El motivo debe ser uno de: ${Object.values(MotivoCancelacion).join(', ')}`,
  })
  motivo: MotivoCancelacion;

  // Obligatorio (mínimo 10 caracteres) cuando el motivo es OTRO: se valida en el service
  @ApiPropertyOptional({
    example: 'Voy a estar de viaje esa semana y no habrá nadie en casa.',
    maxLength: 255,
    description: 'Obligatorio y de al menos 10 caracteres si el motivo es OTRO',
  })
  @IsOptional()
  @IsString({ message: 'El detalle debe ser un texto' })
  @MaxLength(255, { message: 'El detalle no puede superar los 255 caracteres' })
  detalle?: string;
}
