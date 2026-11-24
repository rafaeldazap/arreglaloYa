import { ApiProperty } from '@nestjs/swagger';
import { IsBoolean, IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class VerificarTrabajadorDto {
  @ApiProperty({ example: true, description: 'True para aprobar y activar la cuenta, false para rechazar' })
  @IsNotEmpty({ message: 'El campo aprobar es obligatorio' })
  @IsBoolean()
  aprobar: boolean;

  @ApiProperty({ example: 'Documentos legibles y verificados correctamente', required: false })
  @IsOptional()
  @IsString()
  motivo?: string;
}
