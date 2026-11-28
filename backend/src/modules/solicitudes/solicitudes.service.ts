import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, LessThanOrEqual, Repository } from 'typeorm';
import { SolicitudServicio } from '../../entities/SolicitudServicio';
import { FotoSolicitud } from '../../entities/FotoSolicitud';
import { HistorialEstado } from '../../entities/HistorialEstado';
import { Categoria } from '../../entities/Categoria';
import { Zona } from '../../entities/Zona';
import { PerfilTrabajador } from '../../entities/PerfilTrabajador';
import { Usuario } from '../../entities/Usuario';
import { TransaccionPago } from '../../entities/TransaccionPago';
import { CrearSolicitudDto } from './dto/crear-solicitud.dto';
import { EstadoCuenta, EstadoSolicitud, RolUsuario, TipoPago } from '../../common/enums';
import { sanitizeHistorial, sanitizeSolicitud } from '../../common/serializers/entity-sanitizer';

// Resultado de evaluar si una solicitud se puede cancelar y qué pasaría con el anticipo (RN-12)
export interface ConsecuenciasCancelacion {
  puedeCancelar: boolean;
  razonBloqueo: string | null;
  estadoActual: EstadoSolicitud;
  horasAnticipacion: number | null;
  montoAnticipo: number;
  porcentajePenalizacion: number;
  montoPenalizacion: number;
  montoReembolso: number;
  consecuencias: string[];
}

// RN-12: con 24 horas o más de anticipación no hay penalización
const HORAS_MINIMAS_SIN_PENALIZACION = 24;

// Estados en los que ya no se permite cancelar y la explicación que se muestra
const RAZONES_BLOQUEO: Partial<Record<EstadoSolicitud, string>> = {
  [EstadoSolicitud.EN_PROCESO]:
    'El trabajador ya inició el servicio, por eso no se puede cancelar. Si hay un problema, usa "Reportar un problema".',
  [EstadoSolicitud.FINALIZADO]: 'El servicio ya finalizó, por eso no se puede cancelar.',
  [EstadoSolicitud.CANCELADO]: 'La solicitud ya fue cancelada.',
  [EstadoSolicitud.FUERA_DE_TIEMPO]:
    'La solicitud caducó automáticamente al cumplir 30 días sin concretarse (RN-08), por eso no se puede cancelar.',
};

function redondear(valor: number): number {
  return Math.round((valor + Number.EPSILON) * 100) / 100;
}

@Injectable()
export class SolicitudesService {
  constructor(
    @InjectRepository(SolicitudServicio)
    private readonly solicitudRepo: Repository<SolicitudServicio>,
    @InjectRepository(HistorialEstado)
    private readonly historialRepo: Repository<HistorialEstado>,
    @InjectRepository(Categoria)
    private readonly categoriaRepo: Repository<Categoria>,
    @InjectRepository(Zona)
    private readonly zonaRepo: Repository<Zona>,
    @InjectRepository(PerfilTrabajador)
    private readonly perfilRepo: Repository<PerfilTrabajador>,
    private readonly dataSource: DataSource,
  ) {}

  async crear(dto: CrearSolicitudDto, cliente: Usuario) {
    const categoria = await this.categoriaRepo.findOneBy({ idCategoria: dto.idCategoria });
    if (!categoria || !categoria.activa) {
      throw new NotFoundException('Categoría no encontrada o inactiva');
    }

    const zona = await this.zonaRepo.findOneBy({ idZona: dto.idZona });
    if (!zona || !zona.activa) {
      throw new NotFoundException('Zona no encontrada o inactiva');
    }

    let trabajador: PerfilTrabajador | null = null;
    if (dto.idTrabajador) {
      trabajador = await this.perfilRepo.findOne({
        where: { idPerfil: dto.idTrabajador },
        relations: ['usuario'],
      });
      if (!trabajador) {
        throw new NotFoundException(`Trabajador con ID ${dto.idTrabajador} no encontrado`);
      }
      if (trabajador.usuario.estadoCuenta !== EstadoCuenta.ACTIVO) {
        throw new BadRequestException('El trabajador seleccionado no se encuentra activo');
      }
    }

    const expiracion = new Date();
    expiracion.setDate(expiracion.getDate() + 30); // RN-08: Caducidad a los 30 días

    const guardada = await this.dataSource.transaction(async (manager) => {
      const solicitud = manager.create(SolicitudServicio, {
        cliente,
        trabajador: trabajador ?? undefined,
        categoria,
        zona,
        descripcion: dto.descripcion.trim(),
        direccionExacta: dto.direccionExacta.trim(),
        montoOfrecido: dto.montoOfrecido,
        estado: EstadoSolicitud.PENDIENTE,
        fechaExpiracion: expiracion,
        fechaInicioAgendada: dto.fechaInicioAgendada ? new Date(dto.fechaInicioAgendada) : undefined,
      });

      const saved = await manager.save(SolicitudServicio, solicitud);

      if (dto.fotosUrls && dto.fotosUrls.length > 0) {
        const fotos = dto.fotosUrls.map((url) =>
          manager.create(FotoSolicitud, { solicitud: saved, urlFoto: url }),
        );
        await manager.save(FotoSolicitud, fotos);
      }

      const historial = manager.create(HistorialEstado, {
        solicitud: saved,
        usuario: cliente,
        estadoAnterior: undefined,
        estadoNuevo: EstadoSolicitud.PENDIENTE,
        descripcion: 'Solicitud creada por el cliente',
      });
      await manager.save(HistorialEstado, historial);

      return saved;
    });

    return this.obtenerPorIdConPrivacidad(guardada.idSolicitud, cliente);
  }

  async misPedidos(usuario: Usuario, page: number = 1, limit: number = 10) {
    const skip = (page - 1) * limit;
    const qb = this.solicitudRepo
      .createQueryBuilder('solicitud')
      .leftJoinAndSelect('solicitud.cliente', 'cliente')
      .leftJoinAndSelect('solicitud.trabajador', 'trabajador')
      .leftJoinAndSelect('trabajador.usuario', 'trabajadorUsuario')
      .leftJoinAndSelect('solicitud.categoria', 'categoria')
      .leftJoinAndSelect('solicitud.zona', 'zona')
      .leftJoinAndSelect('solicitud.fotos', 'fotos')
      .orderBy('solicitud.fechaCreacion', 'DESC')
      .skip(skip)
      .take(limit);

    if (usuario.rol === RolUsuario.CLIENTE) {
      qb.where('cliente.idUsuario = :id', { id: usuario.idUsuario });
    } else if (usuario.rol === RolUsuario.TRABAJADOR) {
      qb.where('trabajadorUsuario.idUsuario = :id', { id: usuario.idUsuario });
    }

    const [items, total] = await qb.getManyAndCount();

    return {
      data: items.map((s) => sanitizeSolicitud(s, usuario)),
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  // CU-01, CU-09: Bandeja zonal para técnicos (solicitudes pendientes en sus zonas)
  async bandejaZonal(trabajadorUsuario: Usuario) {
    if (trabajadorUsuario.estadoCuenta !== EstadoCuenta.ACTIVO) {
      throw new ForbiddenException(
        `Su cuenta está en estado [${trabajadorUsuario.estadoCuenta}]. Solo técnicos activos pueden acceder a la bandeja zonal.`,
      );
    }

    const perfil = await this.perfilRepo.findOne({
      where: { usuario: { idUsuario: trabajadorUsuario.idUsuario } },
      relations: ['zonas', 'categorias'],
    });

    if (!perfil) throw new BadRequestException('No se encontró perfil de trabajador');

    const zonasIds = perfil.zonas.map((z) => z.idZona);
    const categoriasIds = perfil.categorias.map((c) => c.idCategoria);

    if (zonasIds.length === 0 || categoriasIds.length === 0) {
      return [];
    }

    const solicitudes = await this.solicitudRepo
      .createQueryBuilder('s')
      .leftJoinAndSelect('s.cliente', 'cliente')
      .leftJoinAndSelect('s.trabajador', 'trabajador')
      .leftJoinAndSelect('trabajador.usuario', 'trabajadorUsuario')
      .leftJoinAndSelect('s.categoria', 'categoria')
      .leftJoinAndSelect('s.zona', 'zona')
      .leftJoinAndSelect('s.fotos', 'fotos')
      .where('s.estado IN (:...estados)', {
        estados: [EstadoSolicitud.PENDIENTE, EstadoSolicitud.BAJO_REVISION],
      })
      .andWhere('s.zona.idZona IN (:...zonasIds)', { zonasIds })
      .andWhere('s.categoria.idCategoria IN (:...categoriasIds)', { categoriasIds })
      .andWhere('(s.trabajador IS NULL OR trabajador.idPerfil = :idPerfil)', {
        idPerfil: perfil.idPerfil,
      })
      .orderBy('s.fechaCreacion', 'DESC')
      .getMany();

    return solicitudes.map((s) => sanitizeSolicitud(s, trabajadorUsuario));
  }

  async obtenerPorIdConPrivacidad(id: number, usuario: Usuario) {
    const s = await this.solicitudRepo.findOne({
      where: { idSolicitud: id },
      relations: ['cliente', 'trabajador', 'trabajador.usuario', 'categoria', 'zona', 'fotos'],
    });
    if (!s) throw new NotFoundException(`Solicitud no encontrada con ID: ${id}`);

    const esClienteDueno = s.cliente?.idUsuario === usuario.idUsuario;
    const esTrabajadorAsignado = s.trabajador?.usuario?.idUsuario === usuario.idUsuario;
    const esAdmin = usuario.rol === RolUsuario.ADMIN;

    let esTrabajadorZonalElegible = false;
    if (
      !esClienteDueno &&
      !esTrabajadorAsignado &&
      !esAdmin &&
      usuario.rol === RolUsuario.TRABAJADOR &&
      usuario.estadoCuenta === EstadoCuenta.ACTIVO &&
      (s.estado === EstadoSolicitud.PENDIENTE || s.estado === EstadoSolicitud.BAJO_REVISION) &&
      !s.trabajador
    ) {
      const perfil = await this.perfilRepo.findOne({
        where: { usuario: { idUsuario: usuario.idUsuario } },
        relations: ['zonas', 'categorias'],
      });
      if (perfil) {
        const cubreZona = perfil.zonas.some((z) => z.idZona === s.zona?.idZona);
        const cubreCat = perfil.categorias.some((c) => c.idCategoria === s.categoria?.idCategoria);
        esTrabajadorZonalElegible = cubreZona && cubreCat;
      }
    }

    if (!esClienteDueno && !esTrabajadorAsignado && !esAdmin && !esTrabajadorZonalElegible) {
      throw new ForbiddenException('No tiene permisos para acceder a esta solicitud');
    }

    return sanitizeSolicitud(s, usuario);
  }

  private buscarAnticipo(idSolicitud: number, manager: EntityManager) {
    return manager.findOne(TransaccionPago, {
      where: { solicitud: { idSolicitud }, tipo: TipoPago.ANTICIPO_25 },
    });
  }

  // RN-12: calcula qué pasaría si la solicitud se cancela en este momento (no modifica nada)
  private async calcularConsecuencias(
    solicitud: SolicitudServicio,
    manager: EntityManager,
  ): Promise<ConsecuenciasCancelacion> {
    const anticipo = await this.buscarAnticipo(solicitud.idSolicitud, manager);
    const montoAnticipo = anticipo ? redondear(Number(anticipo.monto)) : 0;
    const inicio = solicitud.fechaInicioAgendada ? new Date(solicitud.fechaInicioAgendada) : null;
    const horasAnticipacion = inicio ? redondear((inicio.getTime() - Date.now()) / 3_600_000) : null;

    const razonBloqueo = RAZONES_BLOQUEO[solicitud.estado];
    if (razonBloqueo) {
      return {
        puedeCancelar: false,
        razonBloqueo,
        estadoActual: solicitud.estado,
        horasAnticipacion,
        montoAnticipo,
        porcentajePenalizacion: 0,
        montoPenalizacion: 0,
        montoReembolso: 0,
        consecuencias: [],
      };
    }

    // PENDIENTE, BAJO_REVISION o APROBADO
    const consecuencias = ['La solicitud pasará a estado Cancelado. Esta acción no se puede deshacer.'];
    let porcentajePenalizacion = 0;

    if (solicitud.estado === EstadoSolicitud.APROBADO) {
      consecuencias.push('El trabajador asignado ya no realizará el servicio.');
      if (!anticipo) {
        consecuencias.push('No se pagó anticipo, así que no hay penalización.');
      } else if (horasAnticipacion === null) {
        consecuencias.push(
          `El servicio no tiene fecha agendada: no hay penalización y se reembolsa al cliente el anticipo completo (Bs ${montoAnticipo}).`,
        );
      } else if (horasAnticipacion >= HORAS_MINIMAS_SIN_PENALIZACION) {
        consecuencias.push(
          `Se cancela con ${horasAnticipacion} h de anticipación (24 h o más): no hay penalización y se reembolsa al cliente el anticipo completo (Bs ${montoAnticipo}).`,
        );
      } else {
        porcentajePenalizacion = 100;
        consecuencias.push(
          horasAnticipacion < 0
            ? 'La fecha agendada del servicio ya pasó.'
            : `Faltan solo ${horasAnticipacion} h para el servicio (menos de 24 h).`,
          `Se aplica una penalización del 100% del anticipo (Bs ${montoAnticipo}), que se entrega al trabajador. No hay reembolso.`,
        );
      }
    } else {
      consecuencias.push(
        'Los trabajadores dejarán de ver este pedido y no podrán enviar más cotizaciones.',
        'No hay penalización porque todavía no se aprobó ninguna cotización.',
      );
    }

    const montoPenalizacion = redondear((montoAnticipo * porcentajePenalizacion) / 100);
    return {
      puedeCancelar: true,
      razonBloqueo: null,
      estadoActual: solicitud.estado,
      horasAnticipacion,
      montoAnticipo,
      porcentajePenalizacion,
      montoPenalizacion,
      montoReembolso: redondear(montoAnticipo - montoPenalizacion),
      consecuencias,
    };
  }

  private validarClienteDuenoOAdmin(s: SolicitudServicio, usuario: Usuario) {
    if (s.cliente?.idUsuario !== usuario.idUsuario && usuario.rol !== RolUsuario.ADMIN) {
      throw new ForbiddenException(
        'Solo el cliente que creó la solicitud (o un administrador) puede cancelarla',
      );
    }
  }

  // CU-10: Muestra lo que pasaría al cancelar, sin modificar nada
  async previsualizarCancelacion(id: number, usuario: Usuario) {
    const manager = this.dataSource.manager;
    const s = await manager.findOne(SolicitudServicio, {
      where: { idSolicitud: id },
      relations: ['cliente'],
    });
    if (!s) throw new NotFoundException(`Solicitud no encontrada con ID: ${id}`);

    this.validarClienteDuenoOAdmin(s, usuario);

    return { idSolicitud: s.idSolicitud, ...(await this.calcularConsecuencias(s, manager)) };
  }

  // CU-10: Cancelar solicitud por el cliente (RN-03, RN-12)
  async cancelar(id: number, motivo: string, usuario: Usuario) {
    const resultado = await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder(SolicitudServicio, 's')
        .select('s.idSolicitud')
        .where('s.idSolicitud = :id', { id })
        .setLock('pessimistic_write')
        .getOne();

      const s = await manager.findOne(SolicitudServicio, {
        where: { idSolicitud: id },
        relations: ['cliente', 'trabajador', 'trabajador.usuario', 'categoria', 'zona', 'fotos'],
      });

      if (!s) throw new NotFoundException(`Solicitud no encontrada con ID: ${id}`);

      if (s.cliente.idUsuario !== usuario.idUsuario && usuario.rol !== RolUsuario.ADMIN) {
        throw new ForbiddenException('Solo el cliente que creó la solicitud puede cancelarla');
      }

      if (
        s.estado !== EstadoSolicitud.PENDIENTE &&
        s.estado !== EstadoSolicitud.BAJO_REVISION &&
        s.estado !== EstadoSolicitud.APROBADO
      ) {
        throw new BadRequestException(
          `No se puede cancelar una solicitud en estado ${s.estado}.`,
        );
      }

      const estadoAnterior = s.estado;
      s.estado = EstadoSolicitud.CANCELADO;
      await manager.save(SolicitudServicio, s);

      // RN-12: Si estaba en APROBADO con anticipo retenido
      let detalleCompensacion = '';
      if (estadoAnterior === EstadoSolicitud.APROBADO) {
        const anticipo = await manager.findOne(TransaccionPago, {
          where: { solicitud: { idSolicitud: s.idSolicitud }, tipo: TipoPago.ANTICIPO_25 },
        });

        if (anticipo) {
          const ahora = new Date();
          const inicioAgendado = s.fechaInicioAgendada ? new Date(s.fechaInicioAgendada) : null;

          if (inicioAgendado) {
            const diffMs = inicioAgendado.getTime() - ahora.getTime();
            const horasAnticipacion = diffMs / (1000 * 60 * 60);

            if (horasAnticipacion >= 24) {
              anticipo.liberadoAlTrabajador = false;
              detalleCompensacion =
                ' (Cancelado con >= 24h de anticipación: anticipo 25% reembolsable al cliente)';
            } else {
              anticipo.liberadoAlTrabajador = true;
              detalleCompensacion =
                ' (Cancelado con < 24h de anticipación: anticipo 25% liberado al trabajador)';
            }
          } else {
            // Sin horario fijo agendado, se mantiene retenido para reembolso al cliente
            anticipo.liberadoAlTrabajador = false;
            detalleCompensacion = ' (Anticipo 25% marcado para reembolso al cliente)';
          }
          await manager.save(TransaccionPago, anticipo);
        }
      }

      const motivoLimpio = (motivo || 'Cancelación solicitada por el cliente').slice(0, 150);
      const historial = manager.create(HistorialEstado, {
        solicitud: s,
        usuario,
        estadoAnterior,
        estadoNuevo: EstadoSolicitud.CANCELADO,
        descripcion: `${motivoLimpio}${detalleCompensacion}`.slice(0, 255),
      });
      await manager.save(HistorialEstado, historial);

      return { s, detalleCompensacion };
    });

    return {
      mensaje: `Solicitud #${id} cancelada exitosamente${resultado.detalleCompensacion}`,
      solicitud: sanitizeSolicitud(resultado.s, usuario),
    };
  }

  // CU-11, RN-08: Expirar solicitudes con más de 30 días sin concretarse
  async expirarSolicitudesVencidas() {
    const ahora = new Date();

    return this.dataSource.transaction(async (manager) => {
      const vencidas = await manager.find(SolicitudServicio, {
        where: {
          estado: EstadoSolicitud.PENDIENTE,
          fechaExpiracion: LessThanOrEqual(ahora),
        },
      });

      for (const s of vencidas) {
        s.estado = EstadoSolicitud.FUERA_DE_TIEMPO;
        await manager.save(SolicitudServicio, s);

        const historial = manager.create(HistorialEstado, {
          solicitud: s,
          estadoAnterior: EstadoSolicitud.PENDIENTE,
          estadoNuevo: EstadoSolicitud.FUERA_DE_TIEMPO,
          descripcion: 'Caducidad automática por alcanzar los 30 días calendario (RN-08)',
        });
        await manager.save(HistorialEstado, historial);
      }

      return {
        totalExpiradas: vencidas.length,
        solicitudesIds: vencidas.map((s) => s.idSolicitud),
      };
    });
  }

  // CU-12: Consultar historial de trazabilidad (Línea de tiempo inalterable)
  async consultarHistorial(idSolicitud: number, usuario: Usuario) {
    const s = await this.solicitudRepo.findOne({
      where: { idSolicitud },
      relations: ['cliente', 'trabajador', 'trabajador.usuario'],
    });

    if (!s) throw new NotFoundException(`Solicitud #${idSolicitud} no encontrada`);

    const esCliente = s.cliente?.idUsuario === usuario.idUsuario;
    const esTrabajador = s.trabajador?.usuario?.idUsuario === usuario.idUsuario;
    const esAdmin = usuario.rol === RolUsuario.ADMIN;

    if (!esCliente && !esTrabajador && !esAdmin) {
      throw new ForbiddenException('No tiene permisos para ver el historial de este pedido');
    }

    const eventos = await this.historialRepo.find({
      where: { solicitud: { idSolicitud } },
      order: { fechaHora: 'ASC' },
      relations: ['usuario', 'solicitud'],
    });

    return eventos.map((e) => sanitizeHistorial(e));
  }
}
