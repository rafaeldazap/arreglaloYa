import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayMaxSize,
  IsArray,
  IsDateString,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  Matches,
  MaxLength,
  Min,
} from 'class-validator';

export class CrearSolicitudDto {
  @ApiPropertyOptional({ example: 1 })
  @IsOptional()
  @IsInt()
  @Min(1)
  idTrabajador?: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'La categoría es obligatoria' })
  @IsInt()
  @Min(1)
  idCategoria: number;

  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'La zona es obligatoria' })
  @IsInt()
  @Min(1)
  idZona: number;

  @ApiProperty({ example: 'Fuga de agua en la tubería principal debajo del lavaplatos.' })
  @IsString()
  @IsNotEmpty({ message: 'La descripción del problema es obligatoria' })
  @MaxLength(2000)
  descripcion: string;

  @ApiProperty({ example: 'Av. América y Pando #452, Edif. Los Pinos Dpto 3B' })
  @IsString()
  @IsNotEmpty({ message: 'La dirección exacta es obligatoria' })
  @MaxLength(255)
  direccionExacta: string;

  @ApiPropertyOptional({ example: 120.0 })
  @IsOptional()
  @IsNumber()
  @Min(0, { message: 'El monto ofrecido no puede ser negativo' })
  @Max(1000000)
  montoOfrecido?: number;

  @ApiPropertyOptional({ example: ['https://miservidor.com/fotos/fuga1.jpg'], type: [String] })
  @IsOptional()
  @IsArray()
  @ArrayMaxSize(5, { message: 'Puede adjuntar como máximo 5 fotos' })
  // Se acepta una URL http(s) o la imagen comprimida en base64 (data:image/...)
  @Matches(/^(https?:\/\/|data:image\/(png|jpe?g|webp);base64,)/, {
    each: true,
    message: 'Cada foto debe ser una URL http(s) o una imagen en base64',
  })
  @MaxLength(1_500_000, { each: true, message: 'Cada foto debe pesar menos de 1 MB' })
  fotosUrls?: string[];

  @ApiPropertyOptional({
    example: '2026-11-25T10:00:00Z',
    description: 'Fecha y hora deseada por el cliente',
  })
  @IsOptional()
  @IsDateString()
  fechaInicioAgendada?: string;
}
