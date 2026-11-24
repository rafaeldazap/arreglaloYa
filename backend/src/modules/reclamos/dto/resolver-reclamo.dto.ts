import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsIn, IsNotEmpty } from 'class-validator';
import { EstadoResolucion } from '../../../common/enums';

export class ResolverReclamoDto {
  @ApiProperty({
    enum: [EstadoResolucion.PROCEDENTE, EstadoResolucion.IMPROCEDENTE],
    example: EstadoResolucion.PROCEDENTE,
  })
  @IsNotEmpty({ message: 'El estado de resolución es obligatorio' })
  @IsEnum(EstadoResolucion)
  @IsIn([EstadoResolucion.PROCEDENTE, EstadoResolucion.IMPROCEDENTE], {
    message: 'La resolución solo puede ser PROCEDENTE o IMPROCEDENTE',
  })
  resolucion: EstadoResolucion;
}
