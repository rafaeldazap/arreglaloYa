import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';
import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { TipoPago, MedioPago } from '../../../common/enums';

export class RegistrarPagoDto {
  @ApiProperty({ example: 1 })
  @IsNotEmpty({ message: 'El ID de la solicitud es obligatorio' })
  @IsInt()
  @Min(1)
  idSolicitud: number;

  @ApiPropertyOptional({
  example: 'PARCIAL',
  description: 'Tipo de pago parcial',
})
@IsOptional()
tipo?: string;

  @ApiProperty({ enum: MedioPago, example: MedioPago.QR_TRABAJADOR })
  @IsNotEmpty({ message: 'El medio de pago es obligatorio' })
  @IsEnum(MedioPago)
  medioPago: MedioPago;

  @ApiProperty({ example: 37.5 })
  @IsNotEmpty({ message: 'El monto es obligatorio' })
  @IsNumber()
  @Min(0.01, { message: 'El monto debe ser mayor a 0' })
  @Max(1000000)
  monto: number;

  @ApiPropertyOptional({ example: 'https://miservidor.com/comprobantes/pago1.png' })
  @IsOptional()
  @IsUrl(
    { protocols: ['http', 'https'], require_protocol: true, require_tld: false },
    { message: 'urlComprobante debe ser una URL válida http o https' },
  )
  @MaxLength(255)
  urlComprobante?: string;
}
