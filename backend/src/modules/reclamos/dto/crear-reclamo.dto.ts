import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
} from 'class-validator';
import { MotivoReclamo } from '../../../common/enums';

export class CrearReclamoDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'El ID de la solicitud es obligatorio' })
  @IsInt()
  @Min(1)
  idSolicitud: number;

  @ApiPropertyOptional({
    example: 2,
    description: 'Opcional para participantes (se deduce automáticamente la contraparte de la solicitud)',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  idDenunciado?: number;

  @ApiProperty({ enum: MotivoReclamo, example: MotivoReclamo.INASISTENCIA })
  @IsNotEmpty({ message: 'El motivo del reclamo es obligatorio' })
  @IsEnum(MotivoReclamo)
  motivo: MotivoReclamo;

  @ApiPropertyOptional({ example: 'https://miservidor.com/pruebas/captura1.png' })
  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { message: 'urlPruebas debe ser una URL http o https válida' },
  )
  @MaxLength(255)
  urlPruebas?: string;

  @ApiPropertyOptional({ example: 'El trabajador no se presentó en la fecha acordada' })
  @IsOptional()
  @IsString()
  @MaxLength(1000)
  descripcion?: string;
}
