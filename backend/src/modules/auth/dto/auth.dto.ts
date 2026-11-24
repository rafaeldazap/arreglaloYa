import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  ArrayNotEmpty,
  IsArray,
  IsEmail,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUrl,
  MaxLength,
  Min,
  MinLength,
} from 'class-validator';

export class LoginDto {
  @ApiProperty({ example: 'carlos@gmail.com' })
  @IsEmail({}, { message: 'El correo debe ser un email válido' })
  @MaxLength(120)
  correo: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @IsNotEmpty({ message: 'La contraseña es requerida' })
  @MaxLength(72)
  password: string;
}

export class RegistroClienteDto {
  @ApiProperty({ example: 'Carlos Mendoza' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  @MaxLength(120)
  nombreCompleto: string;

  @ApiPropertyOptional({ example: '70712345' })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @MaxLength(20)
  telefono?: string;

  @ApiProperty({ example: 'carlos@gmail.com' })
  @IsEmail({}, { message: 'El correo debe ser un email válido' })
  @MaxLength(120)
  correo: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(72, { message: 'La contraseña no debe exceder 72 caracteres' })
  password: string;
}

export class RegistroTrabajadorDto {
  @ApiProperty({ example: 'Mario Fernandez' })
  @IsString()
  @IsNotEmpty({ message: 'El nombre completo es requerido' })
  @MaxLength(120)
  nombreCompleto: string;

  @ApiPropertyOptional({ example: '79788990' })
  @IsOptional()
  @IsString({ message: 'El teléfono debe ser texto' })
  @MaxLength(20)
  telefono?: string;

  @ApiProperty({ example: 'mario.plomero@gmail.com' })
  @IsEmail({}, { message: 'El correo debe ser un email válido' })
  @MaxLength(120)
  correo: string;

  @ApiProperty({ example: 'Password123' })
  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  @MaxLength(72, { message: 'La contraseña no debe exceder 72 caracteres' })
  password: string;

  @ApiProperty({ example: '8451234-CB' })
  @IsString()
  @IsNotEmpty({ message: 'El número de CI es obligatorio' })
  @MaxLength(20)
  ciNumero: string;

  @ApiPropertyOptional({ example: 'https://miservidor.com/ci_mario.jpg' })
  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { message: 'urlCi debe ser una URL válida http o https' },
  )
  @MaxLength(255)
  urlCi?: string;

  @ApiPropertyOptional({ example: 'https://miservidor.com/antecedentes.pdf' })
  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { message: 'urlAntecedentes debe ser una URL válida http o https' },
  )
  @MaxLength(255)
  urlAntecedentes?: string;

  @ApiPropertyOptional({ example: 'https://miservidor.com/curriculum.pdf' })
  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { message: 'urlExperiencia debe ser una URL válida http o https' },
  )
  @MaxLength(255)
  urlExperiencia?: string;

  @ApiProperty({ example: [1, 2], type: [Number] })
  @IsArray({ message: 'categoriasIds debe ser un arreglo de IDs' })
  @ArrayNotEmpty({ message: 'Debe seleccionar al menos una categoría' })
  @IsInt({ each: true, message: 'Cada ID de categoría debe ser entero' })
  @Min(1, { each: true })
  categoriasIds: number[];

  @ApiProperty({ example: [1, 2, 3], type: [Number] })
  @IsArray({ message: 'zonasIds debe ser un arreglo de IDs' })
  @ArrayNotEmpty({ message: 'Debe seleccionar al menos una zona' })
  @IsInt({ each: true, message: 'Cada ID de zona debe ser entero' })
  @Min(1, { each: true })
  zonasIds: number[];
}
