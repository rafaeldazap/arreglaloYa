import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { TrabajadoresService } from './trabajadores.service';
import { VerificarTrabajadorDto } from './dto/verificar-trabajador.dto';
import { ConfigurarAgendaQrDto } from './dto/configurar-agenda-qr.dto';
import { BuscarTrabajadoresQueryDto } from './dto/buscar-trabajadores-query.dto';
import { SuspenderTrabajadorDto } from './dto/suspender-trabajador.dto';
import { LevantarSuspensionDto } from './dto/levantar-suspension.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/enums';
import { Usuario } from '../../entities/Usuario';

@ApiTags('Trabajadores')
@Controller('trabajadores')
export class TrabajadoresController {
  constructor(private readonly trabajadoresService: TrabajadoresService) {}

  @Get()
  @ApiOperation({ summary: 'Buscar trabajadores verificados por categoría y/o zona (Público, sin PII)' })
  buscar(@Query() query: BuscarTrabajadoresQueryDto) {
    return this.trabajadoresService.buscar(
      query.categoria,
      query.zona,
      query.page ?? 1,
      query.limit ?? 20,
    );
  }

  @Get('admin/pendientes')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Listar trabajadores en estado REVISION pendientes de aprobación (Solo ADMIN, CU-05)' })
  listarPendientesAdmin() {
    return this.trabajadoresService.listarPendientesAdmin();
  }

  @Get(':id')
  @ApiOperation({ summary: 'Obtener el detalle público de un trabajador por ID (Sin documentos ni contacto privado)' })
  obtenerPorId(@Param('id', ParseIntPipe) id: number) {
    return this.trabajadoresService.obtenerPorId(id);
  }

  @Get(':id/admin-auditoria')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Ver perfil completo con documentos de identidad y penales (Solo ADMIN)' })
  obtenerDetalleAdmin(@Param('id', ParseIntPipe) id: number) {
    return this.trabajadoresService.obtenerDetalleAdmin(id);
  }

  @Patch(':id/verificar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Aprobar o rechazar verificación documental de un trabajador (Solo ADMIN)' })
  verificarTrabajador(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: VerificarTrabajadorDto,
  ) {
    return this.trabajadoresService.verificarTrabajador(id, dto);
  }

  @Patch('mi-perfil/agenda-qr')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.TRABAJADOR)
  @ApiOperation({ summary: 'Configurar horarios, margen de error (buffer) y QR de cobro (Solo TRABAJADOR)' })
  configurarAgendaQr(
    @CurrentUser() usuario: Usuario,
    @Body() dto: ConfigurarAgendaQrDto,
  ) {
    return this.trabajadoresService.configurarAgendaQr(usuario, dto);
  }

  @Post(':id/suspender')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Suspender temporalmente a un trabajador estableciendo motivo y periodo (Solo ADMIN)' })
  suspender(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: SuspenderTrabajadorDto,
    @CurrentUser() admin: Usuario,
  ) {
    return this.trabajadoresService.suspender(id, dto, admin);
  }

  @Get(':id/suspensiones')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Consultar historial de suspensiones del trabajador (ADMIN o el propio trabajador)' })
  consultarSuspensiones(
    @Param('id', ParseIntPipe) id: number,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.trabajadoresService.consultarSuspensiones(id, usuario);
  }

  @Patch(':id/levantar-suspension')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Levantar anticipadamente la suspensión temporal de un trabajador (Solo ADMIN)' })
  levantarSuspension(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: LevantarSuspensionDto,
    @CurrentUser() admin: Usuario,
  ) {
    return this.trabajadoresService.levantarSuspension(id, dto, admin);
  }
}
