import {
  Controller,
  Post,
  Get,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CalificacionesService } from './calificaciones.service';
import { CrearCalificacionDto } from './dto/crear-calificacion.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Usuario } from '../../entities/Usuario';

@ApiTags('Calificaciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('calificaciones')
export class CalificacionesController {
  constructor(private readonly calificacionesService: CalificacionesService) {}

  @Post()
  @ApiOperation({ summary: 'Calificar un servicio finalizado (Cliente califica técnico / Técnico califica cliente)' })
  calificar(@Body() dto: CrearCalificacionDto, @CurrentUser() evaluador: Usuario) {
    return this.calificacionesService.calificar(dto, evaluador);
  }

  @Get('usuario/:idUsuario')
  @ApiOperation({ summary: 'Consultar calificaciones (Públicas para técnicos / Internas de clientes para trabajadores)' })
  listarPorUsuario(
    @Param('idUsuario', ParseIntPipe) idUsuario: number,
    @CurrentUser() usuarioConsultante: Usuario,
  ) {
    return this.calificacionesService.listarPorUsuario(idUsuario, usuarioConsultante);
  }
}
