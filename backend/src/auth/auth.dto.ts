import { ArrayNotEmpty, IsArray, IsEmail, IsIn, IsOptional, IsString, MinLength } from 'class-validator';

export class RegistroDto {
  @IsString()
  @MinLength(3, { message: 'El nombre debe tener al menos 3 caracteres' })
  nombre: string;

  @IsEmail({}, { message: 'El correo no es válido' })
  correo: string;

  @IsOptional()
  @IsString()
  telefono?: string;

  @IsString()
  @MinLength(6, { message: 'La contraseña debe tener al menos 6 caracteres' })
  password: string;

  @IsIn(['CLIENTE', 'TRABAJADOR'])
  rol: 'CLIENTE' | 'TRABAJADOR';

  // Solo para trabajadores
  @IsOptional()
  @IsString()
  ci?: string;

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  especialidades?: string[];

  @IsOptional()
  @IsArray()
  @ArrayNotEmpty()
  zonas?: string[];
}

export class LoginDto {
  @IsEmail({}, { message: 'El correo no es válido' })
  correo: string;

  @IsString()
  password: string;
}
