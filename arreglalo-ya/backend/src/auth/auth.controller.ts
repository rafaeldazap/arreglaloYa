import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto, RegistroDto } from './auth.dto.js';
import { JwtGuard } from './jwt.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private auth: AuthService) {}

  @Post('registro')
  registro(@Body() datos: RegistroDto) {
    return this.auth.registrar(datos);
  }

  @Post('login')
  login(@Body() datos: LoginDto) {
    return this.auth.login(datos);
  }

  @UseGuards(JwtGuard)
  @Get('perfil')
  perfil(@Req() req: { usuario: { sub: number } }) {
    return this.auth.perfil(req.usuario.sub);
  }
}
