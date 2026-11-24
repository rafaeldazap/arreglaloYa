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
  ParseEnumPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { CotizacionesService } from './cotizaciones.service';
import { CrearCotizacionDto } from './dto/crear-cotizacion.dto';
import { ResponderCotizacionBodyDto } from './dto/responder-cotizacion-body.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario, EstadoCotizacion } from '../../common/enums';
import { Usuario } from '../../entities/Usuario';

@ApiTags('Cotizaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('cotizaciones')
export class CotizacionesController {
  constructor(private readonly cotizacionesService: CotizacionesService) {}

  @Post()
  @Roles(RolUsuario.TRABAJADOR)
  @ApiOperation({ summary: 'Enviar cotización inicial o re-cotización en sitio (Solo TRABAJADOR activo)' })
  crear(@Body() dto: CrearCotizacionDto, @CurrentUser() trabajador: Usuario) {
    return this.cotizacionesService.crear(dto, trabajador);
  }

  @Get('solicitud/:idSolicitud')
  @ApiOperation({ summary: 'Listar cotizaciones de una solicitud (Cliente dueño, Admin o propias del técnico)' })
  listarPorSolicitud(
    @Param('idSolicitud', ParseIntPipe) idSolicitud: number,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.cotizacionesService.listarPorSolicitud(idSolicitud, usuario);
  }

  @Patch(':id/responder')
  @Roles(RolUsuario.CLIENTE)
  @ApiOperation({ summary: 'Aceptar o rechazar cotización o re-cotización en sitio (Solo CLIENTE dueño)' })
  @ApiQuery({ name: 'estado', enum: [EstadoCotizacion.ACEPTADA, EstadoCotizacion.RECHAZADA] })
  responder(
    @Param('id', ParseIntPipe) id: number,
    @Query('estado', new ParseEnumPipe(EstadoCotizacion)) estado: EstadoCotizacion,
    @CurrentUser() cliente: Usuario,
    @Body() body?: ResponderCotizacionBodyDto,
  ) {
    return this.cotizacionesService.responderCotizacion(id, estado, cliente, body);
  }
}
