import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { computed, effect, inject, Injectable, signal, untracked } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';
import {
  Catalogo,
  Cotizacion,
  EstadoPedido,
  MotivoCancelacion,
  MotivoReclamo,
  Pago,
  Pedido,
  PrevisualizacionCancelacion,
  Trabajador,
  Usuario,
} from '../models';
import { AuthService } from './auth.service';
import { categoriasDemo, pedidosDemo, trabajadoresDemo, zonasDemo } from './datos-demo';

// Todas las pantallas leen y cambian los datos SOLO a través de este servicio.
// - Versión conectada (npm start): cada acción llama a la API REST del backend NestJS
//   (/api/v1/...) y después vuelve a pedir los datos para que la pantalla se actualice.
// - Versión demo (GitHub Pages): los mismos métodos trabajan con datos de prueba en memoria.

function ahora(): string {
  return new Date().toLocaleString('es-BO');
}

@Injectable({ providedIn: 'root' })
export class DatosService {
  private http = inject(HttpClient);
  private auth = inject(AuthService);
  private api = environment.api;
  esDemo = environment.demo;

  cargando = signal(false);
  // Último error que devolvió el servidor (se muestra como aviso en la parte superior)
  errorApi = signal('');

  private listaCategorias = signal<Catalogo[]>(this.esDemo ? categoriasDemo.map((nombre) => ({ nombre, activa: true })) : []);
  private listaZonas = signal<Catalogo[]>(this.esDemo ? zonasDemo.map((nombre) => ({ nombre, activa: true })) : []);

  // Solo las activas aparecen en buscadores y formularios
  categorias = computed(() => this.listaCategorias().filter((c) => c.activa).map((c) => c.nombre));
  zonas = computed(() => this.listaZonas().filter((z) => z.activa).map((z) => z.nombre));
  todasCategorias = this.listaCategorias.asReadonly();
  todasZonas = this.listaZonas.asReadonly();

  trabajadores = signal<Trabajador[]>(this.esDemo ? trabajadoresDemo : []);
  trabajadoresActivos = computed(() => this.trabajadores().filter((t) => t.estado === 'ACTIVO'));
  trabajadoresEnRevision = computed(() => this.trabajadores().filter((t) => t.estado === 'REVISION'));

  pedidos = signal<Pedido[]>(this.esDemo ? pedidosDemo : []);

  // Motivos de observación que escribió el admin en esta sesión (el backend no los guarda)
  private motivosRechazo = new Map<number, string>();

  constructor() {
    if (!this.esDemo) {
      // Cada vez que alguien inicia o cierra sesión se vuelven a pedir los datos al backend
      effect(() => {
        this.auth.usuario();
        untracked(() => this.recargar());
      });
    }
  }

  // ---------- Conexión con el backend ----------

  async recargar() {
    if (this.esDemo) return;
    const usuario = this.auth.usuario();
    const admin = usuario?.rol === 'ADMIN';
    this.cargando.set(true);
    try {
      const [categorias, zonas, trabajadores] = await Promise.all([
        this.get<CatalogoApi[]>(admin ? '/categorias/todas' : '/categorias'),
        this.get<CatalogoApi[]>(admin ? '/zonas/todas' : '/zonas'),
        this.get<TrabajadorApi[]>(admin ? '/panel/trabajadores/todos' : '/panel/trabajadores'),
      ]);
      this.listaCategorias.set(categorias.map((c) => ({ id: c.idCategoria, nombre: c.nombre, activa: c.activa })));
      this.listaZonas.set(zonas.map((z) => ({ id: z.idZona, nombre: z.nombre, activa: z.activa })));
      this.trabajadores.set(trabajadores.map((t) => aTrabajador(t, this.motivosRechazo.get(t.idPerfil))));
      const pedidos = usuario ? await this.get<PedidoApi[]>('/panel/pedidos') : [];
      this.pedidos.set(pedidos.map(aPedido));
      this.errorApi.set('');
    } catch (e) {
      const err = e as HttpErrorResponse;
      // Token vencido o inválido: se cierra la sesión
      if (err.status === 401 && usuario) this.auth.cerrarSesion();
      else this.errorApi.set(this.auth.mensajeError(err));
    } finally {
      this.cargando.set(false);
    }
  }

  private get<T>(ruta: string) {
    return firstValueFrom(this.http.get<T>(this.api + ruta));
  }

  // Ejecuta una o varias llamadas a la API, vuelve a cargar los datos y devuelve el error (o null)
  private async accion(llamadas: () => Promise<unknown>, avisar = true): Promise<string | null> {
    this.errorApi.set('');
    try {
      await llamadas();
      await this.recargar();
      return null;
    } catch (e) {
      const mensaje = this.auth.mensajeError(e as HttpErrorResponse);
      if (avisar) this.errorApi.set(mensaje);
      await this.recargar();
      return mensaje;
    }
  }

  private post(ruta: string, cuerpo: unknown = {}) {
    return firstValueFrom(this.http.post(this.api + ruta, cuerpo));
  }

  private patch(ruta: string, cuerpo: unknown = {}) {
    return firstValueFrom(this.http.patch(this.api + ruta, cuerpo));
  }

  private idCatalogo(tipo: 'categoria' | 'zona', nombre: string): number | undefined {
    const lista = tipo === 'categoria' ? this.listaCategorias() : this.listaZonas();
    return lista.find((x) => x.nombre === nombre)?.id;
  }

  idsCategorias(nombres: string[]): number[] {
    return nombres.map((n) => this.idCatalogo('categoria', n)!).filter(Boolean);
  }

  idsZonas(nombres: string[]): number[] {
    return nombres.map((n) => this.idCatalogo('zona', n)!).filter(Boolean);
  }

  // ---------- Consultas ----------

  obtenerTrabajadores(zona: string, categoria: string): Trabajador[] {
    return this.trabajadoresActivos().filter(
      (t) => (zona === '' || t.zonas.includes(zona)) && (categoria === '' || t.especialidades.includes(categoria)),
    );
  }

  obtenerTrabajador(id: number): Trabajador | undefined {
    return this.trabajadores().find((t) => t.id === id);
  }

  trabajadorPorCorreo(correo: string): Trabajador | undefined {
    return this.trabajadores().find((t) => t.correo === correo.toLowerCase());
  }

  // Perfil de trabajador del usuario que inició sesión
  miPerfil(usuario: Usuario | null): Trabajador | undefined {
    if (!usuario) return undefined;
    if (this.esDemo) return this.trabajadorPorCorreo(usuario.correo);
    return this.trabajadores().find((t) => t.idUsuario === usuario.id);
  }

  // Pedidos pendientes de su zona y especialidad que todavía no cotizó
  pedidosDisponibles(t: Trabajador): Pedido[] {
    return this.pedidos().filter(
      (p) =>
        p.estado === 'PENDIENTE' &&
        t.especialidades.includes(p.categoria) &&
        t.zonas.includes(p.zona) &&
        !p.cotizaciones.some((c) => c.trabajadorId === t.id),
    );
  }

  pedidosCotizados(t: Trabajador): Pedido[] {
    return this.pedidos().filter((p) => p.estado === 'PENDIENTE' && p.cotizaciones.some((c) => c.trabajadorId === t.id));
  }

  trabajosDe(t: Trabajador): Pedido[] {
    return this.pedidos().filter((p) => p.trabajadorId === t.id && p.estado !== 'PENDIENTE');
  }

  cotizacionAceptada(p: Pedido): Cotizacion | undefined {
    return p.cotizaciones.find((c) => c.estado === 'ACEPTADA');
  }

  total(c: Cotizacion): number {
    return c.monto + c.costoVisita;
  }

  // 25% del total, redondeado a centavos (igual que el backend)
  anticipo(c: Cotizacion): number {
    return Math.round(this.total(c) * 25) / 100;
  }

  saldo(c: Cotizacion): number {
    return Math.round((this.total(c) - this.anticipo(c)) * 100) / 100;
  }

  // Agenda del trabajador: trabajos aprobados o en proceso, ordenados por fecha
  agendaDe(trabajadorId: number) {
    return this.pedidos()
      .filter((p) => p.trabajadorId === trabajadorId && (p.estado === 'APROBADO' || p.estado === 'EN_PROCESO'))
      .map((p) => ({ pedido: p, cotizacion: this.cotizacionAceptada(p)! }))
      .filter((a) => a.cotizacion)
      .sort((a, b) => a.cotizacion.fechaInicio.localeCompare(b.cotizacion.fechaInicio));
  }

  // RF-09: un trabajador no puede tener dos trabajos que se crucen
  hayCruce(trabajadorId: number, inicio: string, horas: number, ignorarPedido?: number): Pedido | undefined {
    const desde = new Date(inicio).getTime();
    const hasta = desde + horas * 3600000;
    return this.agendaDe(trabajadorId)
      .filter((a) => a.pedido.id !== ignorarPedido)
      .find((a) => {
        const otroDesde = new Date(a.cotizacion.fechaInicio).getTime();
        const otroHasta = otroDesde + a.cotizacion.duracionHoras * 3600000;
        return desde < otroHasta && otroDesde < hasta;
      })?.pedido;
  }

  reportes = computed(() => {
    const pedidos = this.pedidos();
    const contar = (lista: string[]) => {
      const mapa = new Map<string, number>();
      lista.forEach((x) => mapa.set(x, (mapa.get(x) ?? 0) + 1));
      return [...mapa.entries()].map(([nombre, cantidad]) => ({ nombre, cantidad })).sort((a, b) => b.cantidad - a.cantidad);
    };
    return {
      totalPedidos: pedidos.length,
      finalizados: pedidos.filter((p) => p.estado === 'FINALIZADO').length,
      cancelados: pedidos.filter((p) => p.estado === 'CANCELADO').length,
      reclamosAbiertos: pedidos.filter((p) => p.reclamo?.estado === 'EN_REVISION').length,
      porEstado: contar(pedidos.map((p) => p.estado)),
      porCategoria: contar(pedidos.map((p) => p.categoria)),
      porZona: contar(pedidos.map((p) => p.zona)),
      mejoresTrabajadores: [...this.trabajadoresActivos()].sort((a, b) => b.promedio - a.promedio).slice(0, 5),
    };
  });

  pedidosConReclamo = computed(() => this.pedidos().filter((p) => p.reclamo));

  // ---------- Cliente ----------

  async crearPedido(datos: {
    cliente: string;
    categoria: string;
    descripcion: string;
    zona: string;
    direccion: string;
    fecha: string;
    montoOfrecido: number;
    fotos: string[];
    trabajador?: string;
    trabajadorId?: number;
  }): Promise<string | null> {
    if (!this.esDemo) {
      return this.accion(
        () =>
          this.post('/solicitudes', {
            idCategoria: this.idCatalogo('categoria', datos.categoria),
            idZona: this.idCatalogo('zona', datos.zona),
            descripcion: datos.descripcion,
            direccionExacta: datos.direccion,
            ...(datos.montoOfrecido > 0 && { montoOfrecido: datos.montoOfrecido }),
            fotosUrls: datos.fotos,
            fechaInicioAgendada: new Date(`${datos.fecha}T09:00`).toISOString(),
            ...(datos.trabajadorId && { idTrabajador: datos.trabajadorId }),
          }),
        false,
      );
    }
    const historial = [{ fecha: ahora(), descripcion: 'Solicitud publicada' }];
    if (datos.trabajador) historial.push({ fecha: ahora(), descripcion: `Solicitud enviada a ${datos.trabajador}` });
    const nuevo: Pedido = {
      id: Date.now(),
      cliente: datos.cliente,
      categoria: datos.categoria,
      descripcion: datos.descripcion,
      zona: datos.zona,
      direccion: datos.direccion,
      fecha: datos.fecha,
      montoOfrecido: datos.montoOfrecido,
      fotos: datos.fotos,
      estado: 'PENDIENTE',
      cotizaciones: [],
      pagos: [],
      trabajoTerminado: false,
      historial,
    };
    this.pedidos.update((lista) => [nuevo, ...lista]);
    return null;
  }

  // Acepta una cotización y paga el anticipo del 25% (pasarela simulada)
  async aceptarCotizacion(pedidoId: number, cotizacionId: number): Promise<string | null> {
    const p = this.buscarPedido(pedidoId);
    const c = p.cotizaciones.find((x) => x.id === cotizacionId)!;
    const cruce = this.hayCruce(c.trabajadorId, c.fechaInicio, c.duracionHoras, p.id);
    if (cruce) return `${c.trabajador} ya tiene otro trabajo en ese horario. Pídele otra fecha o elige otra cotización.`;
    const anticipo = this.anticipo(c);
    if (!this.esDemo) {
      return this.accion(async () => {
        await this.patch(`/cotizaciones/${cotizacionId}/responder?estado=ACEPTADA`);
        await this.post('/pagos', { idSolicitud: pedidoId, tipo: 'ANTICIPO_25', medioPago: 'PASARELA_APP', monto: anticipo });
      }, false);
    }
    this.actualizar(pedidoId, (x) => ({
      ...x,
      estado: 'APROBADO',
      trabajadorId: c.trabajadorId,
      trabajador: c.trabajador,
      cotizaciones: x.cotizaciones.map((y) => ({ ...y, estado: y.id === c.id ? 'ACEPTADA' : 'RECHAZADA' })),
      pagos: [{ tipo: 'ANTICIPO_25', medio: 'PASARELA_APP', monto: anticipo, confirmadoCliente: true, confirmadoTrabajador: true }],
    }), `Cotización de ${c.trabajador} aceptada y anticipo de Bs ${anticipo} pagado. Se reveló la dirección al trabajador.`);
    return null;
  }

  async rechazarCotizacion(pedidoId: number, cotizacionId: number) {
    if (!this.esDemo) return this.accion(() => this.patch(`/cotizaciones/${cotizacionId}/responder?estado=RECHAZADA`));
    this.actualizar(pedidoId, (x) => ({
      ...x,
      cotizaciones: x.cotizaciones.map((y) => (y.id === cotizacionId ? { ...y, estado: 'RECHAZADA' } : y)),
    }), 'El cliente rechazó una cotización');
    return null;
  }

  // Muestra qué pasaría al cancelar (estado, anticipo, penalización y reembolso) sin cambiar nada
  async previsualizarCancelacion(id: number): Promise<{ datos: PrevisualizacionCancelacion | null; error: string | null }> {
    if (this.esDemo) return { datos: this.previsualizarDemo(this.buscarPedido(id)), error: null };
    try {
      const datos = await this.get<PrevisualizacionCancelacion>(`/solicitudes/${id}/cancelacion/previsualizar`);
      return { datos, error: null };
    } catch (e) {
      return { datos: null, error: this.auth.mensajeError(e as HttpErrorResponse) };
    }
  }

  // RN-12: con 24 horas o más de anticipación se devuelve el anticipo; con menos, se libera al trabajador
  async cancelarPedido(id: number, motivo: MotivoCancelacion, detalle: string): Promise<string | null> {
    const cuerpo = { motivo, ...(detalle.trim() && { detalle: detalle.trim() }) };
    if (!this.esDemo) return this.accion(() => this.patch(`/solicitudes/${id}/cancelar`, cuerpo), false);
    const previa = this.previsualizarDemo(this.buscarPedido(id));
    if (!previa.puedeCancelar) return previa.razonBloqueo;
    const resumen = previa.montoPenalizacion > 0
      ? ` Faltaban menos de 24 horas: el anticipo de Bs ${previa.montoPenalizacion} se libera al trabajador (RN-12).`
      : previa.montoReembolso > 0 ? ` Se devuelve el anticipo de Bs ${previa.montoReembolso} al cliente (RN-12).` : '';
    this.actualizar(id, (x) => ({ ...x, estado: 'CANCELADO' }), `El cliente canceló la solicitud (${motivo}).${resumen}`);
    return null;
  }

  // Doble firma: el cliente confirma conformidad y pago del saldo; luego el trabajador confirma que lo recibió
  async confirmarConformidad(pedidoId: number, medio: Pago['medio']) {
    const p = this.buscarPedido(pedidoId);
    const c = this.cotizacionAceptada(p)!;
    const saldo = this.saldo(c);
    if (!this.esDemo) {
      return this.accion(() => this.post('/pagos', { idSolicitud: pedidoId, tipo: 'SALDO_75', medioPago: medio, monto: saldo }));
    }
    this.actualizar(pedidoId, (x) => ({
      ...x,
      pagos: [...x.pagos, { tipo: 'SALDO_75', medio, monto: saldo, confirmadoCliente: true, confirmadoTrabajador: false }],
    }), `El cliente firmó la conformidad y declaró el pago del saldo de Bs ${saldo} (${medio === 'EFECTIVO' ? 'efectivo' : 'QR'})`);
    return null;
  }

  async calificar(pedidoId: number, puntaje: number, comentario: string) {
    if (!this.esDemo) {
      return this.accion(() => this.post('/calificaciones', { idSolicitud: pedidoId, puntaje, ...(comentario && { comentario }) }));
    }
    const p = this.buscarPedido(pedidoId);
    const fecha = new Date().toISOString().slice(0, 10);
    this.actualizar(pedidoId, (x) => ({ ...x, calificacion: { puntaje, comentario, fecha } }), `El cliente calificó con ${puntaje} estrellas`);
    this.trabajadores.update((lista) =>
      lista.map((t) => {
        if (t.id !== p.trabajadorId) return t;
        const opiniones = [{ cliente: p.cliente, puntaje, comentario, fecha }, ...t.opiniones];
        const promedio = Math.round((opiniones.reduce((s, o) => s + o.puntaje, 0) / opiniones.length) * 10) / 10;
        return { ...t, opiniones, promedio };
      }),
    );
    return null;
  }

  // RN-06: un solo reclamo por servicio
  async reclamar(pedidoId: number, motivo: MotivoReclamo, descripcion: string) {
    if (!this.esDemo) return this.accion(() => this.post('/reclamos', { idSolicitud: pedidoId, motivo, descripcion }));
    this.actualizar(pedidoId, (x) => ({
      ...x,
      reclamo: { pedidoId, motivo, descripcion, fecha: ahora(), estado: 'EN_REVISION' },
    }), 'El cliente registró un reclamo');
    return null;
  }

  // ---------- Trabajador ----------

  async enviarCotizacion(
    pedidoId: number,
    t: Trabajador,
    datos: Omit<Cotizacion, 'id' | 'trabajadorId' | 'trabajador' | 'estado'>,
  ): Promise<string | null> {
    if (datos.monto <= 0) return 'Indica el monto del trabajo.';
    if (!datos.fechaInicio) return 'Indica la fecha y hora en que puedes hacer el trabajo.';
    if (datos.duracionHoras <= 0) return 'Indica cuántas horas dura el trabajo.';
    const cruce = this.hayCruce(t.id, datos.fechaInicio, datos.duracionHoras);
    if (cruce) return `Ese horario se cruza con tu trabajo "${cruce.descripcion}". Elige otra hora.`;
    if (!this.esDemo) {
      return this.accion(
        () =>
          this.post('/cotizaciones', {
            idSolicitud: pedidoId,
            requiereVisita: datos.requiereVisita,
            costoVisita: datos.costoVisita,
            // En la base se guarda el total (trabajo + visita)
            montoTotalPropuesto: datos.monto + datos.costoVisita,
            incluyeMateriales: datos.incluyeMateriales,
            fechaInicioAgendada: new Date(datos.fechaInicio).toISOString(),
            duracionEstimadaMinutos: Math.round(datos.duracionHoras * 60),
          }),
        false,
      );
    }
    const cotizacion: Cotizacion = { ...datos, id: Date.now(), trabajadorId: t.id, trabajador: t.nombre, estado: 'PENDIENTE' };
    const visita = datos.requiereVisita ? ` + visita Bs ${datos.costoVisita}` : '';
    this.actualizar(pedidoId, (x) => ({ ...x, cotizaciones: [...x.cotizaciones, cotizacion] }),
      `${t.nombre} envió una cotización de Bs ${datos.monto}${visita}`);
    return null;
  }

  async iniciarServicio(pedidoId: number) {
    if (!this.esDemo) return this.accion(() => this.patch(`/panel/pedidos/${pedidoId}/iniciar`));
    this.actualizar(pedidoId, (x) => ({ ...x, estado: 'EN_PROCESO' }), 'El trabajador inició el servicio');
    return null;
  }

  async marcarTerminado(pedidoId: number) {
    if (!this.esDemo) return this.accion(() => this.patch(`/panel/pedidos/${pedidoId}/terminar`));
    this.actualizar(pedidoId, (x) => ({ ...x, trabajoTerminado: true }), 'El trabajador marcó el trabajo como terminado');
    return null;
  }

  async confirmarRecepcionPago(pedidoId: number) {
    const p = this.buscarPedido(pedidoId);
    if (!this.esDemo) {
      const saldo = p.pagos.find((pg) => pg.tipo === 'SALDO_75');
      return this.accion(() => this.patch(`/pagos/${saldo?.id}/confirmar`));
    }
    this.actualizar(pedidoId, (x) => ({
      ...x,
      estado: 'FINALIZADO',
      pagos: x.pagos.map((pg) => (pg.tipo === 'SALDO_75' ? { ...pg, confirmadoTrabajador: true } : pg)),
    }), 'El trabajador confirmó que recibió el saldo. Servicio finalizado');
    this.trabajadores.update((lista) =>
      lista.map((t) => (t.id === p.trabajadorId ? { ...t, trabajosRealizados: t.trabajosRealizados + 1 } : t)),
    );
    return null;
  }

  // ---------- Administrador ----------

  async aprobarTrabajador(id: number) {
    this.motivosRechazo.delete(id);
    if (!this.esDemo) return this.accion(() => this.patch(`/trabajadores/${id}/verificar`, { aprobar: true }));
    this.trabajadores.update((lista) => lista.map((t) => (t.id === id ? { ...t, estado: 'ACTIVO', motivoRechazo: undefined } : t)));
    return null;
  }

  // Solo en la demo: en la versión conectada el backend ya creó al trabajador en revisión
  agregarTrabajadorEnRevision(d: { nombre: string; correo: string; ci: string; especialidades: string[]; zonas: string[] }) {
    if (!this.esDemo) return;
    const nuevo: Trabajador = {
      ...d, id: Date.now(), correo: d.correo.toLowerCase(), experiencia: 'Recién registrado.', estado: 'REVISION',
      documentos: ['CI.pdf', 'Antecedentes.pdf'], promedio: 0, trabajosRealizados: 0, opiniones: [],
    };
    this.trabajadores.update((lista) => [...lista, nuevo]);
  }

  async rechazarTrabajador(id: number, motivo: string) {
    if (!this.esDemo) {
      // El backend deja la cuenta "en revisión" (observada) hasta que corrija sus documentos
      this.motivosRechazo.set(id, motivo);
      return this.accion(() => this.patch(`/trabajadores/${id}/verificar`, { aprobar: false, motivo }));
    }
    this.trabajadores.update((lista) =>
      lista.map((t) => (t.id === id ? { ...t, estado: 'SUSPENDIDO', motivoRechazo: motivo } : t)),
    );
    return null;
  }

  async agregarCatalogo(tipo: 'categoria' | 'zona', nombre: string): Promise<string | null> {
    const lista = tipo === 'categoria' ? this.listaCategorias : this.listaZonas;
    nombre = nombre.trim();
    if (!nombre) return 'Escribe un nombre.';
    if (lista().some((x) => x.nombre.toLowerCase() === nombre.toLowerCase())) return 'Ya existe con ese nombre.';
    if (!this.esDemo) return this.accion(() => this.post(tipo === 'categoria' ? '/categorias' : '/zonas', { nombre }), false);
    lista.update((l) => [...l, { nombre, activa: true }]);
    return null;
  }

  async alternarCatalogo(tipo: 'categoria' | 'zona', nombre: string) {
    const lista = tipo === 'categoria' ? this.listaCategorias : this.listaZonas;
    if (!this.esDemo) {
      const item = lista().find((x) => x.nombre === nombre)!;
      const ruta = tipo === 'categoria' ? 'categorias' : 'zonas';
      return this.accion(() => this.patch(`/${ruta}/${item.id}/${item.activa ? 'desactivar' : 'activar'}`));
    }
    lista.update((l) => l.map((x) => (x.nombre === nombre ? { ...x, activa: !x.activa } : x)));
    return null;
  }

  // Si el reclamo procede, el trabajador queda suspendido (bloqueado si fue robo)
  async resolverReclamo(pedidoId: number, procede: boolean, resolucion: string) {
    const p = this.buscarPedido(pedidoId);
    if (!this.esDemo) {
      return this.accion(() =>
        this.patch(`/reclamos/${p.reclamo!.id}/resolver`, { resolucion: procede ? 'PROCEDENTE' : 'IMPROCEDENTE' }),
      );
    }
    this.actualizar(pedidoId, (x) => ({
      ...x,
      reclamo: { ...x.reclamo!, estado: procede ? 'PROCEDENTE' : 'IMPROCEDENTE', resolucion },
    }), `El administrador resolvió el reclamo: ${procede ? 'procedente' : 'improcedente'}`);
    if (procede && p.trabajadorId) {
      const estado = p.reclamo?.motivo === 'ROBO' ? 'BLOQUEADO_PERMANENTE' : 'SUSPENDIDO';
      this.trabajadores.update((lista) => lista.map((t) => (t.id === p.trabajadorId ? { ...t, estado } : t)));
    }
    return null;
  }

  // ---------- Ayudantes (versión demo) ----------

  private buscarPedido(id: number): Pedido {
    return this.pedidos().find((p) => p.id === id)!;
  }

  // Versión simple de las reglas de cancelación del backend, para el modo demo
  private previsualizarDemo(p: Pedido): PrevisualizacionCancelacion {
    const redondear = (n: number) => Math.round(n * 100) / 100;
    const anticipo = p.pagos.find((pg) => pg.tipo === 'ANTICIPO_25')?.monto ?? 0;
    const c = this.cotizacionAceptada(p);
    const horas = p.estado === 'APROBADO' && c ? redondear((new Date(c.fechaInicio).getTime() - Date.now()) / 3600000) : null;
    const base = {
      idSolicitud: p.id,
      estadoActual: p.estado,
      horasAnticipacion: horas,
      montoAnticipo: anticipo,
      porcentajePenalizacion: 0,
      montoPenalizacion: 0,
      montoReembolso: 0,
    };
    if (p.estado !== 'PENDIENTE' && p.estado !== 'APROBADO') {
      return { ...base, puedeCancelar: false, razonBloqueo: 'Este pedido ya no se puede cancelar en su estado actual.', consecuencias: [] };
    }
    const porcentaje = anticipo > 0 && horas !== null && horas < 24 ? 100 : 0;
    const penalizacion = redondear((anticipo * porcentaje) / 100);
    const consecuencias = ['La solicitud pasará a estado Cancelado. Esta acción no se puede deshacer.'];
    if (porcentaje > 0) consecuencias.push(`Faltan menos de 24 h: el anticipo (Bs ${anticipo}) se entrega al trabajador. No hay reembolso.`);
    else if (anticipo > 0) consecuencias.push(`No hay penalización: se reembolsa el anticipo completo (Bs ${anticipo}).`);
    else consecuencias.push('No hay penalización.');
    return {
      ...base,
      puedeCancelar: true,
      razonBloqueo: null,
      porcentajePenalizacion: porcentaje,
      montoPenalizacion: penalizacion,
      montoReembolso: redondear(anticipo - penalizacion),
      consecuencias,
    };
  }

  // Cambia un pedido y deja el evento en su historial
  private actualizar(id: number, cambio: (p: Pedido) => Pedido, evento: string) {
    this.pedidos.update((lista) =>
      lista.map((p) => (p.id === id ? { ...cambio(p), historial: [...p.historial, { fecha: ahora(), descripcion: evento }] } : p)),
    );
  }
}

// ---------- Formato de las respuestas del backend y su conversión ----------

interface CatalogoApi {
  idCategoria?: number;
  idZona?: number;
  nombre: string;
  activa: boolean;
}

interface TrabajadorApi {
  idPerfil: number;
  idUsuario: number;
  nombreCompleto: string;
  estadoCuenta: Trabajador['estado'];
  categorias: string[];
  zonas: string[];
  promedio: number;
  trabajosRealizados: number;
  opiniones: { cliente: string; puntaje: number; comentario: string; fecha: string }[];
  correo?: string;
  ciNumero?: string;
  documentos?: string[];
}

interface PedidoApi {
  idSolicitud: number;
  descripcion: string;
  direccionExacta: string;
  montoOfrecido: number | null;
  estado: string;
  fechaCreacion: string;
  fechaInicioAgendada: string | null;
  categoria: { nombre: string } | null;
  zona: { nombre: string } | null;
  fotos: { urlFoto: string }[];
  cliente: { nombreCompleto: string } | null;
  trabajador: { idPerfil: number; nombreCompleto: string } | null;
  cotizaciones: {
    idCotizacion: number;
    requiereVisita: boolean;
    costoVisita: number;
    montoTotalPropuesto: number;
    incluyeMateriales: boolean;
    estadoAprobacion: Cotizacion['estado'];
    fechaInicioPropuesta: string | null;
    duracionMin: number | null;
    trabajador: { idPerfil: number; nombreCompleto: string } | null;
  }[];
  pagos: {
    idPago: number;
    tipo: Pago['tipo'];
    medioPago: Pago['medio'];
    monto: number;
    conformidadCliente: boolean;
    confirmadoPorTrabajador: boolean;
  }[];
  historial: { descripcion: string; fechaHora: string }[];
  trabajoTerminado: boolean;
  reclamo: { idReclamo: number; motivo: MotivoReclamo; descripcion: string | null; estadoResolucion: 'EN_REVISION' | 'PROCEDENTE' | 'IMPROCEDENTE' } | null;
  calificacion: { puntaje: number; comentario: string; fecha: string } | null;
}

// ISO del backend → "AAAA-MM-DDTHH:mm" en hora local (formato de <input type="datetime-local">)
function aLocal(iso: string | null | undefined): string {
  if (!iso) return '';
  const d = new Date(iso);
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 16);
}

function aTrabajador(t: TrabajadorApi, motivoRechazo?: string): Trabajador {
  return {
    id: t.idPerfil,
    idUsuario: t.idUsuario,
    nombre: t.nombreCompleto,
    correo: t.correo ?? '',
    ci: t.ciNumero ?? '',
    especialidades: t.categorias,
    zonas: t.zonas,
    experiencia: '',
    estado: t.estadoCuenta,
    documentos: t.documentos ?? [],
    motivoRechazo,
    promedio: t.promedio,
    trabajosRealizados: t.trabajosRealizados,
    opiniones: t.opiniones.map((o) => ({ ...o, fecha: String(o.fecha).slice(0, 10) })),
  };
}

function aPedido(s: PedidoApi): Pedido {
  // BAJO_REVISION (ya recibió cotizaciones) se muestra igual que PENDIENTE
  const estado = (s.estado === 'BAJO_REVISION' ? 'PENDIENTE' : s.estado) as EstadoPedido;
  return {
    id: s.idSolicitud,
    cliente: s.cliente?.nombreCompleto ?? '',
    categoria: s.categoria?.nombre ?? '',
    descripcion: s.descripcion,
    zona: s.zona?.nombre ?? '',
    direccion: s.direccionExacta,
    fecha: aLocal(s.fechaInicioAgendada ?? s.fechaCreacion).slice(0, 10),
    montoOfrecido: s.montoOfrecido ?? 0,
    fotos: s.fotos.map((f) => f.urlFoto),
    estado,
    trabajadorId: s.trabajador?.idPerfil,
    trabajador: s.trabajador?.nombreCompleto,
    cotizaciones: s.cotizaciones.map((c) => ({
      id: c.idCotizacion,
      trabajadorId: c.trabajador?.idPerfil ?? 0,
      trabajador: c.trabajador?.nombreCompleto ?? '',
      requiereVisita: c.requiereVisita,
      costoVisita: c.costoVisita,
      monto: c.montoTotalPropuesto - c.costoVisita,
      incluyeMateriales: c.incluyeMateriales,
      fechaInicio: aLocal(c.fechaInicioPropuesta ?? s.fechaInicioAgendada),
      duracionHoras: (c.duracionMin ?? 120) / 60,
      estado: c.estadoAprobacion,
    })),
    pagos: s.pagos.map((p) => ({
      id: p.idPago,
      tipo: p.tipo,
      medio: p.medioPago,
      monto: p.monto,
      confirmadoCliente: p.conformidadCliente,
      confirmadoTrabajador: p.confirmadoPorTrabajador,
    })),
    trabajoTerminado: s.trabajoTerminado,
    calificacion: s.calificacion
      ? { puntaje: s.calificacion.puntaje, comentario: s.calificacion.comentario, fecha: String(s.calificacion.fecha).slice(0, 10) }
      : undefined,
    reclamo: s.reclamo
      ? {
          id: s.reclamo.idReclamo,
          pedidoId: s.idSolicitud,
          motivo: s.reclamo.motivo,
          descripcion: s.reclamo.descripcion ?? '',
          fecha: '',
          estado: s.reclamo.estadoResolucion,
        }
      : undefined,
    historial: s.historial.map((h) => ({ fecha: new Date(h.fechaHora).toLocaleString('es-BO'), descripcion: h.descripcion })),
  };
}
