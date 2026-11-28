import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  Query,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { SolicitudesService } from './solicitudes.service';
import { CrearSolicitudDto } from './dto/crear-solicitud.dto';
import { CancelarSolicitudDto } from './dto/cancelar-solicitud.dto';
import { PaginationQueryDto } from '../../common/dto/pagination-query.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/enums';
import { Usuario } from '../../entities/Usuario';

@ApiTags('Solicitudes')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('solicitudes')
export class SolicitudesController {
  constructor(private readonly solicitudesService: SolicitudesService) {}

  @Post()
  @Roles(RolUsuario.CLIENTE)
  @ApiOperation({ summary: 'Crear nueva solicitud de servicio (Solo CLIENTE)' })
  crear(@Body() dto: CrearSolicitudDto, @CurrentUser() cliente: Usuario) {
    return this.solicitudesService.crear(dto, cliente);
  }

  @Get('mis-pedidos')
  @ApiOperation({ summary: 'Obtener mis pedidos o trabajos asignados con paginación' })
  misPedidos(@CurrentUser() usuario: Usuario, @Query() query: PaginationQueryDto) {
    return this.solicitudesService.misPedidos(usuario, query.page ?? 1, query.limit ?? 10);
  }

  @Get('bandeja-zonal')
  @Roles(RolUsuario.TRABAJADOR)
  @ApiOperation({ summary: 'Bandeja de pedidos pendientes en las zonas del trabajador (Solo TRABAJADOR)' })
  bandejaZonal(@CurrentUser() trabajador: Usuario) {
    return this.solicitudesService.bandejaZonal(trabajador);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener detalle de solicitud (Solo participantes autorizados y RN-11)' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number, @CurrentUser() usuario: Usuario) {
    return this.solicitudesService.obtenerPorIdConPrivacidad(id, usuario);
  }

  @Get(':id/historial')
  @ApiOperation({ summary: 'Consultar la línea de tiempo inalterable de auditoría (CU-12, RF-07)' })
  consultarHistorial(@Param('id', ParseIntPipe) id: number, @CurrentUser() usuario: Usuario) {
    return this.solicitudesService.consultarHistorial(id, usuario);
  }

  @Get(':id/cancelacion/previsualizar')
  @ApiOperation({ summary: 'Previsualizar las consecuencias de cancelar la solicitud sin modificarla (CU-10, RN-12)' })
  previsualizarCancelacion(@Param('id', ParseIntPipe) id: number, @CurrentUser() usuario: Usuario) {
    return this.solicitudesService.previsualizarCancelacion(id, usuario);
  }

  @Get(':id/cancelacion')
  @ApiOperation({ summary: 'Obtener el registro de cancelación de la solicitud (CU-10)' })
  obtenerCancelacion(@Param('id', ParseIntPipe) id: number, @CurrentUser() usuario: Usuario) {
    return this.solicitudesService.obtenerCancelacion(id, usuario);
  }

  @Patch(':id/cancelar')
  @ApiOperation({ summary: 'Cancelar solicitud por el cliente aplicando regla del 25% (CU-10, RN-12)' })
  cancelar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: CancelarSolicitudDto,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.solicitudesService.cancelar(id, dto, usuario);
  }

  @Post('expirar-vencidas')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Ejecutar caducidad automática de solicitudes pendientes > 30 días (CU-11, RN-08)' })
  expirarVencidas() {
    return this.solicitudesService.expirarSolicitudesVencidas();
  }
}
