import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Not, Repository } from 'typeorm';
import { Cotizacion } from '../../entities/Cotizacion';
import { SolicitudServicio } from '../../entities/SolicitudServicio';
import { PerfilTrabajador } from '../../entities/PerfilTrabajador';
import { HistorialEstado } from '../../entities/HistorialEstado';
import { TransaccionPago } from '../../entities/TransaccionPago';
import { Usuario } from '../../entities/Usuario';
import { CrearCotizacionDto } from './dto/crear-cotizacion.dto';
import { ResponderCotizacionBodyDto } from './dto/responder-cotizacion-body.dto';
import {
  EstadoCotizacion,
  EstadoSolicitud,
  EstadoCuenta,
  TipoPago,
  RolUsuario,
} from '../../common/enums';
import { sanitizeCotizacion } from '../../common/serializers/entity-sanitizer';

@Injectable()
export class CotizacionesService {
  constructor(
    @InjectRepository(Cotizacion)
    private readonly cotizacionRepo: Repository<Cotizacion>,
    @InjectRepository(SolicitudServicio)
    private readonly solicitudRepo: Repository<SolicitudServicio>,
    @InjectRepository(PerfilTrabajador)
    private readonly perfilRepo: Repository<PerfilTrabajador>,
    private readonly dataSource: DataSource,
  ) {}

  private async verificarSolapamientoAgenda(
    idPerfil: number,
    margenErrorMin: number,
    idSolicitudActual: number,
    inicio: Date,
    duracionMin: number,
  ) {
    const fin = new Date(inicio.getTime() + duracionMin * 60000);
    const finConMargen = new Date(fin.getTime() + (margenErrorMin || 0) * 60000);

    const colisiones = await this.solicitudRepo
      .createQueryBuilder('s')
      .where('s.trabajador.idPerfil = :idPerfil', { idPerfil })
      .andWhere('s.idSolicitud != :solicitudActual', { solicitudActual: idSolicitudActual })
      .andWhere('s.estado IN (:...estadosOcupados)', {
        estadosOcupados: [EstadoSolicitud.APROBADO, EstadoSolicitud.EN_PROCESO],
      })
      .andWhere('s.fechaInicioAgendada IS NOT NULL AND s.fechaFinEstimada IS NOT NULL')
      .andWhere('s.fechaInicioAgendada < :finConMargen AND s.fechaFinEstimada > :inicio', {
        inicio,
        finConMargen,
      })
      .getMany();

    if (colisiones.length > 0) {
      throw new BadRequestException(
        `Conflicto de agenda: El horario propuesto se solapa con otro servicio asignado considerando su margen de error (${margenErrorMin} min).`,
      );
    }

    return fin;
  }

  async crear(dto: CrearCotizacionDto, usuario: Usuario) {
    const trabajador = await this.perfilRepo.findOne({
      where: { usuario: { idUsuario: usuario.idUsuario } },
      relations: ['usuario', 'zonas', 'categorias'],
    });

    if (!trabajador) {
      throw new BadRequestException('Solo los trabajadores registrados pueden cotizar');
    }

    // RN-01, RN-02: Solo trabajadores con cuenta ACTIVA pueden emitir cotizaciones
    if (trabajador.usuario.estadoCuenta !== EstadoCuenta.ACTIVO) {
      throw new ForbiddenException(
        `Su cuenta se encuentra en estado [${trabajador.usuario.estadoCuenta}]. Solo trabajadores activos pueden cotizar.`,
      );
    }

    const solicitud = await this.solicitudRepo.findOne({
      where: { idSolicitud: dto.idSolicitud },
      relations: ['trabajador', 'cliente', 'zona', 'categoria'],
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    const esRecotizacion = dto.esRecotizacion || false;

    if (!esRecotizacion) {
      if (
        solicitud.estado !== EstadoSolicitud.PENDIENTE &&
        solicitud.estado !== EstadoSolicitud.BAJO_REVISION
      ) {
        throw new BadRequestException(
          `No se pueden enviar nuevas cotizaciones para una solicitud en estado ${solicitud.estado}`,
        );
      }

      // Si la solicitud fue dirigida a un trabajador específico, solo ese trabajador puede cotizarla
      if (solicitud.trabajador && solicitud.trabajador.idPerfil !== trabajador.idPerfil) {
        throw new ForbiddenException('Esta solicitud fue dirigida a otro trabajador específico');
      }

      // Validar que el trabajador atienda la categoría y zona de la solicitud
      const cubreCat = trabajador.categorias.some(
        (c) => c.idCategoria === solicitud.categoria?.idCategoria,
      );
      const cubreZona = trabajador.zonas.some((z) => z.idZona === solicitud.zona?.idZona);
      if (!cubreCat || !cubreZona) {
        throw new ForbiddenException(
          'Solo puede cotizar solicitudes dentro de sus especialidades y zonas habilitadas',
        );
      }
    } else {
      // RN-05, CU-02: Re-cotización en sitio por imprevistos
      if (
        solicitud.estado !== EstadoSolicitud.APROBADO &&
        solicitud.estado !== EstadoSolicitud.EN_PROCESO
      ) {
        throw new BadRequestException(
          'Solo se puede re-cotizar un servicio que ya se encuentre aprobado o en proceso',
        );
      }

      if (solicitud.trabajador?.idPerfil !== trabajador.idPerfil) {
        throw new ForbiddenException(
          'Solo el trabajador asignado al servicio puede emitir una re-cotización',
        );
      }
    }

    // HU-F05, RN-10, RF-04: Validación de agenda con margen de error (buffer)
    let fechaInicioPropuesta: Date | null = null;
    let fechaFinPropuesta: Date | null = null;

    if (dto.fechaInicioAgendada && dto.duracionEstimadaMinutos) {
      fechaInicioPropuesta = new Date(dto.fechaInicioAgendada);
      fechaFinPropuesta = await this.verificarSolapamientoAgenda(
        trabajador.idPerfil,
        trabajador.margenErrorMin || 0,
        solicitud.idSolicitud,
        fechaInicioPropuesta,
        dto.duracionEstimadaMinutos,
      );
    }

    const guardada = await this.dataSource.transaction(async (manager) => {
      const cotizacion = manager.create(Cotizacion, {
        solicitud,
        trabajador,
        requiereVisita: dto.requiereVisita || false,
        costoVisita: dto.costoVisita || 0,
        montoTotalPropuesto: dto.montoTotalPropuesto,
        incluyeMateriales: dto.incluyeMateriales || false,
        esRecotizacion,
        estadoAprobacion: EstadoCotizacion.PENDIENTE,
      });

      const savedQuote = await manager.save(Cotizacion, cotizacion);

      // Persistir fecha propuesta si la solicitud aún no tenía horario fijado (RN-10)
      let cambioSolicitud = false;
      if (fechaInicioPropuesta && fechaFinPropuesta && !solicitud.fechaInicioAgendada) {
        solicitud.fechaInicioAgendada = fechaInicioPropuesta;
        solicitud.fechaFinEstimada = fechaFinPropuesta;
        cambioSolicitud = true;
      }

      if (!esRecotizacion && solicitud.estado === EstadoSolicitud.PENDIENTE) {
        solicitud.estado = EstadoSolicitud.BAJO_REVISION;
        cambioSolicitud = true;

        const historial = manager.create(HistorialEstado, {
          solicitud,
          usuario,
          estadoAnterior: EstadoSolicitud.PENDIENTE,
          estadoNuevo: EstadoSolicitud.BAJO_REVISION,
          descripcion: `Cotización #${savedQuote.idCotizacion} recibida de ${usuario.nombreCompleto}`,
        });
        await manager.save(HistorialEstado, historial);
      }

      if (cambioSolicitud) {
        await manager.save(SolicitudServicio, solicitud);
      }

      return savedQuote;
    });

    const completa = await this.cotizacionRepo.findOne({
      where: { idCotizacion: guardada.idCotizacion },
      relations: ['solicitud', 'trabajador', 'trabajador.usuario', 'trabajador.categorias', 'trabajador.zonas'],
    });

    return sanitizeCotizacion(completa!);
  }

  async listarPorSolicitud(idSolicitud: number, usuario: Usuario) {
    const solicitud = await this.solicitudRepo.findOne({
      where: { idSolicitud },
      relations: ['cliente', 'trabajador', 'trabajador.usuario'],
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud #${idSolicitud} no encontrada`);
    }

    const esClienteDueno = solicitud.cliente?.idUsuario === usuario.idUsuario;
    const esAdmin = usuario.rol === RolUsuario.ADMIN;

    if (esClienteDueno || esAdmin) {
      const lista = await this.cotizacionRepo.find({
        where: { solicitud: { idSolicitud } },
        relations: ['solicitud', 'trabajador', 'trabajador.usuario', 'trabajador.categorias', 'trabajador.zonas'],
        order: { idCotizacion: 'DESC' },
      });
      return lista.map((c) => sanitizeCotizacion(c));
    }

    if (usuario.rol === RolUsuario.TRABAJADOR) {
      // Un técnico solo puede ver sus propias cotizaciones en esa solicitud (no las de competidores)
      const propias = await this.cotizacionRepo.find({
        where: {
          solicitud: { idSolicitud },
          trabajador: { usuario: { idUsuario: usuario.idUsuario } },
        },
        relations: ['solicitud', 'trabajador', 'trabajador.usuario', 'trabajador.categorias', 'trabajador.zonas'],
        order: { idCotizacion: 'DESC' },
      });
      return propias.map((c) => sanitizeCotizacion(c));
    }

    throw new ForbiddenException('No tiene permisos para ver las cotizaciones de esta solicitud');
  }

  // CU-01, CU-02, RN-04, RN-05: Responder a una cotización o re-cotización
  async responderCotizacion(
    idCotizacion: number,
    nuevoEstado: EstadoCotizacion,
    cliente: Usuario,
    body?: ResponderCotizacionBodyDto,
  ) {
    if (
      nuevoEstado !== EstadoCotizacion.ACEPTADA &&
      nuevoEstado !== EstadoCotizacion.RECHAZADA
    ) {
      throw new BadRequestException('La respuesta debe ser ACEPTADA o RECHAZADA');
    }

    const resultado = await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder(Cotizacion, 'c')
        .select('c.idCotizacion')
        .where('c.idCotizacion = :idCotizacion', { idCotizacion })
        .setLock('pessimistic_write')
        .getOne();

      const cotizacion = await manager.findOne(Cotizacion, {
        where: { idCotizacion },
        relations: [
          'solicitud',
          'solicitud.cliente',
          'trabajador',
          'trabajador.usuario',
          'trabajador.categorias',
          'trabajador.zonas',
        ],
      });

      if (!cotizacion) {
        throw new NotFoundException('Cotización no encontrada');
      }

      if (cotizacion.solicitud.cliente.idUsuario !== cliente.idUsuario) {
        throw new ForbiddenException(
          'Solo el cliente dueño de la solicitud puede aceptar o rechazar cotizaciones',
        );
      }

      if (cotizacion.estadoAprobacion !== EstadoCotizacion.PENDIENTE) {
        throw new BadRequestException(
          `Esta cotización ya fue procesada previamente (estado: ${cotizacion.estadoAprobacion})`,
        );
      }

      await manager
        .createQueryBuilder(SolicitudServicio, 's')
        .select('s.idSolicitud')
        .where('s.idSolicitud = :id', { id: cotizacion.solicitud.idSolicitud })
        .setLock('pessimistic_write')
        .getOne();

      const solicitud = await manager.findOne(SolicitudServicio, {
        where: { idSolicitud: cotizacion.solicitud.idSolicitud },
        relations: ['cliente', 'trabajador', 'trabajador.usuario'],
      });

      if (!solicitud) {
        throw new NotFoundException('Solicitud asociada no encontrada');
      }

      const estadoAnterior = solicitud.estado;

      if (cotizacion.esRecotizacion) {
        if (
          solicitud.estado !== EstadoSolicitud.APROBADO &&
          solicitud.estado !== EstadoSolicitud.EN_PROCESO
        ) {
          throw new BadRequestException(
            `No se puede responder una re-cotización cuando la solicitud está en estado ${solicitud.estado}`,
          );
        }

        cotizacion.estadoAprobacion = nuevoEstado;
        await manager.save(Cotizacion, cotizacion);

        if (nuevoEstado === EstadoCotizacion.ACEPTADA) {
          solicitud.estado = EstadoSolicitud.EN_PROCESO;
          solicitud.montoOfrecido = cotizacion.montoTotalPropuesto;
          await manager.save(SolicitudServicio, solicitud);

          const historial = manager.create(HistorialEstado, {
            solicitud,
            usuario: cliente,
            estadoAnterior,
            estadoNuevo: EstadoSolicitud.EN_PROCESO,
            descripcion: `Re-cotización #${cotizacion.idCotizacion} aprobada en sitio. Nuevo monto: ${cotizacion.montoTotalPropuesto} Bs.`,
          });
          await manager.save(HistorialEstado, historial);
        } else {
          // RN-05: Rechazar re-cotización cancela servicio y libera anticipo del 25% al trabajador
          solicitud.estado = EstadoSolicitud.CANCELADO;
          await manager.save(SolicitudServicio, solicitud);

          const anticipo = await manager.findOne(TransaccionPago, {
            where: { solicitud: { idSolicitud: solicitud.idSolicitud }, tipo: TipoPago.ANTICIPO_25 },
          });

          if (anticipo) {
            anticipo.liberadoAlTrabajador = true;
            await manager.save(TransaccionPago, anticipo);
          }

          const historial = manager.create(HistorialEstado, {
            solicitud,
            usuario: cliente,
            estadoAnterior,
            estadoNuevo: EstadoSolicitud.CANCELADO,
            descripcion:
              'Re-cotización rechazada por el cliente. Servicio cancelado y anticipo 25% liberado al trabajador (RN-05).',
          });
          await manager.save(HistorialEstado, historial);
        }
      } else {
        // Cotización inicial (CU-01)
        if (
          solicitud.estado !== EstadoSolicitud.PENDIENTE &&
          solicitud.estado !== EstadoSolicitud.BAJO_REVISION
        ) {
          throw new BadRequestException(
            `La solicitud ya no admite respuestas a cotizaciones iniciales (estado actual: ${solicitud.estado})`,
          );
        }

        if (nuevoEstado === EstadoCotizacion.ACEPTADA) {
          // Validar conflicto de agenda si se confirma fecha al aceptar (RN-10)
          if (body?.fechaInicioAgendada && body?.duracionEstimadaMinutos) {
            const inicio = new Date(body.fechaInicioAgendada);
            const fin = await this.verificarSolapamientoAgenda(
              cotizacion.trabajador.idPerfil,
              cotizacion.trabajador.margenErrorMin || 0,
              solicitud.idSolicitud,
              inicio,
              body.duracionEstimadaMinutos,
            );
            solicitud.fechaInicioAgendada = inicio;
            solicitud.fechaFinEstimada = fin;
          } else if (solicitud.fechaInicioAgendada && !solicitud.fechaFinEstimada) {
            // Si el cliente propuso fecha de inicio sin fin estimado, fijar ventana estándar de 2h para control RN-10
            solicitud.fechaFinEstimada = new Date(
              new Date(solicitud.fechaInicioAgendada).getTime() + 120 * 60000,
            );
          }

          cotizacion.estadoAprobacion = EstadoCotizacion.ACEPTADA;
          await manager.save(Cotizacion, cotizacion);

          // Rechazar automáticamente las demás cotizaciones pendientes de la misma solicitud
          await manager.update(
            Cotizacion,
            {
              solicitud: { idSolicitud: solicitud.idSolicitud },
              idCotizacion: Not(cotizacion.idCotizacion),
              estadoAprobacion: EstadoCotizacion.PENDIENTE,
            },
            { estadoAprobacion: EstadoCotizacion.RECHAZADA },
          );

          solicitud.estado = EstadoSolicitud.APROBADO;
          solicitud.trabajador = cotizacion.trabajador;
          solicitud.montoOfrecido = cotizacion.montoTotalPropuesto;
          await manager.save(SolicitudServicio, solicitud);

          const historial = manager.create(HistorialEstado, {
            solicitud,
            usuario: cliente,
            estadoAnterior,
            estadoNuevo: EstadoSolicitud.APROBADO,
            descripcion: `Cotización #${cotizacion.idCotizacion} aceptada. Pendiente de pago de anticipo del 25% (RN-04).`,
          });
          await manager.save(HistorialEstado, historial);
        } else {
          cotizacion.estadoAprobacion = EstadoCotizacion.RECHAZADA;
          await manager.save(Cotizacion, cotizacion);
        }
      }

      return { cotizacion, estadoActual: solicitud.estado };
    });

    return {
      mensaje: `Cotización #${idCotizacion} marcada como ${nuevoEstado}`,
      cotizacion: sanitizeCotizacion(resultado.cotizacion),
      estadoSolicitudActual: resultado.estadoActual,
    };
  }
}
