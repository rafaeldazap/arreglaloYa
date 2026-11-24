import { Injectable, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, In, Repository } from 'typeorm';
import { JwtService } from '@nestjs/jwt';
import * as bcrypt from 'bcryptjs';
import { Usuario } from '../../entities/Usuario';
import { PerfilTrabajador } from '../../entities/PerfilTrabajador';
import { Categoria } from '../../entities/Categoria';
import { Zona } from '../../entities/Zona';
import { LoginDto, RegistroClienteDto, RegistroTrabajadorDto } from './dto/auth.dto';
import { RolUsuario, EstadoCuenta } from '../../common/enums';
import { sanitizeTrabajador } from '../../common/serializers/entity-sanitizer';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(PerfilTrabajador)
    private readonly perfilRepo: Repository<PerfilTrabajador>,
    @InjectRepository(Categoria)
    private readonly categoriaRepo: Repository<Categoria>,
    @InjectRepository(Zona)
    private readonly zonaRepo: Repository<Zona>,
    private readonly jwtService: JwtService,
    private readonly dataSource: DataSource,
  ) {}

  async login(dto: LoginDto) {
    const correoNorm = dto.correo.trim().toLowerCase();

    const usuario = await this.usuarioRepo
      .createQueryBuilder('u')
      .addSelect('u.passwordHash')
      .where('LOWER(u.correo) = :correo', { correo: correoNorm })
      .getOne();

    if (!usuario) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    const passwordValido = await bcrypt.compare(dto.password, usuario.passwordHash);
    if (!passwordValido) {
      throw new UnauthorizedException('Credenciales inválidas');
    }

    if (usuario.estadoCuenta === EstadoCuenta.BLOQUEADO_PERMANENTE) {
      throw new UnauthorizedException('La cuenta ha sido bloqueada permanentemente');
    }

    if (usuario.estadoCuenta === EstadoCuenta.SUSPENDIDO) {
      const ahora = new Date();
      if (usuario.suspendidoHasta && ahora < new Date(usuario.suspendidoHasta)) {
        throw new UnauthorizedException(
          `La cuenta se encuentra suspendida hasta: ${usuario.suspendidoHasta.toISOString()}`,
        );
      } else {
        usuario.estadoCuenta = EstadoCuenta.ACTIVO;
        usuario.suspendidoHasta = null;
        await this.usuarioRepo.save(usuario);
      }
    }

    const payload = { sub: usuario.idUsuario, correo: usuario.correo, rol: usuario.rol };
    const token = this.jwtService.sign(payload);

    return {
      token,
      idUsuario: usuario.idUsuario,
      nombreCompleto: usuario.nombreCompleto,
      correo: usuario.correo,
      rol: usuario.rol,
      estadoCuenta: usuario.estadoCuenta,
    };
  }

  async registrarCliente(dto: RegistroClienteDto) {
    const correoNorm = dto.correo.trim().toLowerCase();
    const existe = await this.usuarioRepo
      .createQueryBuilder('u')
      .where('LOWER(u.correo) = :correo', { correo: correoNorm })
      .getOne();

    if (existe) {
      throw new BadRequestException('El correo ya se encuentra registrado');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);
    const usuario = this.usuarioRepo.create({
      nombreCompleto: dto.nombreCompleto.trim(),
      telefono: dto.telefono?.trim(),
      correo: correoNorm,
      passwordHash,
      rol: RolUsuario.CLIENTE,
      estadoCuenta: EstadoCuenta.ACTIVO,
    });

    const guardado = await this.usuarioRepo.save(usuario);
    const token = this.jwtService.sign({
      sub: guardado.idUsuario,
      correo: guardado.correo,
      rol: guardado.rol,
    });

    return {
      token,
      idUsuario: guardado.idUsuario,
      nombreCompleto: guardado.nombreCompleto,
      correo: guardado.correo,
      rol: guardado.rol,
      estadoCuenta: guardado.estadoCuenta,
    };
  }

  async registrarTrabajador(dto: RegistroTrabajadorDto) {
    const correoNorm = dto.correo.trim().toLowerCase();
    const ciNorm = dto.ciNumero.trim();

    const existeCorreo = await this.usuarioRepo
      .createQueryBuilder('u')
      .where('LOWER(u.correo) = :correo', { correo: correoNorm })
      .getOne();
    if (existeCorreo) {
      throw new BadRequestException('El correo ya se encuentra registrado');
    }

    const existeCi = await this.perfilRepo.findOne({ where: { ciNumero: ciNorm } });
    if (existeCi) {
      throw new BadRequestException('El número de CI ya se encuentra registrado');
    }

    const uniqueCatIds = [...new Set(dto.categoriasIds)];
    const uniqueZonaIds = [...new Set(dto.zonasIds)];

    const categorias = await this.categoriaRepo.findBy({
      idCategoria: In(uniqueCatIds),
      activa: true,
    });
    if (categorias.length !== uniqueCatIds.length) {
      throw new BadRequestException('Una o más categorías seleccionadas no existen o están inactivas');
    }

    const zonas = await this.zonaRepo.findBy({
      idZona: In(uniqueZonaIds),
      activa: true,
    });
    if (zonas.length !== uniqueZonaIds.length) {
      throw new BadRequestException('Una o más zonas seleccionadas no existen o están inactivas');
    }

    const passwordHash = await bcrypt.hash(dto.password, 10);

    const usuarioGuardado = await this.dataSource.transaction(async (manager) => {
      const usuario = manager.create(Usuario, {
        nombreCompleto: dto.nombreCompleto.trim(),
        telefono: dto.telefono?.trim(),
        correo: correoNorm,
        passwordHash,
        rol: RolUsuario.TRABAJADOR,
        estadoCuenta: EstadoCuenta.REVISION,
      });

      const savedUser = await manager.save(Usuario, usuario);

      const perfil = manager.create(PerfilTrabajador, {
        usuario: savedUser,
        ciNumero: ciNorm,
        urlCi: dto.urlCi,
        urlAntecedentes: dto.urlAntecedentes,
        urlExperiencia: dto.urlExperiencia,
        categorias,
        zonas,
      });

      await manager.save(PerfilTrabajador, perfil);
      return savedUser;
    });

    const token = this.jwtService.sign({
      sub: usuarioGuardado.idUsuario,
      correo: usuarioGuardado.correo,
      rol: usuarioGuardado.rol,
    });

    return {
      token,
      idUsuario: usuarioGuardado.idUsuario,
      nombreCompleto: usuarioGuardado.nombreCompleto,
      correo: usuarioGuardado.correo,
      rol: usuarioGuardado.rol,
      estadoCuenta: usuarioGuardado.estadoCuenta,
    };
  }

  async obtenerPerfilActual(usuario: Usuario) {
    const base = {
      idUsuario: usuario.idUsuario,
      nombreCompleto: usuario.nombreCompleto,
      telefono: usuario.telefono,
      correo: usuario.correo,
      rol: usuario.rol,
      estadoCuenta: usuario.estadoCuenta,
      nivelFibonacci: usuario.nivelFibonacci,
      suspendidoHasta: usuario.suspendidoHasta,
    };

    if (usuario.rol === RolUsuario.TRABAJADOR) {
      const perfil = await this.perfilRepo.findOne({
        where: { usuario: { idUsuario: usuario.idUsuario } },
        relations: ['usuario', 'categorias', 'zonas', 'horarios'],
      });
      return {
        ...base,
        perfilTrabajador: sanitizeTrabajador(perfil, {
          includeContact: true,
          includeQr: true,
          includeAdminDocs: true,
        }),
      };
    }

    return base;
  }
}
