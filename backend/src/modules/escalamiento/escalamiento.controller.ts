import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Put,
  Query,
  UseGuards,
} from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/enums';
import { Usuario } from '../../entities/Usuario';
import { EscalamientoService } from './escalamiento.service';
import {
  ConfigurarPlazoDto,
  EscalarReclamoDto,
  FiltrosEscalamientoDto,
  ReasignarReclamoDto,
  ResolverEscalamientoDto,
} from './dto/escalamiento.dto';

@ApiTags('Escalamiento de reclamos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(RolUsuario.ADMIN)
@Controller('escalamiento')
export class EscalamientoController {
  constructor(private readonly service: EscalamientoService) {}

  @Get('configuracion')
  @ApiOperation({ summary: 'Ver el plazo máximo configurado para resolver reclamos (Solo ADMIN)' })
  verConfiguracion() {
    return this.service.verConfiguracion();
  }

  @Put('configuracion')
  @ApiOperation({ summary: 'Cambiar el plazo máximo en minutos y aplicarlo a los reclamos abiertos (Solo ADMIN)' })
  configurar(@Body() dto: ConfigurarPlazoDto, @CurrentUser() admin: Usuario) {
    return this.service.configurarPlazo(dto, admin);
  }

  @Get('reclamos')
  @ApiOperation({ summary: 'Listar reclamos con su estado de plazo, filtros y paginación (Solo ADMIN)' })
  listar(@Query() query: FiltrosEscalamientoDto) {
    return this.service.listar(query);
  }

  @Get('resumen')
  @ApiOperation({ summary: 'Totales: en plazo, escalados, resueltos y sin responsable (Solo ADMIN)' })
  resumen() {
    return this.service.resumen();
  }

  @Post('verificar')
  @ApiOperation({ summary: 'Ejecutar ahora la verificación de reclamos vencidos (Solo ADMIN)' })
  verificar() {
    return this.service.verificarVencidos();
  }

  @Get('administradores')
  @ApiOperation({ summary: 'Administradores activos disponibles como responsables (Solo ADMIN)' })
  administradores() {
    return this.service.listarAdministradores();
  }

  @Get('reclamos/:id/historial')
  @ApiOperation({ summary: 'Historial de decisiones administrativas de un reclamo (Solo ADMIN)' })
  historial(@Param('id', ParseIntPipe) id: number) {
    return this.service.historial(id);
  }

  @Patch('reclamos/:id/reasignar')
  @ApiOperation({ summary: 'Reasignar el reclamo a un administrador responsable (Solo ADMIN)' })
  reasignar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ReasignarReclamoDto,
    @CurrentUser() admin: Usuario,
  ) {
    return this.service.reasignar(id, dto, admin);
  }

  @Patch('reclamos/:id/escalar')
  @ApiOperation({ summary: 'Escalar manualmente un reclamo con un motivo (Solo ADMIN)' })
  escalar(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: EscalarReclamoDto,
    @CurrentUser() admin: Usuario,
  ) {
    return this.service.escalarManual(id, dto, admin);
  }

  @Patch('reclamos/:id/resolver')
  @ApiOperation({ summary: 'Resolver el reclamo (aplica sanciones) y registrar la decisión (Solo ADMIN)' })
  resolver(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: ResolverEscalamientoDto,
    @CurrentUser() admin: Usuario,
  ) {
    return this.service.resolver(id, dto, admin);
  }
}
