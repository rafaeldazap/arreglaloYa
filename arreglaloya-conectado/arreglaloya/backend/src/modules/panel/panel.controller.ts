import { Controller, Get, Param, ParseIntPipe, Patch, UseGuards } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiTags } from '@nestjs/swagger';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/enums';
import { Usuario } from '../../entities/Usuario';
import { PanelService } from './panel.service';

@ApiTags('Panel (frontend)')
@Controller('panel')
export class PanelController {
  constructor(private readonly panel: PanelService) {}

  @Get('trabajadores')
  @ApiOperation({ summary: 'Trabajadores activos con especialidades, zonas, promedio y opiniones (público)' })
  trabajadoresActivos() {
    return this.panel.trabajadores(false);
  }

  @Get('trabajadores/todos')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Todos los trabajadores con documentos y estado de cuenta (admin)' })
  trabajadoresTodos() {
    return this.panel.trabajadores(true);
  }

  @Get('pedidos')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({
    summary:
      'Pedidos del usuario con cotizaciones, pagos, historial, reclamo y calificación (cliente: los suyos; trabajador: bandeja zonal + asignados; admin: todos)',
  })
  pedidos(@CurrentUser() usuario: Usuario) {
    return this.panel.pedidos(usuario);
  }

  @Patch('pedidos/:id/iniciar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.TRABAJADOR)
  @ApiOperation({ summary: 'El trabajador asignado inicia el servicio (APROBADO → EN_PROCESO)' })
  iniciar(@Param('id', ParseIntPipe) id: number, @CurrentUser() usuario: Usuario) {
    return this.panel.iniciar(id, usuario);
  }

  @Patch('pedidos/:id/terminar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.TRABAJADOR)
  @ApiOperation({ summary: 'El trabajador avisa que terminó; el cliente ya puede firmar conformidad y pagar el saldo' })
  terminar(@Param('id', ParseIntPipe) id: number, @CurrentUser() usuario: Usuario) {
    return this.panel.terminar(id, usuario);
  }
}
