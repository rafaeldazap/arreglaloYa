import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { InjectDataSource, InjectRepository } from "@nestjs/typeorm";
import { DataSource, Repository } from "typeorm";
import { Categoria, Zona } from "../../entities";
import { EstadoSolicitud } from "../../common/enums";
import {
  Agrupacion,
  FiltroEstadisticasDto,
} from "./dto/filtro-estadisticas.dto";

// Zona horaria de Bolivia: un pedido creado a las 23:00 del día 5 cuenta para el día 5, no para el 6 (UTC)
const ZONA_HORARIA = "America/La_Paz";
// Rango máximo que se permite consultar de una sola vez
const MAX_DIAS_RANGO = 366;

const TRUNC: Record<Agrupacion, string> = {
  dia: "day",
  semana: "week",
  mes: "month",
};

// Columnas que se repiten en todas las consultas: cuántas solicitudes hay en cada grupo de estados.
// COUNT(...) FILTER (WHERE ...) cuenta solo las filas que cumplen la condición, en una sola pasada por la tabla.
const CONTEOS = `
  COUNT(s.id_solicitud)::int AS total,
  COUNT(s.id_solicitud) FILTER (WHERE s.estado = '${EstadoSolicitud.FINALIZADO}')::int AS atendidas,
  COUNT(s.id_solicitud) FILTER (WHERE s.estado = '${EstadoSolicitud.CANCELADO}')::int AS canceladas,
  COUNT(s.id_solicitud) FILTER (WHERE s.estado IN ('${EstadoSolicitud.APROBADO}', '${EstadoSolicitud.EN_PROCESO}'))::int AS "enCurso",
  COUNT(s.id_solicitud) FILTER (WHERE s.estado IN ('${EstadoSolicitud.PENDIENTE}', '${EstadoSolicitud.BAJO_REVISION}'))::int AS pendientes,
  COUNT(s.id_solicitud) FILTER (WHERE s.estado = '${EstadoSolicitud.FUERA_DE_TIEMPO}')::int AS vencidas`;

export interface Conteos {
  total: number;
  atendidas: number;
  canceladas: number;
  enCurso: number;
  pendientes: number;
  vencidas: number;
}

@Injectable()
export class EstadisticasService {
  constructor(
    @InjectDataSource() private readonly db: DataSource,
    @InjectRepository(Categoria)
    private readonly categoriaRepo: Repository<Categoria>,
    @InjectRepository(Zona) private readonly zonaRepo: Repository<Zona>,
  ) {}

  async obtener(f: FiltroEstadisticasDto) {
    await this.validar(f);
    const agrupacion = f.agrupacion ?? "dia";
    const { sql: condicion, params } = this.condiciones(f);

    // 1) Resumen general del periodo
    const [resumen] = await this.db.query<Conteos[]>(
      `SELECT ${CONTEOS} FROM solicitud_servicio s WHERE ${condicion}`,
      params,
    );

    // 2) Demanda por categoría (incluye categorías activas sin solicitudes, con 0)
    const porCategoria = await this.db.query<
      (Conteos & { id: number; nombre: string })[]
    >(
      `SELECT c.id_categoria AS id, c.nombre, ${CONTEOS}
         FROM categoria c
         LEFT JOIN solicitud_servicio s ON s.id_categoria = c.id_categoria AND ${condicion}
        WHERE ($${params.length + 1}::int IS NULL OR c.id_categoria = $${params.length + 1})
        GROUP BY c.id_categoria, c.nombre, c.activa
       HAVING c.activa OR COUNT(s.id_solicitud) > 0
        ORDER BY total DESC, c.nombre`,
      [...params, f.idCategoria ?? null],
    );

    // 3) Actividad por zona (de mayor a menor)
    const porZona = await this.db.query<
      (Conteos & { id: number; nombre: string })[]
    >(
      `SELECT z.id_zona AS id, z.nombre, ${CONTEOS}
         FROM zona z
         LEFT JOIN solicitud_servicio s ON s.id_zona = z.id_zona AND ${condicion}
        WHERE ($${params.length + 1}::int IS NULL OR z.id_zona = $${params.length + 1})
        GROUP BY z.id_zona, z.nombre, z.activa
       HAVING z.activa OR COUNT(s.id_solicitud) > 0
        ORDER BY total DESC, z.nombre`,
      [...params, f.idZona ?? null],
    );

    // 4) Evolución en el tiempo (por día, semana o mes)
    const tendencia = await this.db.query<(Conteos & { periodo: string })[]>(
      `SELECT to_char(date_trunc('${TRUNC[agrupacion]}', s.fecha_creacion AT TIME ZONE '${ZONA_HORARIA}'), 'YYYY-MM-DD') AS periodo,
              ${CONTEOS}
         FROM solicitud_servicio s
        WHERE ${condicion}
        GROUP BY 1
        ORDER BY 1`,
      params,
    );

    const total = resumen.total;
    const conPorcentajes = <T extends Conteos>(fila: T) => ({
      ...fila,
      porcentajeDelTotal: porcentaje(fila.total, total),
      porcentajeAtendidas: porcentaje(fila.atendidas, fila.total),
      porcentajeCanceladas: porcentaje(fila.canceladas, fila.total),
    });
    const zonas = porZona.map(conPorcentajes);

    return {
      filtros: {
        desde: f.desde ?? null,
        hasta: f.hasta ?? null,
        idCategoria: f.idCategoria ?? null,
        idZona: f.idZona ?? null,
        agrupacion,
      },
      resumen: {
        ...resumen,
        porcentajeAtendidas: porcentaje(resumen.atendidas, total),
        porcentajeCanceladas: porcentaje(resumen.canceladas, total),
        porcentajeEnCurso: porcentaje(resumen.enCurso, total),
        porcentajePendientes: porcentaje(resumen.pendientes, total),
        porcentajeVencidas: porcentaje(resumen.vencidas, total),
        // Las zonas vienen ordenadas de mayor a menor: la primera con solicitudes es la de mayor actividad
        zonaMayorActividad: zonas[0]?.total
          ? { id: zonas[0].id, nombre: zonas[0].nombre, total: zonas[0].total }
          : null,
        categoriaMasDemandada: porCategoria[0]?.total
          ? {
              id: porCategoria[0].id,
              nombre: porCategoria[0].nombre,
              total: porCategoria[0].total,
            }
          : null,
      },
      porCategoria: porCategoria.map(conPorcentajes),
      porZona: zonas,
      tendencia,
    };
  }

  // Reglas de negocio de los filtros
  private async validar(f: FiltroEstadisticasDto) {
    if (f.desde && f.hasta) {
      const dias = (Date.parse(f.hasta) - Date.parse(f.desde)) / 86_400_000;
      if (dias < 0)
        throw new BadRequestException(
          'La fecha "desde" no puede ser posterior a la fecha "hasta"',
        );
      if (dias > MAX_DIAS_RANGO) {
        throw new BadRequestException(
          `El rango de fechas no puede superar ${MAX_DIAS_RANGO} días`,
        );
      }
    }
    if (
      f.idCategoria &&
      !(await this.categoriaRepo.existsBy({ idCategoria: f.idCategoria }))
    ) {
      throw new NotFoundException(`La categoría #${f.idCategoria} no existe`);
    }
    if (f.idZona && !(await this.zonaRepo.existsBy({ idZona: f.idZona }))) {
      throw new NotFoundException(`La zona #${f.idZona} no existe`);
    }
  }

  // Arma el WHERE con parámetros ($1, $2...) para evitar inyección SQL
  private condiciones(f: FiltroEstadisticasDto) {
    const partes: string[] = ["TRUE"];
    const params: unknown[] = [];
    const agregar = (sql: string, valor: unknown) => {
      params.push(valor);
      partes.push(sql.replace("?", `$${params.length}`));
    };
    if (f.desde)
      agregar(
        `(s.fecha_creacion AT TIME ZONE '${ZONA_HORARIA}')::date >= ?::date`,
        f.desde,
      );
    if (f.hasta)
      agregar(
        `(s.fecha_creacion AT TIME ZONE '${ZONA_HORARIA}')::date <= ?::date`,
        f.hasta,
      );
    if (f.idCategoria) agregar("s.id_categoria = ?", f.idCategoria);
    if (f.idZona) agregar("s.id_zona = ?", f.idZona);
    return { sql: partes.join(" AND "), params };
  }
}

// Porcentaje con un decimal; si no hay solicitudes devuelve 0 (evita dividir entre cero)
export function porcentaje(parte: number, total: number): number {
  return total > 0 ? Math.round((parte / total) * 1000) / 10 : 0;
}
