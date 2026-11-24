import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { TransaccionPago } from '../../entities/TransaccionPago';
import { SolicitudServicio } from '../../entities/SolicitudServicio';
import { HistorialEstado } from '../../entities/HistorialEstado';
import { Usuario } from '../../entities/Usuario';
import { RegistrarPagoDto } from './dto/registrar-pago.dto';
import { TipoPago, EstadoSolicitud, RolUsuario } from '../../common/enums';
import { sanitizePago } from '../../common/serializers/entity-sanitizer';

@Injectable()
export class PagosService {
  constructor(
    @InjectRepository(TransaccionPago)
    private readonly pagoRepo: Repository<TransaccionPago>,
    @InjectRepository(SolicitudServicio)
    private readonly solicitudRepo: Repository<SolicitudServicio>,
    private readonly dataSource: DataSource,
  ) {}

  // CU-01, CU-03, RN-04, RF-06: Registrar pago (Anticipo 25% o Saldo 75%)
  async registrarPago(dto: RegistrarPagoDto, cliente: Usuario) {
    const guardado = await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder(SolicitudServicio, 's')
        .select('s.idSolicitud')
        .where('s.idSolicitud = :id', { id: dto.idSolicitud })
        .setLock('pessimistic_write')
        .getOne();

      const solicitud = await manager.findOne(SolicitudServicio, {
        where: { idSolicitud: dto.idSolicitud },
        relations: ['cliente', 'trabajador', 'trabajador.usuario'],
      });

      if (!solicitud) {
        throw new NotFoundException('Solicitud no encontrada');
      }

      if (solicitud.cliente.idUsuario !== cliente.idUsuario && cliente.rol !== RolUsuario.ADMIN) {
        throw new ForbiddenException('Solo el cliente titular de la solicitud puede registrar pagos');
      }

      const montoTotalServicio = Number(solicitud.montoOfrecido || 0);
      if (montoTotalServicio <= 0) {
        throw new BadRequestException(
          'La solicitud no tiene un monto acordado válido para procesar pagos',
        );
      }

      if (dto.tipo === TipoPago.ANTICIPO_25) {
        if (solicitud.estado !== EstadoSolicitud.APROBADO) {
          throw new BadRequestException(
            `Para abonar el anticipo del 25%, la solicitud debe estar en estado APROBADO (actual: ${solicitud.estado})`,
          );
        }

        const anticipoEsperado = Number((montoTotalServicio * 0.25).toFixed(2));
        if (Math.abs(dto.monto - anticipoEsperado) > 0.05) {
          throw new BadRequestException(
            `El monto del anticipo debe corresponder al 25% del servicio (${anticipoEsperado} Bs). Recibido: ${dto.monto} Bs.`,
          );
        }

        const anticipoExistente = await manager.findOne(TransaccionPago, {
          where: { solicitud: { idSolicitud: solicitud.idSolicitud }, tipo: TipoPago.ANTICIPO_25 },
        });

        if (anticipoExistente) {
          throw new BadRequestException(
            'El anticipo del 25% ya fue registrado previamente para este servicio',
          );
        }

        const pago = manager.create(TransaccionPago, {
          solicitud,
          tipo: TipoPago.ANTICIPO_25,
          medioPago: dto.medioPago,
          monto: anticipoEsperado,
          urlComprobante: dto.urlComprobante,
          conformidadCliente: true,
          confirmadoPorTrabajador: true, // Anticipo retenido por la app
          liberadoAlTrabajador: false, // Retenido en custodia hasta finalizar (RN-04)
        });

        const savedPago = await manager.save(TransaccionPago, pago);

        solicitud.estado = EstadoSolicitud.EN_PROCESO;
        await manager.save(SolicitudServicio, solicitud);

        const historial = manager.create(HistorialEstado, {
          solicitud,
          usuario: cliente,
          estadoAnterior: EstadoSolicitud.APROBADO,
          estadoNuevo: EstadoSolicitud.EN_PROCESO,
          descripcion: `Anticipo del 25% (${anticipoEsperado} Bs) abonado y en custodia. Servicio pasa a EN_PROCESO.`,
        });
        await manager.save(HistorialEstado, historial);

        return savedPago;
      } else {
        // TipoPago.SALDO_75
        if (solicitud.estado !== EstadoSolicitud.EN_PROCESO) {
          throw new BadRequestException(
            `Para abonar el saldo restante, el servicio debe encontrarse EN_PROCESO (actual: ${solicitud.estado})`,
          );
        }

        const anticipoPrevio = await manager.findOne(TransaccionPago, {
          where: { solicitud: { idSolicitud: solicitud.idSolicitud }, tipo: TipoPago.ANTICIPO_25 },
        });

        if (!anticipoPrevio) {
          throw new BadRequestException(
            'No se puede pagar el saldo sin haber registrado previamente el anticipo del 25%',
          );
        }

        const saldoExistente = await manager.findOne(TransaccionPago, {
          where: { solicitud: { idSolicitud: solicitud.idSolicitud }, tipo: TipoPago.SALDO_75 },
        });

        if (saldoExistente) {
          throw new BadRequestException('El saldo restante ya fue registrado previamente');
        }

        const saldoEsperado = Number((montoTotalServicio - Number(anticipoPrevio.monto)).toFixed(2));
        if (saldoEsperado <= 0 || Math.abs(dto.monto - saldoEsperado) > 0.05) {
          throw new BadRequestException(
            `El monto del saldo debe corresponder al restante pendiente (${saldoEsperado} Bs). Recibido: ${dto.monto} Bs.`,
          );
        }

        const pago = manager.create(TransaccionPago, {
          solicitud,
          tipo: TipoPago.SALDO_75,
          medioPago: dto.medioPago,
          monto: saldoEsperado,
          urlComprobante: dto.urlComprobante,
          conformidadCliente: true,
          confirmadoPorTrabajador: false, // Requiere confirmación explícita del técnico (RF-06)
          liberadoAlTrabajador: false,
        });

        const savedPago = await manager.save(TransaccionPago, pago);

        const historial = manager.create(HistorialEstado, {
          solicitud,
          usuario: cliente,
          estadoAnterior: EstadoSolicitud.EN_PROCESO,
          estadoNuevo: EstadoSolicitud.EN_PROCESO,
          descripcion: `Saldo (${saldoEsperado} Bs) registrado por el cliente mediante ${dto.medioPago}. Pendiente de confirmación del técnico.`,
        });
        await manager.save(HistorialEstado, historial);

        return savedPago;
      }
    });

    return sanitizePago(guardado);
  }

  async listarPorSolicitud(idSolicitud: number, usuario: Usuario) {
    const solicitud = await this.solicitudRepo.findOne({
      where: { idSolicitud },
      relations: ['cliente', 'trabajador', 'trabajador.usuario'],
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud #${idSolicitud} no encontrada`);
    }

    const esCliente = solicitud.cliente?.idUsuario === usuario.idUsuario;
    const esTrabajador = solicitud.trabajador?.usuario?.idUsuario === usuario.idUsuario;
    const esAdmin = usuario.rol === RolUsuario.ADMIN;

    if (!esCliente && !esTrabajador && !esAdmin) {
      throw new ForbiddenException('No tiene permisos para ver los pagos de esta solicitud');
    }

    const pagos = await this.pagoRepo.find({
      where: { solicitud: { idSolicitud } },
      relations: ['solicitud'],
      order: { idPago: 'ASC' },
    });

    return pagos.map((p) => sanitizePago(p));
  }

  // CU-03, RN-04, RF-06: Confirmación del saldo por el técnico (Doble firma)
  async confirmarPorTrabajador(idPago: number, trabajadorUsuario: Usuario) {
    const resultado = await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder(TransaccionPago, 'p')
        .select('p.idPago')
        .where('p.idPago = :idPago', { idPago })
        .setLock('pessimistic_write')
        .getOne();

      const pago = await manager.findOne(TransaccionPago, {
        where: { idPago },
        relations: [
          'solicitud',
          'solicitud.cliente',
          'solicitud.trabajador',
          'solicitud.trabajador.usuario',
        ],
      });

      if (!pago) {
        throw new NotFoundException('Transacción de pago no encontrada');
      }

      const solicitud = pago.solicitud;
      const esTrabajadorAsignado =
        solicitud.trabajador?.usuario?.idUsuario === trabajadorUsuario.idUsuario;
      const esAdmin = trabajadorUsuario.rol === RolUsuario.ADMIN;

      if (!esTrabajadorAsignado && !esAdmin) {
        throw new ForbiddenException(
          'Solo el técnico asignado a este servicio puede confirmar la recepción del pago',
        );
      }

      if (pago.tipo !== TipoPago.SALDO_75) {
        throw new BadRequestException(
          'Solo el pago de saldo (SALDO_75) requiere confirmación de doble firma para finalizar y liberar el anticipo',
        );
      }

      if (pago.confirmadoPorTrabajador) {
        throw new BadRequestException('Este pago ya fue confirmado anteriormente');
      }

      if (solicitud.estado !== EstadoSolicitud.EN_PROCESO) {
        throw new BadRequestException(
          `Solo se puede confirmar un servicio en estado EN_PROCESO (actual: ${solicitud.estado})`,
        );
      }

      pago.confirmadoPorTrabajador = true;
      pago.liberadoAlTrabajador = true;
      await manager.save(TransaccionPago, pago);

      solicitud.estado = EstadoSolicitud.FINALIZADO;
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
        usuario: trabajadorUsuario,
        estadoAnterior: EstadoSolicitud.EN_PROCESO,
        estadoNuevo: EstadoSolicitud.FINALIZADO,
        descripcion:
          'Doble conformidad registrada: El trabajador confirmó la recepción del saldo. Servicio FINALIZADO y anticipo del 25% liberado (RN-04, CU-03).',
      });
      await manager.save(HistorialEstado, historial);

      return { pago, estadoSolicitud: solicitud.estado };
    });

    return {
      mensaje: 'Pago confirmado exitosamente. Servicio finalizado y fondos liberados.',
      pago: sanitizePago(resultado.pago),
      estadoSolicitud: resultado.estadoSolicitud,
    };
  }
}
