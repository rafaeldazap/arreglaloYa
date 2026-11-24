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
import { PagosService } from './pagos.service';
import { RegistrarPagoDto } from './dto/registrar-pago.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { RolUsuario } from '../../common/enums';
import { Usuario } from '../../entities/Usuario';

@ApiTags('Pagos')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Controller('pagos')
export class PagosController {
  constructor(private readonly pagosService: PagosService) {}

  @Post()
  @Roles(RolUsuario.CLIENTE)
  @ApiOperation({ summary: 'Abonar anticipo 25% o registrar pago de saldo 75% (Solo CLIENTE)' })
  registrarPago(@Body() dto: RegistrarPagoDto, @CurrentUser() cliente: Usuario) {
    return this.pagosService.registrarPago(dto, cliente);
  }

  @Get('solicitud/:idSolicitud')
  @ApiOperation({ summary: 'Consultar historial y estado de pagos (Solo participantes o ADMIN)' })
  listarPorSolicitud(
    @Param('idSolicitud', ParseIntPipe) idSolicitud: number,
    @CurrentUser() usuario: Usuario,
  ) {
    return this.pagosService.listarPorSolicitud(idSolicitud, usuario);
  }

  @Patch(':id/confirmar')
  @Roles(RolUsuario.TRABAJADOR, RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Confirmar recepción del saldo 75% y liberar fondos (Doble firma, Solo TRABAJADOR o ADMIN)' })
  confirmar(@Param('id', ParseIntPipe) id: number, @CurrentUser() trabajador: Usuario) {
    return this.pagosService.confirmarPorTrabajador(id, trabajador);
  }
}
