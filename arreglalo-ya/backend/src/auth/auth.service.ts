import { BadRequestException, ConflictException, ForbiddenException, Injectable, UnauthorizedException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import bcrypt from 'bcryptjs';
import { DataSource, In, Repository } from 'typeorm';
import { Usuario } from '../entidades/usuario.entity.js';
import { PerfilTrabajador } from '../entidades/perfil-trabajador.entity.js';
import { Categoria } from '../entidades/categoria.entity.js';
import { Zona } from '../entidades/zona.entity.js';
import { LoginDto, RegistroDto } from './auth.dto.js';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario) private usuarios: Repository<Usuario>,
    private dataSource: DataSource,
    private jwt: JwtService,
  ) {}

  async registrar(datos: RegistroDto) {
    const correo = datos.correo.toLowerCase();
    if (await this.usuarios.findOne({ where: { correo } })) {
      throw new ConflictException('Ya existe una cuenta con ese correo');
    }
    if (datos.rol === 'TRABAJADOR' && (!datos.ci || !datos.especialidades || !datos.zonas)) {
      throw new BadRequestException('El trabajador debe indicar su CI, especialidades y zonas');
    }

    // Usuario y perfil se guardan juntos: si algo falla, no se guarda nada
    const usuario = await this.dataSource.transaction(async (m) => {
      const nuevo = await m.save(Usuario, {
        nombreCompleto: datos.nombre,
        correo,
        telefono: datos.telefono,
        passwordHash: await bcrypt.hash(datos.password, 10),
        rol: datos.rol,
        estadoCuenta: datos.rol === 'TRABAJADOR' ? 'REVISION' : 'ACTIVO',
      });

      if (datos.rol === 'TRABAJADOR') {
        if (await m.findOne(PerfilTrabajador, { where: { ciNumero: datos.ci } })) {
          throw new ConflictException('Ya existe un trabajador con ese CI');
        }
        await m.save(PerfilTrabajador, {
          usuario: nuevo,
          ciNumero: datos.ci,
          categorias: await m.find(Categoria, { where: { nombre: In(datos.especialidades!) } }),
          zonas: await m.find(Zona, { where: { nombre: In(datos.zonas!) } }),
        });
      }
      return nuevo;
    });

    return this.respuesta(usuario);
  }

  async login(datos: LoginDto) {
    const usuario = await this.usuarios.findOne({
      where: { correo: datos.correo.toLowerCase() },
      select: { id: true, nombreCompleto: true, correo: true, rol: true, estadoCuenta: true, passwordHash: true },
    });
    if (!usuario || !(await bcrypt.compare(datos.password, usuario.passwordHash))) {
      throw new UnauthorizedException('Correo o contraseña incorrectos');
    }
    if (usuario.estadoCuenta === 'SUSPENDIDO' || usuario.estadoCuenta === 'BLOQUEADO_PERMANENTE') {
      throw new ForbiddenException('Tu cuenta está suspendida o bloqueada');
    }
    return this.respuesta(usuario);
  }

  async perfil(id: number) {
    const usuario = await this.usuarios.findOneByOrFail({ id });
    return this.datosPublicos(usuario);
  }

  private async respuesta(usuario: Usuario) {
    const token = await this.jwt.signAsync({ sub: usuario.id, rol: usuario.rol });
    return { token, usuario: this.datosPublicos(usuario) };
  }

  private datosPublicos(u: Usuario) {
    return { id: u.id, nombre: u.nombreCompleto, correo: u.correo, rol: u.rol, estadoCuenta: u.estadoCuenta };
  }
}
