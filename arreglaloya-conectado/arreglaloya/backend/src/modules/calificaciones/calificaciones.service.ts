import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ForbiddenException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Calificacion } from '../../entities/Calificacion';
import { SolicitudServicio } from '../../entities/SolicitudServicio';
import { Usuario } from '../../entities/Usuario';
import { PerfilTrabajador } from '../../entities/PerfilTrabajador';
import { CrearCalificacionDto } from './dto/crear-calificacion.dto';
import { EstadoSolicitud, RolUsuario } from '../../common/enums';
import { sanitizeCalificacion, sanitizeUsuario } from '../../common/serializers/entity-sanitizer';

@Injectable()
export class CalificacionesService {
  constructor(
    @InjectRepository(Calificacion)
    private readonly calificacionRepo: Repository<Calificacion>,
    @InjectRepository(SolicitudServicio)
    private readonly solicitudRepo: Repository<SolicitudServicio>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(PerfilTrabajador)
    private readonly perfilRepo: Repository<PerfilTrabajador>,
  ) {}

  // CU-06, RN-09, RF-09: Calificar servicio finalizado
  async calificar(dto: CrearCalificacionDto, evaluador: Usuario) {
    const solicitud = await this.solicitudRepo.findOne({
      where: { idSolicitud: dto.idSolicitud },
      relations: ['cliente', 'trabajador', 'trabajador.usuario'],
    });

    if (!solicitud) {
      throw new NotFoundException('Solicitud no encontrada');
    }

    // RF-09: Solo habilitado en estado finalizado
    if (solicitud.estado !== EstadoSolicitud.FINALIZADO) {
      throw new BadRequestException(
        `Solo se puede calificar un servicio cuando se encuentra FINALIZADO (actual: ${solicitud.estado})`,
      );
    }

    const esCliente = solicitud.cliente?.idUsuario === evaluador.idUsuario;
    const esTrabajador = solicitud.trabajador?.usuario?.idUsuario === evaluador.idUsuario;

    if (!esCliente && !esTrabajador && evaluador.rol !== RolUsuario.ADMIN) {
      throw new ForbiddenException('Solo los participantes de este servicio pueden calificar');
    }

    const calificacionPrevia = await this.calificacionRepo.findOne({
      where: {
        solicitud: { idSolicitud: dto.idSolicitud },
        evaluador: { idUsuario: evaluador.idUsuario },
      },
    });

    if (calificacionPrevia) {
      throw new BadRequestException('Usted ya ha emitido su calificación para este servicio');
    }

    let evaluado: Usuario | null = null;
    let esInterna = false;

    if (esCliente) {
      if (!solicitud.trabajador?.usuario) {
        throw new BadRequestException('La solicitud no tiene un trabajador asignado para calificar');
      }
      evaluado = solicitud.trabajador.usuario;
      esInterna = false; // Calificación pública hacia el técnico
    } else if (esTrabajador) {
      evaluado = solicitud.cliente;
      esInterna = true; // Calificación interna hacia el cliente (RN-09)
    } else {
      // ADMIN: debe indicar uno de los dos participantes de la solicitud
      const participantesIds = [
        solicitud.cliente?.idUsuario,
        solicitud.trabajador?.usuario?.idUsuario,
      ].filter(Boolean);

      if (!dto.idEvaluado || !participantesIds.includes(dto.idEvaluado)) {
        throw new BadRequestException(
          'Debe indicar un idEvaluado perteneciente a los participantes del servicio',
        );
      }
      evaluado = await this.usuarioRepo.findOneBy({ idUsuario: dto.idEvaluado });
      if (!evaluado) throw new NotFoundException('Usuario evaluado no encontrado');
      esInterna = evaluado.rol === RolUsuario.CLIENTE;
    }

    const calificacion = this.calificacionRepo.create({
      solicitud,
      evaluador,
      evaluado,
      puntaje: dto.puntaje,
      comentario: dto.comentario?.trim(),
      esInterna,
    });

    const guardada = await this.calificacionRepo.save(calificacion);

    if (!esInterna) {
      await this.recalcularPromediosTrabajador(evaluado.idUsuario);
    }

    return sanitizeCalificacion(guardada);
  }

  private async recalcularPromediosTrabajador(idUsuarioTrabajador: number) {
    const perfil = await this.perfilRepo.findOne({
      where: { usuario: { idUsuario: idUsuarioTrabajador } },
    });
    if (!perfil) return;

    const semRaw = await this.calificacionRepo
      .createQueryBuilder('c')
      .select('AVG(c.puntaje)', 'avg')
      .where("c.id_evaluado = :id AND c.es_interna = false AND c.fecha >= NOW() - INTERVAL '7 days'", {
        id: idUsuarioTrabajador,
      })
      .getRawOne();

    const menRaw = await this.calificacionRepo
      .createQueryBuilder('c')
      .select('AVG(c.puntaje)', 'avg')
      .where(
        "c.id_evaluado = :id AND c.es_interna = false AND c.fecha >= NOW() - INTERVAL '30 days'",
        { id: idUsuarioTrabajador },
      )
      .getRawOne();

    const anuRaw = await this.calificacionRepo
      .createQueryBuilder('c')
      .select('AVG(c.puntaje)', 'avg')
      .where(
        "c.id_evaluado = :id AND c.es_interna = false AND c.fecha >= NOW() - INTERVAL '365 days'",
        { id: idUsuarioTrabajador },
      )
      .getRawOne();

    perfil.promedioSemanal = semRaw?.avg ? parseFloat(Number(semRaw.avg).toFixed(2)) : 0;
    perfil.promedioMensual = menRaw?.avg ? parseFloat(Number(menRaw.avg).toFixed(2)) : 0;
    perfil.promedioAnual = anuRaw?.avg ? parseFloat(Number(anuRaw.avg).toFixed(2)) : 0;

    await this.perfilRepo.save(perfil);
  }

  // RN-09: Calificaciones públicas para técnicos, internas para clientes
  async listarPorUsuario(idUsuario: number, usuarioConsultante: Usuario) {
    const targetUser = await this.usuarioRepo.findOneBy({ idUsuario });
    if (!targetUser) throw new NotFoundException('Usuario no encontrado');

    const qb = this.calificacionRepo
      .createQueryBuilder('c')
      .leftJoinAndSelect('c.evaluador', 'evaluador')
      .where('c.id_evaluado = :idUsuario', { idUsuario })
      .orderBy('c.fecha', 'DESC');

    if (targetUser.rol === RolUsuario.CLIENTE) {
      if (
        usuarioConsultante.rol !== RolUsuario.TRABAJADOR &&
        usuarioConsultante.rol !== RolUsuario.ADMIN
      ) {
        throw new ForbiddenException(
          'La reputación interna de clientes solo puede ser consultada por trabajadores y administradores',
        );
      }
      qb.andWhere('c.es_interna = true');
    } else {
      qb.andWhere('c.es_interna = false');
    }

    const items = await qb.getMany();

    return items.map((c) => ({
      idCalificacion: c.idCalificacion,
      puntaje: c.puntaje,
      comentario: c.comentario,
      fecha: c.fecha,
      esInterna: c.esInterna,
      evaluador: sanitizeUsuario(c.evaluador),
    }));
  }
}
