import { BadRequestException, Injectable, Logger, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, EntityManager, LessThanOrEqual, Repository } from 'typeorm';
import { ReclamoSancion } from '../../entities/ReclamoSancion';
import { ConfiguracionEscalamiento } from '../../entities/ConfiguracionEscalamiento';
import { GestionReclamo } from '../../entities/GestionReclamo';
import { DecisionReclamo } from '../../entities/DecisionReclamo';
import { Usuario } from '../../entities/Usuario';
import { EstadoCuenta, EstadoResolucion, RolUsuario } from '../../common/enums';
import { ReclamosService } from '../reclamos/reclamos.service';
import { EstadoEscalamiento, TipoDecision } from './escalamiento.enums';
import {
  ConfigurarPlazoDto,
  EscalarReclamoDto,
  FiltrosEscalamientoDto,
  ReasignarReclamoDto,
  ResolverEscalamientoDto,
} from './dto/escalamiento.dto';

const PLAZO_POR_DEFECTO_MIN = 4320; // 3 días

// Convierte minutos a un texto legible: 4320 -> "3 días", 90 -> "1 h 30 min"
export function describirMinutos(total: number): string {
  const min = Math.max(0, Math.round(total));
  const dias = Math.floor(min / 1440);
  const horas = Math.floor((min % 1440) / 60);
  const resto = min % 60;
  const partes: string[] = [];
  if (dias) partes.push(`${dias} ${dias === 1 ? 'día' : 'días'}`);
  if (horas) partes.push(`${horas} h`);
  if (resto || partes.length === 0) partes.push(`${resto} min`);
  return partes.join(' ');
}

function persona(u: Usuario | null | undefined) {
  return u ? { idUsuario: u.idUsuario, nombreCompleto: u.nombreCompleto } : null;
}

@Injectable()
export class EscalamientoService {
  private readonly logger = new Logger(EscalamientoService.name);
  // Evita que la tarea automática y una consulta del admin verifiquen a la vez
  private verificando = false;

  constructor(
    @InjectRepository(ReclamoSancion)
    private readonly reclamoRepo: Repository<ReclamoSancion>,
    @InjectRepository(ConfiguracionEscalamiento)
    private readonly configRepo: Repository<ConfiguracionEscalamiento>,
    @InjectRepository(GestionReclamo)
    private readonly gestionRepo: Repository<GestionReclamo>,
    @InjectRepository(DecisionReclamo)
    private readonly decisionRepo: Repository<DecisionReclamo>,
    @InjectRepository(Usuario)
    private readonly usuarioRepo: Repository<Usuario>,
    private readonly dataSource: DataSource,
    private readonly reclamosService: ReclamosService,
  ) {}

  // ---------------------------------------------------------------------------
  // Configuración del plazo
  // ---------------------------------------------------------------------------
  async obtenerConfiguracion(): Promise<ConfiguracionEscalamiento> {
    const existente = await this.configRepo.findOne({ where: { idConfiguracion: 1 } });
    if (existente) return existente;
    try {
      const nueva = this.configRepo.create({
        idConfiguracion: 1,
        plazoMinutos: PLAZO_POR_DEFECTO_MIN,
        actualizadoPor: null,
      });
      return await this.configRepo.save(nueva);
    } catch {
      // Otra petición la creó al mismo tiempo: se vuelve a leer
      return (await this.configRepo.findOneOrFail({ where: { idConfiguracion: 1 } }));
    }
  }

  async verConfiguracion() {
    const cfg = await this.obtenerConfiguracion();
    return this.aDtoConfiguracion(cfg);
  }

  async configurarPlazo(dto: ConfigurarPlazoDto, admin: Usuario) {
    const cfg = await this.obtenerConfiguracion();
    cfg.plazoMinutos = dto.plazoMinutos;
    cfg.actualizadoPor = admin;
    const guardada = await this.configRepo.save(cfg);

    // El nuevo plazo se aplica de inmediato a los reclamos abiertos
    const verificacion = await this.verificarVencidos();
    return {
      mensaje: `Plazo actualizado a ${describirMinutos(guardada.plazoMinutos)}`,
      configuracion: this.aDtoConfiguracion(guardada),
      escaladosAhora: verificacion.escalados,
    };
  }

  // ---------------------------------------------------------------------------
  // Identificación y escalamiento automático de reclamos vencidos
  // ---------------------------------------------------------------------------
  async verificarVencidos(): Promise<{ plazoMinutos: number; escalados: number[] }> {
    const cfg = await this.obtenerConfiguracion();
    const escalados: number[] = [];
    if (this.verificando) return { plazoMinutos: cfg.plazoMinutos, escalados };

    this.verificando = true;
    try {
      const limite = new Date(Date.now() - cfg.plazoMinutos * 60_000);
      const candidatos = await this.reclamoRepo.find({
        where: {
          estadoResolucion: EstadoResolucion.EN_REVISION,
          fechaCreacion: LessThanOrEqual(limite),
        },
      });

      for (const r of candidatos) {
        const fueEscalado = await this.dataSource.transaction(async (manager) => {
          const gestionExistente = await manager.findOne(GestionReclamo, {
            where: { idReclamo: r.idReclamo },
          });
          if (gestionExistente?.escalado) return false; // ya estaba escalado

          // Se confirma dentro de la transacción que sigue sin resolverse
          const actual = await manager.findOne(ReclamoSancion, { where: { idReclamo: r.idReclamo } });
          if (!actual || actual.estadoResolucion !== EstadoResolucion.EN_REVISION) return false;

          const gestion =
            gestionExistente ??
            manager.create(GestionReclamo, {
              idReclamo: r.idReclamo,
              responsable: null,
              escalado: false,
              fechaEscalamiento: null,
            });
          gestion.escalado = true;
          gestion.fechaEscalamiento = new Date();
          await manager.save(GestionReclamo, gestion);

          await this.registrarDecision(manager, {
            idReclamo: r.idReclamo,
            administrador: null,
            tipo: TipoDecision.ESCALAMIENTO_AUTOMATICO,
            detalle: `El reclamo superó el plazo de ${describirMinutos(cfg.plazoMinutos)} sin resolución y fue escalado automáticamente.`,
          });
          return true;
        });
        if (fueEscalado) escalados.push(r.idReclamo);
      }

      if (escalados.length > 0) {
        this.logger.log(`Escalamiento automático: reclamos ${escalados.join(', ')}`);
      }
      return { plazoMinutos: cfg.plazoMinutos, escalados };
    } finally {
      this.verificando = false;
    }
  }

  // ---------------------------------------------------------------------------
  // Listado, resumen y administradores
  // ---------------------------------------------------------------------------
  async listar(q: FiltrosEscalamientoDto) {
    await this.verificarVencidos();
    const cfg = await this.obtenerConfiguracion();
    const filasTodas = await this.construirTodasLasFilas(cfg);

    let filas = filasTodas;
    if (q.estado && q.estado !== 'TODOS') {
      filas = filas.filter((f) => f.estadoEscalamiento === q.estado);
    }
    if (q.responsable === 'SIN') {
      filas = filas.filter((f) => f.responsable === null);
    } else if (q.responsable) {
      const id = Number(q.responsable);
      filas = filas.filter((f) => f.responsable?.idUsuario === id);
    }

    // Primero los escalados (los más vencidos arriba), luego los que están en plazo, al final los resueltos
    const rango = { ESCALADO: 0, EN_PLAZO: 1, RESUELTO: 2 } as Record<string, number>;
    filas.sort((a, b) => {
      const dr = rango[a.estadoEscalamiento] - rango[b.estadoEscalamiento];
      if (dr !== 0) return dr;
      const ma = a.minutosRestantes ?? Number.MAX_SAFE_INTEGER;
      const mb = b.minutosRestantes ?? Number.MAX_SAFE_INTEGER;
      if (ma !== mb) return ma - mb;
      return b.idReclamo - a.idReclamo;
    });

    const page = q.page ?? 1;
    const limit = q.limit ?? 10;
    const total = filas.length;
    return {
      plazoMinutos: cfg.plazoMinutos,
      data: filas.slice((page - 1) * limit, page * limit),
      total,
      page,
      limit,
      totalPages: Math.max(1, Math.ceil(total / limit)),
    };
  }

  async resumen() {
    await this.verificarVencidos();
    const cfg = await this.obtenerConfiguracion();
    const filas = await this.construirTodasLasFilas(cfg);
    const cuenta = (e: EstadoEscalamiento) => filas.filter((f) => f.estadoEscalamiento === e).length;
    return {
      plazoMinutos: cfg.plazoMinutos,
      total: filas.length,
      enPlazo: cuenta(EstadoEscalamiento.EN_PLAZO),
      escalados: cuenta(EstadoEscalamiento.ESCALADO),
      resueltos: cuenta(EstadoEscalamiento.RESUELTO),
      abiertosSinResponsable: filas.filter(
        (f) => f.estadoEscalamiento !== EstadoEscalamiento.RESUELTO && f.responsable === null,
      ).length,
    };
  }

  async listarAdministradores() {
    const admins = await this.usuarioRepo.find({
      where: { rol: RolUsuario.ADMIN, estadoCuenta: EstadoCuenta.ACTIVO },
      order: { nombreCompleto: 'ASC' },
    });
    return admins.map((a) => persona(a));
  }

  // ---------------------------------------------------------------------------
  // Reasignación de responsable
  // ---------------------------------------------------------------------------
  async reasignar(idReclamo: number, dto: ReasignarReclamoDto, admin: Usuario) {
    await this.dataSource.transaction(async (manager) => {
      await this.cargarReclamoAbierto(manager, idReclamo);

      const responsable = await manager.findOne(Usuario, { where: { idUsuario: dto.idResponsable } });
      if (!responsable) throw new NotFoundException(`Usuario #${dto.idResponsable} no encontrado`);
      if (responsable.rol !== RolUsuario.ADMIN) {
        throw new BadRequestException('El responsable debe ser un usuario administrador');
      }
      if (responsable.estadoCuenta !== EstadoCuenta.ACTIVO) {
        throw new BadRequestException('El administrador seleccionado no tiene la cuenta activa');
      }

      let gestion = await manager.findOne(GestionReclamo, { where: { idReclamo } });
      const anterior = gestion?.responsable ?? null;
      if (anterior && anterior.idUsuario === responsable.idUsuario) {
        throw new BadRequestException('El reclamo ya está asignado a ese responsable');
      }

      if (!gestion) {
        gestion = manager.create(GestionReclamo, {
          idReclamo,
          responsable: null,
          escalado: false,
          fechaEscalamiento: null,
        });
      }
      gestion.responsable = responsable;
      await manager.save(GestionReclamo, gestion);

      await this.registrarDecision(manager, {
        idReclamo,
        administrador: admin,
        tipo: TipoDecision.REASIGNACION,
        detalle: `Reasignado de ${anterior ? anterior.nombreCompleto : 'sin responsable'} a ${responsable.nombreCompleto}. Motivo: ${dto.motivo.trim()}`,
        responsableAnterior: anterior,
        responsableNuevo: responsable,
      });
    });

    return { mensaje: `Reclamo #${idReclamo} reasignado`, reclamo: await this.filaDe(idReclamo) };
  }

  // ---------------------------------------------------------------------------
  // Escalamiento manual
  // ---------------------------------------------------------------------------
  async escalarManual(idReclamo: number, dto: EscalarReclamoDto, admin: Usuario) {
    await this.dataSource.transaction(async (manager) => {
      await this.cargarReclamoAbierto(manager, idReclamo);

      let gestion = await manager.findOne(GestionReclamo, { where: { idReclamo } });
      if (gestion?.escalado) throw new BadRequestException('El reclamo ya está escalado');

      if (!gestion) {
        gestion = manager.create(GestionReclamo, {
          idReclamo,
          responsable: null,
          escalado: false,
          fechaEscalamiento: null,
        });
      }
      gestion.escalado = true;
      gestion.fechaEscalamiento = new Date();
      await manager.save(GestionReclamo, gestion);

      await this.registrarDecision(manager, {
        idReclamo,
        administrador: admin,
        tipo: TipoDecision.ESCALAMIENTO_MANUAL,
        detalle: `Escalado manualmente. Motivo: ${dto.motivo.trim()}`,
      });
    });

    return { mensaje: `Reclamo #${idReclamo} escalado`, reclamo: await this.filaDe(idReclamo) };
  }

  // ---------------------------------------------------------------------------
  // Resolución (reutiliza la lógica de sanciones ya existente y deja constancia)
  // ---------------------------------------------------------------------------
  async resolver(idReclamo: number, dto: ResolverEscalamientoDto, admin: Usuario) {
    // Valida que exista y que siga abierto, y aplica la sanción Fibonacci/bloqueo
    const resultado = await this.reclamosService.resolverReclamo(idReclamo, dto.resolucion);

    const comentario = dto.comentario?.trim();
    await this.decisionRepo.save(
      this.decisionRepo.create({
        idReclamo,
        administrador: admin,
        tipo: TipoDecision.RESOLUCION,
        detalle: `Resolvió el reclamo como ${dto.resolucion}.${comentario ? ` Comentario: ${comentario}` : ''}`.slice(0, 500),
        responsableAnterior: null,
        responsableNuevo: null,
      }),
    );

    return { ...resultado, fila: await this.filaDe(idReclamo) };
  }

  // ---------------------------------------------------------------------------
  // Historial de decisiones administrativas
  // ---------------------------------------------------------------------------
  async historial(idReclamo: number) {
    const reclamo = await this.reclamoRepo.findOne({ where: { idReclamo } });
    if (!reclamo) throw new NotFoundException(`Reclamo #${idReclamo} no encontrado`);

    const eventos = await this.decisionRepo.find({
      where: { idReclamo },
      order: { fecha: 'ASC', idDecision: 'ASC' },
    });

    return {
      reclamo: await this.filaDe(idReclamo),
      eventos: eventos.map((e) => ({
        idDecision: e.idDecision,
        tipo: e.tipo,
        detalle: e.detalle,
        fecha: e.fecha,
        administrador: persona(e.administrador), // null = sistema
        responsableAnterior: persona(e.responsableAnterior),
        responsableNuevo: persona(e.responsableNuevo),
      })),
    };
  }

  // ---------------------------------------------------------------------------
  // Utilidades internas
  // ---------------------------------------------------------------------------
  private async registrarDecision(
    manager: EntityManager,
    datos: {
      idReclamo: number;
      administrador: Usuario | null;
      tipo: TipoDecision;
      detalle: string;
      responsableAnterior?: Usuario | null;
      responsableNuevo?: Usuario | null;
    },
  ) {
    const decision = manager.create(DecisionReclamo, {
      idReclamo: datos.idReclamo,
      administrador: datos.administrador,
      tipo: datos.tipo,
      detalle: datos.detalle.slice(0, 500),
      responsableAnterior: datos.responsableAnterior ?? null,
      responsableNuevo: datos.responsableNuevo ?? null,
    });
    await manager.save(DecisionReclamo, decision);
  }

  // Bloquea el reclamo, comprueba que existe y que todavía no fue resuelto
  private async cargarReclamoAbierto(manager: EntityManager, idReclamo: number) {
    await manager
      .createQueryBuilder(ReclamoSancion, 'r')
      .select('r.idReclamo')
      .where('r.idReclamo = :idReclamo', { idReclamo })
      .setLock('pessimistic_write')
      .getOne();

    const reclamo = await manager.findOne(ReclamoSancion, { where: { idReclamo } });
    if (!reclamo) throw new NotFoundException(`Reclamo #${idReclamo} no encontrado`);
    if (reclamo.estadoResolucion !== EstadoResolucion.EN_REVISION) {
      throw new BadRequestException(
        `El reclamo ya fue resuelto (${reclamo.estadoResolucion}) y no admite más gestiones`,
      );
    }
    return reclamo;
  }

  private async construirTodasLasFilas(cfg: ConfiguracionEscalamiento) {
    const [reclamos, gestiones] = await Promise.all([
      this.reclamoRepo.find({ order: { idReclamo: 'DESC' } }),
      this.gestionRepo.find(),
    ]);
    const porReclamo = new Map(gestiones.map((g) => [g.idReclamo, g]));
    const ahora = new Date();
    return reclamos.map((r) => this.construirFila(r, porReclamo.get(r.idReclamo), cfg, ahora));
  }

  private async filaDe(idReclamo: number) {
    const cfg = await this.obtenerConfiguracion();
    const reclamo = await this.reclamoRepo.findOneOrFail({ where: { idReclamo } });
    const gestion = await this.gestionRepo.findOne({ where: { idReclamo } });
    return this.construirFila(reclamo, gestion ?? undefined, cfg, new Date());
  }

  private construirFila(
    r: ReclamoSancion,
    g: GestionReclamo | undefined,
    cfg: ConfiguracionEscalamiento,
    ahora: Date,
  ) {
    const resuelto = r.estadoResolucion !== EstadoResolucion.EN_REVISION;
    const fechaLimite = new Date(new Date(r.fechaCreacion).getTime() + cfg.plazoMinutos * 60_000);
    const escalado = !!g?.escalado;

    const estadoEscalamiento = resuelto
      ? EstadoEscalamiento.RESUELTO
      : escalado
        ? EstadoEscalamiento.ESCALADO
        : EstadoEscalamiento.EN_PLAZO;

    return {
      idReclamo: r.idReclamo,
      idSolicitud: r.solicitud?.idSolicitud ?? null,
      motivo: r.motivo,
      descripcion: r.descripcion ?? null,
      estadoResolucion: r.estadoResolucion,
      estadoEscalamiento,
      fechaCreacion: r.fechaCreacion,
      fechaLimite,
      // Negativo = minutos de retraso. null cuando ya está resuelto
      minutosRestantes: resuelto ? null : Math.floor((fechaLimite.getTime() - ahora.getTime()) / 60_000),
      escalado,
      fechaEscalamiento: g?.fechaEscalamiento ?? null,
      denunciante: persona(r.denunciante),
      denunciado: persona(r.denunciado),
      responsable: persona(g?.responsable),
    };
  }

  private aDtoConfiguracion(cfg: ConfiguracionEscalamiento) {
    return {
      plazoMinutos: cfg.plazoMinutos,
      descripcion: describirMinutos(cfg.plazoMinutos),
      actualizadoPor: persona(cfg.actualizadoPor),
      fechaActualizacion: cfg.fechaActualizacion,
    };
  }
}
