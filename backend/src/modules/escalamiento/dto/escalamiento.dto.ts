import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsIn,
  IsInt,
  IsOptional,
  IsString,
  Matches,
  Max,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';
import { EstadoResolucion } from '../../../common/enums';

export class ConfigurarPlazoDto {
  @ApiProperty({ example: 4320, description: 'Plazo máximo para resolver un reclamo, en minutos (1 a 525600)' })
  @IsInt({ message: 'plazoMinutos debe ser un número entero' })
  @Min(1, { message: 'El plazo mínimo es de 1 minuto' })
  @Max(525600, { message: 'El plazo máximo es de 365 días (525600 minutos)' })
  plazoMinutos: number;
}

export class ReasignarReclamoDto {
  @ApiProperty({ example: 1, description: 'ID del administrador que será el nuevo responsable' })
  @IsInt()
  @Min(1)
  idResponsable: number;

  @ApiProperty({ example: 'El caso requiere revisión de otro administrador' })
  @IsString()
  @MinLength(5, { message: 'El motivo debe tener al menos 5 caracteres' })
  @MaxLength(300)
  motivo: string;
}

export class EscalarReclamoDto {
  @ApiProperty({ example: 'Caso urgente: el cliente espera respuesta' })
  @IsString()
  @MinLength(5, { message: 'El motivo debe tener al menos 5 caracteres' })
  @MaxLength(300)
  motivo: string;
}

export class ResolverEscalamientoDto {
  @ApiProperty({ enum: [EstadoResolucion.PROCEDENTE, EstadoResolucion.IMPROCEDENTE] })
  @IsEnum(EstadoResolucion)
  @IsIn([EstadoResolucion.PROCEDENTE, EstadoResolucion.IMPROCEDENTE], {
    message: 'La resolución solo puede ser PROCEDENTE o IMPROCEDENTE',
  })
  resolucion: EstadoResolucion;

  @ApiPropertyOptional({ example: 'Se verificaron las pruebas del cliente' })
  @IsOptional()
  @IsString()
  @MaxLength(300)
  comentario?: string;
}

export class FiltrosEscalamientoDto {
  @ApiPropertyOptional({ enum: ['TODOS', 'EN_PLAZO', 'ESCALADO', 'RESUELTO'] })
  @IsOptional()
  @IsIn(['TODOS', 'EN_PLAZO', 'ESCALADO', 'RESUELTO'])
  estado?: string;

  @ApiPropertyOptional({ example: 'SIN', description: '"SIN" = sin responsable, o el ID del responsable' })
  @IsOptional()
  @Matches(/^(SIN|\d+)$/, { message: 'responsable debe ser "SIN" o un ID numérico' })
  responsable?: string;

  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  page?: number;

  @ApiPropertyOptional({ example: 10 })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number;
}
