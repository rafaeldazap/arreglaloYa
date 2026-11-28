import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import {
  Calificacion,
  Cotizacion,
  HistorialEstado,
  PerfilTrabajador,
  ReclamoSancion,
  SolicitudServicio,
  TransaccionPago,
  Usuario,
} from '../../entities';
import { EstadoCuenta, EstadoSolicitud, RolUsuario, TipoPago } from '../../common/enums';
import {
  sanitizeCotizacion,
  sanitizeHistorial,
  sanitizePago,
  sanitizeReclamo,
  sanitizeSolicitud,
} from '../../common/serializers/entity-sanitizer';

export const MARCA_TERMINADO = 'El trabajador marcó el trabajo como terminado';

@Injectable()
export class PanelService {
  constructor(
    @InjectRepository(PerfilTrabajador) private readonly perfilRepo: Repository<PerfilTrabajador>,
    @InjectRepository(SolicitudServicio) private readonly solicitudRepo: Repository<SolicitudServicio>,
    @InjectRepository(Cotizacion) private readonly cotizacionRepo: Repository<Cotizacion>,
    @InjectRepository(TransaccionPago) private readonly pagoRepo: Repository<TransaccionPago>,
    @InjectRepository(HistorialEstado) private readonly historialRepo: Repository<HistorialEstado>,
    @InjectRepository(ReclamoSancion) private readonly reclamoRepo: Repository<ReclamoSancion>,
    @InjectRepository(Calificacion) private readonly calificacionRepo: Repository<Calificacion>,
  ) {}

  // ---------- Trabajadores ----------

  async trabajadores(paraAdmin: boolean) {
    const perfiles = await this.perfilRepo.find({
      relations: ['usuario', 'categorias', 'zonas'],
      order: { idPerfil: 'ASC' },
    });
    const visibles = paraAdmin
      ? perfiles
      : perfiles.filter((p) => p.usuario?.estadoCuenta === EstadoCuenta.ACTIVO);
    const idsUsuario = visibles.map((p) => p.usuario.idUsuario);
    if (idsUsuario.length === 0) return [];

    // Calificaciones públicas (del cliente hacia el trabajador)
    const calificaciones = await this.calificacionRepo.find({
      where: { evaluado: { idUsuario: In(idsUsuario) }, esInterna: false },
      relations: ['evaluador', 'evaluado'],
      order: { fecha: 'DESC' },
    });
    // Trabajos finalizados por trabajador
    const finalizados = await this.solicitudRepo
      .createQueryBuilder('s')
      .select('s.id_trabajador', 'idPerfil')
      .addSelect('COUNT(*)', 'total')
      .where('s.estado = :estado', { estado: EstadoSolicitud.FINALIZADO })
      .groupBy('s.id_trabajador')
      .getRawMany<{ idPerfil: number; total: string }>();

    return visibles.map((p) => {
      const opiniones = calificaciones
        .filter((c) => c.evaluado?.idUsuario === p.usuario.idUsuario)
        .map((c) => ({
          cliente: nombreCorto(c.evaluador?.nombreCompleto ?? 'Cliente'),
          puntaje: c.puntaje,
          comentario: c.comentario ?? '',
          fecha: c.fecha,
        }));
      const promedio = opiniones.length
        ? Math.round((opiniones.reduce((s, o) => s + o.puntaje, 0) / opiniones.length) * 10) / 10
        : 0;
      return {
        idPerfil: p.idPerfil,
        idUsuario: p.usuario.idUsuario,
        nombreCompleto: p.usuario.nombreCompleto,
        estadoCuenta: p.usuario.estadoCuenta,
        suspendidoHasta: p.usuario.suspendidoHasta,
        categorias: p.categorias.map((c) => c.nombre),
        zonas: p.zonas.map((z) => z.nombre),
        promedio,
        trabajosRealizados: Number(finalizados.find((f) => Number(f.idPerfil) === p.idPerfil)?.total ?? 0),
        opiniones,
        // Datos privados: solo para el administrador
        ...(paraAdmin
          ? {
              correo: p.usuario.correo,
              telefono: p.usuario.telefono,
              ciNumero: p.ciNumero,
              documentos: [p.urlCi, p.urlAntecedentes, p.urlExperiencia].filter(Boolean),
            }
          : {}),
      };
    });
  }

  // ---------- Pedidos ----------

  async pedidos(usuario: Usuario) {
    const qb = this.solicitudRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.cliente', 'cliente')
      .leftJoinAndSelect('s.trabajador', 'trabajador')
      .leftJoinAndSelect('trabajador.usuario', 'trabajadorUsuario')
      .leftJoinAndSelect('s.categoria', 'categoria')
      .leftJoinAndSelect('s.zona', 'zona')
      .leftJoinAndSelect('s.fotos', 'fotos')
      .orderBy('s.fechaCreacion', 'DESC');

    let perfil: PerfilTrabajador | null = null;
    if (usuario.rol === RolUsuario.CLIENTE) {
      qb.where('cliente.idUsuario = :id', { id: usuario.idUsuario });
    } else if (usuario.rol === RolUsuario.TRABAJADOR) {
      perfil = await this.perfilRepo.findOne({
        where: { usuario: { idUsuario: usuario.idUsuario } },
        relations: ['zonas', 'categorias'],
      });
      if (!perfil) return [];
      const zonas = perfil.zonas.map((z) => z.idZona);
      const categorias = perfil.categorias.map((c) => c.idCategoria);
      const activo = usuario.estadoCuenta === EstadoCuenta.ACTIVO && zonas.length > 0 && categorias.length > 0;
      // Sus trabajos asignados + (si está activo) la bandeja de su zona y especialidad
      qb.where('trabajador.idPerfil = :idPerfil', { idPerfil: perfil.idPerfil });
      if (activo) {
        qb.orWhere(
          '(s.estado IN (:...abiertos) AND zona.idZona IN (:...zonas) AND categoria.idCategoria IN (:...categorias) AND trabajador.idPerfil IS NULL)',
          { abiertos: [EstadoSolicitud.PENDIENTE, EstadoSolicitud.BAJO_REVISION], zonas, categorias },
        );
      }
    }
    // ADMIN: todas las solicitudes
    const solicitudes = await qb.getMany();
    const ids = solicitudes.map((s) => s.idSolicitud);
    if (ids.length === 0) return [];

    const [cotizaciones, pagos, historial, reclamos, calificaciones] = await Promise.all([
      this.cotizacionRepo.find({
        where: { solicitud: { idSolicitud: In(ids) } },
        relations: ['solicitud', 'trabajador', 'trabajador.usuario'],
        order: { idCotizacion: 'ASC' },
      }),
      this.pagoRepo.find({ where: { solicitud: { idSolicitud: In(ids) } }, relations: ['solicitud'] }),
      this.historialRepo.find({
        where: { solicitud: { idSolicitud: In(ids) } },
        relations: ['solicitud', 'usuario'],
        order: { fechaHora: 'ASC' },
      }),
      this.reclamoRepo.find({
        where: { solicitud: { idSolicitud: In(ids) } },
        relations: ['solicitud', 'denunciante', 'denunciado'],
      }),
      this.calificacionRepo.find({
        where: { solicitud: { idSolicitud: In(ids) }, esInterna: false },
        relations: ['solicitud', 'evaluador', 'evaluado'],
      }),
    ]);

    return solicitudes.map((s) => {
      const id = s.idSolicitud;
      const esParticipante =
        usuario.rol === RolUsuario.ADMIN ||
        s.cliente?.idUsuario === usuario.idUsuario ||
        s.trabajador?.usuario?.idUsuario === usuario.idUsuario;
      const eventos = historial.filter((h) => h.solicitud?.idSolicitud === id);
      const calificacion = calificaciones.find((c) => c.solicitud?.idSolicitud === id);
      return {
        ...sanitizeSolicitud(s, usuario),
        // Un trabajador solo ve sus propias cotizaciones (no las de la competencia)
        cotizaciones: cotizaciones
          .filter((c) => c.solicitud?.idSolicitud === id)
          .filter((c) => perfil === null || c.trabajador?.idPerfil === perfil.idPerfil)
          .map((c) => sanitizeCotizacion(c)),
        pagos: esParticipante ? pagos.filter((p) => p.solicitud?.idSolicitud === id).map(sanitizePago) : [],
        historial: eventos.map(sanitizeHistorial),
        trabajoTerminado: eventos.some((h) => h.descripcion === MARCA_TERMINADO),
        reclamo: esParticipante
          ? (reclamos.filter((r) => r.solicitud?.idSolicitud === id).map(sanitizeReclamo)[0] ?? null)
          : null,
        calificacion: calificacion
          ? { puntaje: calificacion.puntaje, comentario: calificacion.comentario ?? '', fecha: calificacion.fecha }
          : null,
      };
    });
  }

  // ---------- Acciones del trabajador ----------

  async iniciar(id: number, usuario: Usuario) {
    const s = await this.solicitudDelTrabajador(id, usuario);
    if (s.estado !== EstadoSolicitud.APROBADO) {
      throw new BadRequestException(`Solo se inicia un servicio APROBADO (actual: ${s.estado})`);
    }
    const anticipo = await this.pagoRepo.findOne({
      where: { solicitud: { idSolicitud: id }, tipo: TipoPago.ANTICIPO_25 },
    });
    if (!anticipo) throw new BadRequestException('El cliente todavía no pagó el anticipo del 25% (RN-04)');
    s.estado = EstadoSolicitud.EN_PROCESO;
    await this.solicitudRepo.save(s);
    await this.registrar(s, usuario, EstadoSolicitud.APROBADO, EstadoSolicitud.EN_PROCESO, 'El trabajador inició el servicio');
    return { mensaje: 'Servicio iniciado', estado: s.estado };
  }

  async terminar(id: number, usuario: Usuario) {
    const s = await this.solicitudDelTrabajador(id, usuario);
    if (s.estado !== EstadoSolicitud.EN_PROCESO) {
      throw new BadRequestException(`Solo se termina un servicio EN_PROCESO (actual: ${s.estado})`);
    }
    await this.registrar(s, usuario, s.estado, s.estado, MARCA_TERMINADO);
    return { mensaje: 'Trabajo marcado como terminado', estado: s.estado };
  }

  private async solicitudDelTrabajador(id: number, usuario: Usuario) {
    const s = await this.solicitudRepo.findOne({
      where: { idSolicitud: id },
      relations: ['trabajador', 'trabajador.usuario'],
    });
    if (!s) throw new NotFoundException(`Solicitud #${id} no encontrada`);
    if (s.trabajador?.usuario?.idUsuario !== usuario.idUsuario) {
      throw new ForbiddenException('Solo el trabajador asignado puede hacer esto');
    }
    return s;
  }

  private registrar(s: SolicitudServicio, usuario: Usuario, anterior: string, nuevo: string, descripcion: string) {
    return this.historialRepo.save(
      this.historialRepo.create({ solicitud: s, usuario, estadoAnterior: anterior, estadoNuevo: nuevo, descripcion }),
    );
  }
}

// "María López" → "María L."
function nombreCorto(nombre: string) {
  const partes = nombre.trim().split(/\s+/);
  return partes.length > 1 ? `${partes[0]} ${partes[1].charAt(0)}.` : nombre;
}
