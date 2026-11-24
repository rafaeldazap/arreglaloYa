import { Injectable, UnauthorizedException } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ExtractJwt, Strategy } from 'passport-jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { ConfigService } from '@nestjs/config';
import { Repository } from 'typeorm';
import { Usuario } from '../../entities/Usuario';
import { EstadoCuenta } from '../../common/enums';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    configService: ConfigService,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'),
    });
  }

  async validate(payload: { sub: number; correo: string; rol: string }) {
    const usuario = await this.usuarioRepo.findOne({ where: { idUsuario: payload.sub } });
    if (!usuario) {
      throw new UnauthorizedException('Token no válido o usuario no existe');
    }

    if (usuario.estadoCuenta === EstadoCuenta.BLOQUEADO_PERMANENTE) {
      throw new UnauthorizedException('Su cuenta ha sido bloqueada permanentemente');
    }

    if (usuario.estadoCuenta === EstadoCuenta.SUSPENDIDO) {
      const ahora = new Date();
      if (usuario.suspendidoHasta && ahora < new Date(usuario.suspendidoHasta)) {
        throw new UnauthorizedException(
          `Su cuenta se encuentra suspendida hasta: ${usuario.suspendidoHasta.toISOString()}`,
        );
      } else {
        // La suspensión ha concluido
        usuario.estadoCuenta = EstadoCuenta.ACTIVO;
        usuario.suspendidoHasta = null;
        await this.usuarioRepo.save(usuario);
      }
    }

    return usuario;
  }
}
