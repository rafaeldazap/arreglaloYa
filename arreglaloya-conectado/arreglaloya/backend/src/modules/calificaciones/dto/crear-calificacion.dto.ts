import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsBoolean,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearCalificacionDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'El ID de la solicitud es obligatorio' })
  @IsInt()
  @Min(1)
  idSolicitud: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Opcional: se deduce automáticamente de la contraparte del servicio',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  idEvaluado?: number;

  @ApiProperty({ example: 5 })
  @IsNotEmpty({ message: 'El puntaje es obligatorio' })
  @IsInt({ message: 'El puntaje debe ser un número entero entre 1 y 5' })
  @Min(1, { message: 'El puntaje mínimo es 1' })
  @Max(5, { message: 'El puntaje máximo es 5' })
  puntaje: number;

  @ApiPropertyOptional({ example: 'Excelente trabajo, puntual y limpio.' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  comentario?: string;

  @ApiPropertyOptional({ example: false })
  @IsOptional()
  @IsBoolean()
  esInterna?: boolean;
}
