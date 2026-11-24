import { Controller, Post, Get, Body, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { AuthService } from './auth.service';
import { LoginDto, RegistroClienteDto, RegistroTrabajadorDto } from './dto/auth.dto';
import { JwtAuthGuard } from './jwt-auth.guard';
import { CurrentUser } from '../../common/decorators/current-user.decorator';
import { Usuario } from '../../entities/Usuario';

@ApiTags('Autenticación')
@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login')
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  @ApiOperation({ summary: 'Iniciar sesión y obtener token JWT' })
  @ApiResponse({ status: 200, description: 'Sesión iniciada con éxito' })
  login(@Body() dto: LoginDto) {
    return this.authService.login(dto);
  }

  @Post('registro-cliente')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Registrar nuevo cliente' })
  @ApiResponse({ status: 201, description: 'Cliente registrado' })
  registrarCliente(@Body() dto: RegistroClienteDto) {
    return this.authService.registrarCliente(dto);
  }

  @Post('registro-trabajador')
  @Throttle({ default: { limit: 5, ttl: 60000 } })
  @ApiOperation({ summary: 'Registrar nuevo trabajador (queda en revisión)' })
  @ApiResponse({ status: 201, description: 'Trabajador registrado' })
  registrarTrabajador(@Body() dto: RegistroTrabajadorDto) {
    return this.authService.registrarTrabajador(dto);
  }

  @Get('me')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Obtener perfil y estado de cuenta del usuario autenticado' })
  me(@CurrentUser() usuario: Usuario) {
    return this.authService.obtenerPerfilActual(usuario);
  }
}
