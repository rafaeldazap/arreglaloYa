import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PerfilTrabajador } from '../../entities/PerfilTrabajador';
import { Usuario } from '../../entities/Usuario';
import { HorarioAtencion } from '../../entities/HorarioAtencion';
import { EstadoCuenta, RolUsuario } from '../../common/enums';
import { VerificarTrabajadorDto } from './dto/verificar-trabajador.dto';
import { ConfigurarAgendaQrDto } from './dto/configurar-agenda-qr.dto';
import { sanitizeTrabajador } from '../../common/serializers/entity-sanitizer';

function horaAMinutos(hora: string): number {
  const [h, m] = hora.split(':').map((n) => parseInt(n, 10));
  return h * 60 + m;
}

@Injectable()
export class TrabajadoresService {
  constructor(
    @InjectRepository(PerfilTrabajador)
    private readonly perfilRepo: Repository<PerfilTrabajador>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly dataSource: DataSource,
  ) {}

  async buscar(categoriaId?: number, zonaId?: number, page: number = 1, limit: number = 20) {
    const qb = this.perfilRepo
      .createQueryBuilder('perfil')
      .leftJoinAndSelect('perfil.usuario', 'usuario')
      .leftJoinAndSelect('perfil.categorias', 'categoria')
      .leftJoinAndSelect('perfil.zonas', 'zona')
      .where('usuario.estadoCuenta = :estado', { estado: EstadoCuenta.ACTIVO });

    if (categoriaId) {
      qb.andWhere('categoria.idCategoria = :categoriaId', { categoriaId });
    }

    if (zonaId) {
      qb.andWhere('zona.idZona = :zonaId', { zonaId });
    }

    const skip = (page - 1) * limit;
    qb.skip(skip).take(limit);

    const [trabajadores, total] = await qb.getManyAndCount();

    return {
      data: trabajadores.map((t) => sanitizeTrabajador(t)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async obtenerPorId(id: number) {
    const t = await this.perfilRepo.findOne({
      where: { idPerfil: id, usuario: { estadoCuenta: EstadoCuenta.ACTIVO } },
      relations: ['usuario', 'categorias', 'zonas', 'horarios'],
    });

    if (!t) {
      throw new NotFoundException(`Trabajador activo no encontrado con ID: ${id}`);
    }

    // RN-11: Ocultar CI, antecedentes, correo y teléfono personal en perfil público
    return sanitizeTrabajador(t);
  }

  // CU-05: Bandeja de trabajadores pendientes de revisión documental (Solo ADMIN)
  async listarPendientesAdmin() {
    const pendientes = await this.perfilRepo.find({
      where: { usuario: { estadoCuenta: EstadoCuenta.REVISION } },
      relations: ['usuario', 'categorias', 'zonas'],
      order: { idPerfil: 'DESC' },
    });

    return pendientes.map((t) =>
      sanitizeTrabajador(t, { includeContact: true, includeAdminDocs: true }),
    );
  }

  // CU-05: Detalle completo para el Administrador (con documentos sensibles)
  async obtenerDetalleAdmin(id: number) {
    const t = await this.perfilRepo.findOne({
      where: { idPerfil: id },
      relations: ['usuario', 'categorias', 'zonas', 'horarios'],
    });

    if (!t) {
      throw new NotFoundException(`Perfil de trabajador no encontrado con ID: ${id}`);
    }

    return sanitizeTrabajador(t, {
      includeContact: true,
      includeQr: true,
      includeAdminDocs: true,
    });
  }

  // CU-05: Aprobar o rechazar documentos (Solo ADMIN)
  async verificarTrabajador(idPerfil: number, dto: VerificarTrabajadorDto) {
    const perfil = await this.perfilRepo.findOne({
      where: { idPerfil },
      relations: ['usuario'],
    });

    if (!perfil) {
      throw new NotFoundException(`Perfil de trabajador no encontrado con ID: ${idPerfil}`);
    }

    const usuario = perfil.usuario;
    if (usuario.rol !== RolUsuario.TRABAJADOR) {
      throw new BadRequestException('El perfil no corresponde a un trabajador');
    }

    // RN-07: Bloqueo permanente es irreversible
    if (usuario.estadoCuenta === EstadoCuenta.BLOQUEADO_PERMANENTE) {
      throw new BadRequestException(
        'La cuenta se encuentra bloqueada permanentemente por infracción grave (RN-07) y no puede reactivarse',
      );
    }

    usuario.estadoCuenta = dto.aprobar ? EstadoCuenta.ACTIVO : EstadoCuenta.REVISION;
    await this.usuarioRepo.save(usuario);

    return {
      idPerfil,
      idUsuario: usuario.idUsuario,
      nombreCompleto: usuario.nombreCompleto,
      estadoCuenta: usuario.estadoCuenta,
      mensaje: dto.aprobar
        ? 'Trabajador verificado y activado exitosamente'
        : `Verificación observada/rechazada: ${dto.motivo || 'Documentación insuficiente'}`,
    };
  }

  // CU-07: Configurar margen de error, QR y horarios (Solo TRABAJADOR)
  async configurarAgendaQr(usuario: Usuario, dto: ConfigurarAgendaQrDto) {
    if (dto.horarios) {
      for (const h of dto.horarios) {
        if (horaAMinutos(h.horaFin) <= horaAMinutos(h.horaInicio)) {
          throw new BadRequestException(
            `Horario inválido para día ${h.diaSemana}: horaFin (${h.horaFin}) debe ser posterior a horaInicio (${h.horaInicio})`,
          );
        }
      }
    }

    const perfilActualizadoId = await this.dataSource.transaction(async (manager) => {
      const perfil = await manager.findOne(PerfilTrabajador, {
        where: { usuario: { idUsuario: usuario.idUsuario } },
        relations: ['horarios'],
      });

      if (!perfil) {
        throw new BadRequestException('El usuario no posee un perfil de trabajador');
      }

      if (dto.margenErrorMin !== undefined) {
        perfil.margenErrorMin = dto.margenErrorMin;
      }
      if (dto.qrImagenUrl !== undefined) {
        perfil.qrImagenUrl = dto.qrImagenUrl;
      }
      if (dto.qrVigenciaMin !== undefined) {
        perfil.qrVigenciaMin = dto.qrVigenciaMin;
      }

      await manager.save(PerfilTrabajador, perfil);

      if (dto.horarios !== undefined) {
        await manager.delete(HorarioAtencion, { perfilTrabajador: { idPerfil: perfil.idPerfil } });

        if (dto.horarios.length > 0) {
          const nuevosHorarios = dto.horarios.map((h) =>
            manager.create(HorarioAtencion, {
              perfilTrabajador: perfil,
              diaSemana: h.diaSemana,
              horaInicio: h.horaInicio,
              horaFin: h.horaFin,
            }),
          );
          await manager.save(HorarioAtencion, nuevosHorarios);
        }
      }

      return perfil.idPerfil;
    });

    const completo = await this.perfilRepo.findOne({
      where: { idPerfil: perfilActualizadoId },
      relations: ['usuario', 'categorias', 'zonas', 'horarios'],
    });

    return sanitizeTrabajador(completo, {
      includeContact: true,
      includeQr: true,
    });
  }
}
