import { ApiPropertyOptional } from '@nestjs/swagger';
import { IsOptional, IsString, MaxLength } from 'class-validator';

export class LevantarSuspensionDto {
  @ApiPropertyOptional({
    example: 'Cumplimiento anticipado de compromisos o aclaración de los reclamos presentados.',
    description: 'Motivo u observación del levantamiento anticipado de la suspensión',
  })
  @IsOptional()
  @IsString({ message: 'El motivo debe ser una cadena de texto' })
  @MaxLength(1000, { message: 'El motivo no puede exceder 1000 caracteres' })
  motivo?: string;
}
