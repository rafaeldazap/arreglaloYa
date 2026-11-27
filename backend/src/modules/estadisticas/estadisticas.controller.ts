import { Controller, Get, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../auth/jwt-auth.guard";
import { RolesGuard } from "../../common/guards/roles.guard";
import { Roles } from "../../common/decorators/roles.decorator";
import { RolUsuario } from "../../common/enums";
import { FiltroEstadisticasDto } from "./dto/filtro-estadisticas.dto";
import { EstadisticasService } from "./estadisticas.service";

@ApiTags("Estadísticas (Admin)")
@ApiBearerAuth()
@Controller("estadisticas")
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMIN) // Solo el administrador puede ver las estadísticas
export class EstadisticasController {
  constructor(private readonly estadisticas: EstadisticasService) {}

  @Get("admin")
  @ApiOperation({
    summary:
      "Panel de estadísticas: demanda por categoría, actividad por zona, % de solicitudes atendidas y canceladas, y evolución en el tiempo",
  })
  obtener(@Query() filtros: FiltroEstadisticasDto) {
    return this.estadisticas.obtener(filtros);
  }
}
