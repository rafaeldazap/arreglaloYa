import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, IsBoolean, IsOptional, MaxLength } from 'class-validator';

export class CatalogoItemDto {
  @ApiProperty({ example: 'Cercado Centro' })
  @IsNotEmpty({ message: 'El nombre es obligatorio' })
  @IsString()
  @MaxLength(80, { message: 'El nombre no puede superar 80 caracteres' })
  nombre: string;

  @ApiProperty({ example: true, required: false })
  @IsOptional()
  @IsBoolean()
  activa?: boolean;
}
