import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { ReclamoSancion } from '../../entities/ReclamoSancion';
import { SolicitudServicio } from '../../entities/SolicitudServicio';
import { Usuario } from '../../entities/Usuario';
import { CrearReclamoDto } from './dto/crear-reclamo.dto';
import { EstadoResolucion, EstadoCuenta, MotivoReclamo, RolUsuario } from '../../common/enums';
import { sanitizeReclamo } from '../../common/serializers/entity-sanitizer';

function calcularFibonacci(n: number): number {
  if (n <= 2) return 1;
  let a = 1;
  let b = 1;
  for (let i = 3; i <= n; i++) {
    const temp = a + b;
    a = b;
    b = temp;
  }
  return b;
}

@Injectable()
export class ReclamosService {
  constructor(
    @InjectRepository(ReclamoSancion)
    private readonly reclamoRepo: Repository<ReclamoSancion>,
    @InjectRepository(SolicitudServicio)
    private readonly solicitudRepo: Repository<SolicitudServicio>,
    private readonly dataSource: DataSource,
  ) {}

  // CU-04, RN-06: Registrar reclamo (Máximo 1 por servicio y siempre contra la contraparte real)
  async registrarReclamo(dto: CrearReclamoDto, denunciante: Usuario) {
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

      if (!solicitud) throw new NotFoundException('Solicitud de servicio no encontrada');

      const esCliente = solicitud.cliente?.idUsuario === denunciante.idUsuario;
      const esTrabajador = solicitud.trabajador?.usuario?.idUsuario === denunciante.idUsuario;

      if (!esCliente && !esTrabajador && denunciante.rol !== RolUsuario.ADMIN) {
        throw new ForbiddenException(
          'Solo los participantes de este servicio pueden presentar un reclamo',
        );
      }

      // RN-06: Máximo 1 reporte por servicio
      const existe = await manager.findOne(ReclamoSancion, {
        where: { solicitud: { idSolicitud: dto.idSolicitud } },
      });

      if (existe) {
        throw new BadRequestException(
          'Esta solicitud ya cuenta con un reporte registrado (Límite: 1 reporte por servicio, RN-06)',
        );
      }

      // Derivar denunciado de la contraparte real de la solicitud para evitar denuncias a terceros ajenos
      let denunciado: Usuario | null = null;

      if (esCliente) {
        if (!solicitud.trabajador?.usuario) {
          throw new BadRequestException(
            'No se puede presentar un reclamo porque la solicitud aún no tiene un trabajador asignado',
          );
        }
        denunciado = solicitud.trabajador.usuario;
      } else if (esTrabajador) {
        denunciado = solicitud.cliente;
      } else {
        // ADMIN: debe apuntar a uno de los participantes reales
        const participantes = [solicitud.cliente, solicitud.trabajador?.usuario].filter(
          (u): u is Usuario => Boolean(u),
        );
        denunciado = participantes.find((u) => u.idUsuario === dto.idDenunciado) ?? null;
        if (!denunciado) {
          throw new BadRequestException(
            'idDenunciado debe corresponder al cliente o trabajador participante de esta solicitud',
          );
        }
      }

      if (denunciado.idUsuario === denunciante.idUsuario) {
        throw new BadRequestException('No puede presentar un reclamo contra sí mismo');
      }

      const reclamo = manager.create(ReclamoSancion, {
        solicitud,
        denunciante,
        denunciado,
        motivo: dto.motivo,
        descripcion: dto.descripcion?.trim(),
        urlPruebas: dto.urlPruebas,
        estadoResolucion: EstadoResolucion.EN_REVISION,
        diasSuspension: 0,
      });

      return manager.save(ReclamoSancion, reclamo);
    });

    return sanitizeReclamo(guardado);
  }

  async obtenerPorSolicitud(idSolicitud: number, usuario: Usuario) {
    const solicitud = await this.solicitudRepo.findOne({
      where: { idSolicitud },
      relations: ['cliente', 'trabajador', 'trabajador.usuario'],
    });

    if (!solicitud) {
      throw new NotFoundException(`Solicitud #${idSolicitud} no encontrada`);
    }

    const esParticipanteSolicitud =
      solicitud.cliente?.idUsuario === usuario.idUsuario ||
      solicitud.trabajador?.usuario?.idUsuario === usuario.idUsuario;

    if (!esParticipanteSolicitud && usuario.rol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('No tiene permisos para consultar reclamos de esta solicitud');
    }

    const reclamo = await this.reclamoRepo.findOne({
      where: { solicitud: { idSolicitud } },
      relations: ['denunciante', 'denunciado', 'solicitud'],
    });

    if (!reclamo) {
      throw new NotFoundException(`No existe reclamo registrado para la solicitud: ${idSolicitud}`);
    }

    return sanitizeReclamo(reclamo);
  }

  async listarTodos() {
    const lista = await this.reclamoRepo.find({
      relations: ['denunciante', 'denunciado', 'solicitud'],
      order: { idReclamo: 'DESC' },
    });
    return lista.map((r) => sanitizeReclamo(r));
  }

  // CU-04, RN-06, RN-07: Resolución de reclamos por el Administrador (idempotente)
  async resolverReclamo(idReclamo: number, resolucion: EstadoResolucion) {
    if (
      resolucion !== EstadoResolucion.PROCEDENTE &&
      resolucion !== EstadoResolucion.IMPROCEDENTE
    ) {
      throw new BadRequestException('La resolución debe ser PROCEDENTE o IMPROCEDENTE');
    }

    const resultado = await this.dataSource.transaction(async (manager) => {
      await manager
        .createQueryBuilder(ReclamoSancion, 'r')
        .select('r.idReclamo')
        .where('r.idReclamo = :idReclamo', { idReclamo })
        .setLock('pessimistic_write')
        .getOne();

      const reclamo = await manager.findOne(ReclamoSancion, {
        where: { idReclamo },
        relations: ['denunciante', 'denunciado', 'solicitud'],
      });

      if (!reclamo) throw new NotFoundException('Reclamo no encontrado');

      if (reclamo.estadoResolucion !== EstadoResolucion.EN_REVISION) {
        throw new BadRequestException(
          `Este reclamo ya fue resuelto previamente (${reclamo.estadoResolucion}) y no puede procesarse de nuevo`,
        );
      }

      reclamo.estadoResolucion = resolucion;

      if (resolucion === EstadoResolucion.PROCEDENTE) {
        const denunciado = reclamo.denunciado;

        if (denunciado.estadoCuenta === EstadoCuenta.BLOQUEADO_PERMANENTE) {
          reclamo.diasSuspension = 9999;
        } else if (reclamo.motivo === MotivoReclamo.ROBO) {
          // RN-07: Bloqueo permanente e irreversible en caso de ROBO comprobado
          denunciado.estadoCuenta = EstadoCuenta.BLOQUEADO_PERMANENTE;
          denunciado.suspendidoHasta = null;
          reclamo.diasSuspension = 9999;
          await manager.save(Usuario, denunciado);
        } else {
          // RN-06: Sanciones incrementales basadas en Fibonacci (1, 1, 2, 3, 5, 8, 13...)
          const nuevoNivel = (denunciado.nivelFibonacci || 0) + 1;
          const dias = calcularFibonacci(nuevoNivel);

          denunciado.nivelFibonacci = nuevoNivel;
          denunciado.estadoCuenta = EstadoCuenta.SUSPENDIDO;

          const baseFecha =
            denunciado.suspendidoHasta && new Date(denunciado.suspendidoHasta) > new Date()
              ? new Date(denunciado.suspendidoHasta)
              : new Date();
          baseFecha.setDate(baseFecha.getDate() + dias);
          denunciado.suspendidoHasta = baseFecha;

          reclamo.diasSuspension = dias;
          await manager.save(Usuario, denunciado);
        }
      } else {
        reclamo.diasSuspension = 0;
      }

      const guardado = await manager.save(ReclamoSancion, reclamo);
      return guardado;
    });

    return {
      mensaje: `Reclamo #${idReclamo} resuelto como ${resolucion}`,
      reclamo: sanitizeReclamo(resultado),
      usuarioSancionado: {
        idUsuario: resultado.denunciado.idUsuario,
        nombreCompleto: resultado.denunciado.nombreCompleto,
        estadoCuenta: resultado.denunciado.estadoCuenta,
        nivelFibonacci: resultado.denunciado.nivelFibonacci,
        suspendidoHasta: resultado.denunciado.suspendidoHasta,
        diasSancionAplicados: resultado.diasSuspension,
      },
    };
  }
}
