import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsArray,
  IsInt,
  IsOptional,
  IsString,
  IsUrl,
  Matches,
  Max,
  MaxLength,
  Min,
  ValidateNested,
} from 'class-validator';
import { Type } from 'class-transformer';

export class HorarioItemDto {
  @ApiProperty({ example: 1, description: '1 = Lunes, 7 = Domingo' })
  @IsInt()
  @Min(1, { message: 'diaSemana debe estar entre 1 y 7' })
  @Max(7, { message: 'diaSemana debe estar entre 1 y 7' })
  diaSemana: number;

  @ApiProperty({ example: '08:00:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'horaInicio debe tener formato HH:mm o HH:mm:ss',
  })
  horaInicio: string;

  @ApiProperty({ example: '18:00:00' })
  @IsString()
  @Matches(/^([01]\d|2[0-3]):[0-5]\d(:[0-5]\d)?$/, {
    message: 'horaFin debe tener formato HH:mm o HH:mm:ss',
  })
  horaFin: string;
}

export class ConfigurarAgendaQrDto {
  @ApiPropertyOptional({ example: 30, description: 'Margen de error en minutos entre trabajos (>= 0)' })
  @IsOptional()
  @IsInt()
  @Min(0)
  @Max(240)
  margenErrorMin?: number;

  @ApiPropertyOptional({ example: 'https://miservidor.com/mi_qr_banco.png' })
  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { message: 'qrImagenUrl debe ser una URL http o https válida' },
  )
  @MaxLength(255)
  qrImagenUrl?: string;

  @ApiPropertyOptional({ example: 15, description: 'Tiempo de vigencia del QR en minutos (> 0)' })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(1440)
  qrVigenciaMin?: number;

  @ApiPropertyOptional({ type: [HorarioItemDto] })
  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => HorarioItemDto)
  horarios?: HorarioItemDto[];
}
