import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import { IsInt, IsOptional, Min } from 'class-validator';
import { PaginationQueryDto } from '../../../common/dto/pagination-query.dto';

export class BuscarTrabajadoresQueryDto extends PaginationQueryDto {
  @ApiPropertyOptional({ example: 1, description: 'ID de categoría' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'categoria debe ser un ID numérico entero' })
  @Min(1)
  categoria?: number;

  @ApiPropertyOptional({ example: 1, description: 'ID de zona' })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: 'zona debe ser un ID numérico entero' })
  @Min(1)
  zona?: number;
}
