import { ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsDateString, IsIn, IsInt, IsOptional, Min } from "class-validator";

export const AGRUPACIONES = ["dia", "semana", "mes"] as const;
export type Agrupacion = (typeof AGRUPACIONES)[number];

// Filtros que acepta GET /api/v1/estadisticas/admin (todos opcionales, llegan por query string)
export class FiltroEstadisticasDto {
  @ApiPropertyOptional({
    example: "2026-11-01",
    description: "Fecha inicial (incluida), formato AAAA-MM-DD",
  })
  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: "desde debe ser una fecha válida con formato AAAA-MM-DD" },
  )
  desde?: string;

  @ApiPropertyOptional({
    example: "2026-11-30",
    description: "Fecha final (incluida), formato AAAA-MM-DD",
  })
  @IsOptional()
  @IsDateString(
    { strict: true },
    { message: "hasta debe ser una fecha válida con formato AAAA-MM-DD" },
  )
  hasta?: string;

  @ApiPropertyOptional({
    example: 1,
    description: "Solo solicitudes de esta categoría",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "idCategoria debe ser un número entero" })
  @Min(1, { message: "idCategoria debe ser mayor a 0" })
  idCategoria?: number;

  @ApiPropertyOptional({
    example: 1,
    description: "Solo solicitudes de esta zona",
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt({ message: "idZona debe ser un número entero" })
  @Min(1, { message: "idZona debe ser mayor a 0" })
  idZona?: number;

  @ApiPropertyOptional({
    enum: AGRUPACIONES,
    default: "dia",
    description: "Cómo agrupar la evolución en el tiempo",
  })
  @IsOptional()
  @IsIn(AGRUPACIONES, { message: "agrupacion debe ser dia, semana o mes" })
  agrupacion?: Agrupacion;
}
