import {
  Controller,
  Post,
  Get,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { ReclamosService } from './reclamos.service';
import { CrearReclamoDto } from './dto/crear-reclamo.dto';
import { ResolverReclamoDto } from './dto/resolver-reclamo.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/enums';
import { Usuario } from '../../entities/Usuario';

@ApiTags('Reclamos y Sanciones')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('reclamos')
export class ReclamosController {
  constructor(private readonly reclamosService: ReclamosService) {}

  @Post()
  @ApiOperation({ summary: 'Presentar reclamo sobre un servicio (Máximo 1 por servicio, RN-06)' })
  registrarReclamo(@Body() dto: CrearReclamoDto, @CurrentUser() denunciante: Usuario) {
    return this.reclamosService.registrarReclamo(dto, denunciante);
  }

  @Get()
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Listar todos los reclamos registrados (Solo ADMIN)' })
  listarTodos() {
    return this.reclamosService.listarTodos();
  }

  @Get('solicitud/:idSolicitud')
  @ApiOperation({ summary: 'Consultar reclamo asociado a una solicitud (Solo participantes o ADMIN)' })
  obtenerPorSolicitud(
    @Param('idSolicitud', ParseIntPipe) idSolicitud: number,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.reclamosService.obtenerPorSolicitud(idSolicitud, usuario);
  }

  @Patch(':id/resolver')
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Resolver reclamo y aplicar sanciones Fibonacci o bloqueo por robo (Solo ADMIN)' })
  resolverReclamo(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolverReclamoDto,
  ) {
    return this.reclamosService.resolverReclamo(id, dto.resolucion);
  }
}
