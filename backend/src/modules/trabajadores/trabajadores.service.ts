import { Injectable, NotFoundException, BadRequestException, ForbiddenException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { PerfilTrabajador } from '../../entities/PerfilTrabajador';
import { Usuario } from '../../entities/Usuario';
import { HorarioAtencion } from '../../entities/HorarioAtencion';
import { SuspensionTrabajador } from '../../entities/SuspensionTrabajador';
import { EstadoCuenta, RolUsuario } from '../../common/enums';
import { VerificarTrabajadorDto } from './dto/verificar-trabajador.dto';
import { ConfigurarAgendaQrDto } from './dto/configurar-agenda-qr.dto';
import { SuspenderTrabajadorDto } from './dto/suspender-trabajador.dto';
import { LevantarSuspensionDto } from './dto/levantar-suspension.dto';
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
    @InjectRepository(SuspensionTrabajador)
    private readonly suspensionRepo: Repository<SuspensionTrabajador>,
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

  // RF-17: Suspender temporalmente a un trabajador (Solo ADMIN)
  async suspender(idPerfil: number, dto: SuspenderTrabajadorDto, admin: Usuario) {
    const perfil = await this.perfilRepo.findOne({
      where: { idPerfil },
      relations: ['usuario'],
    });

    if (!perfil) {
      throw new NotFoundException(`Perfil de trabajador no encontrado con ID: ${idPerfil}`);
    }

    const usuario = perfil.usuario;
    if (usuario.rol !== RolUsuario.TRABAJADOR) {
      throw new BadRequestException('El usuario no corresponde a un perfil de trabajador');
    }

    if (usuario.estadoCuenta === EstadoCuenta.BLOQUEADO_PERMANENTE) {
      throw new BadRequestException('La cuenta se encuentra bloqueada permanentemente y no puede modificarse.');
    }

    const inicio = dto.fechaInicio ? new Date(dto.fechaInicio) : new Date();
    let fin: Date;

    if (dto.fechaFin) {
      fin = new Date(dto.fechaFin);
    } else {
      const dias = dto.dias && dto.dias > 0 ? dto.dias : 7;
      fin = new Date(inicio.getTime() + dias * 24 * 60 * 60 * 1000);
    }

    if (fin.getTime() <= inicio.getTime()) {
      throw new BadRequestException('La fecha de fin de la suspensión debe ser posterior a la fecha de inicio');
    }

    const duracionDias = Math.max(1, Math.ceil((fin.getTime() - inicio.getTime()) / (1000 * 60 * 60 * 24)));

    // Desactivar suspensiones activas previas
    await this.suspensionRepo.update(
      { trabajador: { idPerfil: perfil.idPerfil }, activa: true },
      { activa: false, observacionLevantamiento: 'Superada por nueva suspensión aplicada por administración' },
    );

    // Crear registro en el historial de suspensiones
    const suspension = this.suspensionRepo.create({
      trabajador: perfil,
      motivo: dto.motivo,
      fechaInicio: inicio,
      fechaFin: fin,
      dias: duracionDias,
      activa: true,
      creadoPor: admin,
    });

    await this.suspensionRepo.save(suspension);

    // Actualizar estado y fecha en usuario
    usuario.estadoCuenta = EstadoCuenta.SUSPENDIDO;
    usuario.suspendidoHasta = fin;
    await this.usuarioRepo.save(usuario);

    return {
      mensaje: `Trabajador suspendido temporalmente por ${duracionDias} día(s).`,
      idSuspension: suspension.idSuspension,
      idPerfil,
      idUsuario: usuario.idUsuario,
      nombreTrabajador: usuario.nombreCompleto,
      estadoCuenta: usuario.estadoCuenta,
      motivo: suspension.motivo,
      fechaInicio: suspension.fechaInicio,
      fechaFin: suspension.fechaFin,
      dias: duracionDias,
      suspendidoPor: admin.nombreCompleto,
    };
  }

  // RF-17: Consultar historial de suspensiones (ADMIN o el propio TRABAJADOR)
  async consultarSuspensiones(idPerfil: number, usuarioActual: Usuario) {
    const perfil = await this.perfilRepo.findOne({
      where: { idPerfil },
      relations: ['usuario'],
    });

    if (!perfil) {
      throw new NotFoundException(`Perfil de trabajador no encontrado con ID: ${idPerfil}`);
    }

    // Permisos: Solo ADMIN o el mismo trabajador dueño de su perfil
    if (
      usuarioActual.rol !== RolUsuario.ADMIN &&
      usuarioActual.idUsuario !== perfil.usuario.idUsuario
    ) {
      throw new ForbiddenException('No tiene permisos para consultar el historial de suspensiones de este trabajador');
    }

    const ahora = new Date();
    // Auto-restaurar si el periodo de suspensión venció
    if (perfil.usuario.estadoCuenta === EstadoCuenta.SUSPENDIDO && perfil.usuario.suspendidoHasta) {
      if (ahora > new Date(perfil.usuario.suspendidoHasta)) {
        perfil.usuario.estadoCuenta = EstadoCuenta.ACTIVO;
        perfil.usuario.suspendidoHasta = null;
        await this.usuarioRepo.save(perfil.usuario);
        await this.suspensionRepo.update(
          { trabajador: { idPerfil }, activa: true },
          { activa: false },
        );
      }
    }

    const suspensiones = await this.suspensionRepo.find({
      where: { trabajador: { idPerfil } },
      relations: ['creadoPor', 'levantadoPor'],
      order: { fechaCreacion: 'DESC' },
    });

    return {
      idPerfil,
      nombreTrabajador: perfil.usuario.nombreCompleto,
      estadoCuentaActual: perfil.usuario.estadoCuenta,
      suspendidoHasta: perfil.usuario.suspendidoHasta,
      totalSuspensiones: suspensiones.length,
      historial: suspensiones.map((s) => {
        const esVigente = s.activa && ahora >= new Date(s.fechaInicio) && ahora <= new Date(s.fechaFin);
        return {
          idSuspension: s.idSuspension,
          motivo: s.motivo,
          fechaInicio: s.fechaInicio,
          fechaFin: s.fechaFin,
          dias: s.dias,
          activa: s.activa,
          esVigente,
          fechaCreacion: s.fechaCreacion,
          creadoPor: s.creadoPor ? s.creadoPor.nombreCompleto : 'Administración',
          fechaLevantamiento: s.fechaLevantamiento,
          observacionLevantamiento: s.observacionLevantamiento,
          levantadoPor: s.levantadoPor ? s.levantadoPor.nombreCompleto : null,
        };
      }),
    };
  }

  // RF-17: Levantar suspensión anticipadamente (Solo ADMIN)
  async levantarSuspension(idPerfil: number, dto: LevantarSuspensionDto, admin: Usuario) {
    const perfil = await this.perfilRepo.findOne({
      where: { idPerfil },
      relations: ['usuario'],
    });

    if (!perfil) {
      throw new NotFoundException(`Perfil de trabajador no encontrado con ID: ${idPerfil}`);
    }

    const usuario = perfil.usuario;
    if (usuario.estadoCuenta === EstadoCuenta.BLOQUEADO_PERMANENTE) {
      throw new BadRequestException('La cuenta está bloqueada permanentemente y no puede ser reactivada.');
    }

    await this.suspensionRepo.update(
      { trabajador: { idPerfil }, activa: true },
      {
        activa: false,
        fechaLevantamiento: new Date(),
        observacionLevantamiento: dto.motivo || 'Suspensión levantada manualmente por el administrador.',
        levantadoPor: admin,
      },
    );

    usuario.estadoCuenta = EstadoCuenta.ACTIVO;
    usuario.suspendidoHasta = null;
    await this.usuarioRepo.save(usuario);

    return {
      mensaje: 'Suspensión levantada con éxito. El trabajador se encuentra ACTIVO nuevamente.',
      idPerfil,
      idUsuario: usuario.idUsuario,
      nombreTrabajador: usuario.nombreCompleto,
      estadoCuenta: usuario.estadoCuenta,
    };
  }
}
