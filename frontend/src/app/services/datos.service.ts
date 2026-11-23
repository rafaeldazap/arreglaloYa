import { computed, Injectable, signal } from '@angular/core';
import { Catalogo, Cotizacion, MotivoReclamo, Pago, Pedido, Trabajador } from '../models';

// Datos de prueba. Cuando el backend (NestJS) tenga cada endpoint,
// el método correspondiente se cambia por una llamada HTTP a la API REST.
// Las pantallas no cambian: solo usan los métodos de este servicio.

// Fecha y hora a partir de hoy, en el formato de <input type="datetime-local">
function dia(offset: number, hora = '09:00'): string {
  const d = new Date();
  d.setDate(d.getDate() + offset);
  return `${d.toISOString().slice(0, 10)}T${hora}`;
}

function ahora(): string {
  return new Date().toLocaleString('es-BO');
}

@Injectable({ providedIn: 'root' })
export class DatosService {
  private listaCategorias = signal<Catalogo[]>(
    ['Plomería', 'Electricidad', 'Albañilería', 'Electrodomésticos'].map((nombre) => ({ nombre, activa: true })),
  );

  private listaZonas = signal<Catalogo[]>(
    ['Centro', 'Cala Cala', 'Queru Queru', 'Sarco', 'Hipódromo', 'Sacaba', 'Quillacollo', 'Tiquipaya'].map((nombre) => ({
      nombre,
      activa: true,
    })),
  );

  // Solo las activas aparecen en buscadores y formularios
  categorias = computed(() => this.listaCategorias().filter((c) => c.activa).map((c) => c.nombre));
  zonas = computed(() => this.listaZonas().filter((z) => z.activa).map((z) => z.nombre));
  todasCategorias = this.listaCategorias.asReadonly();
  todasZonas = this.listaZonas.asReadonly();

  trabajadores = signal<Trabajador[]>([
    {
      id: 1, nombre: 'Juan Mamani', correo: 'trabajador@demo.com', ci: '4567891', especialidades: ['Plomería'],
      zonas: ['Centro', 'Cala Cala', 'Sarco'], experiencia: '8 años arreglando cañerías, tanques de agua y calefones.',
      estado: 'ACTIVO', documentos: ['CI.pdf', 'Antecedentes.pdf'], promedio: 4.8, trabajosRealizados: 56,
      opiniones: [
        { cliente: 'María L.', puntaje: 5, comentario: 'Llegó puntual y dejó todo limpio.', fecha: '2026-10-28' },
        { cliente: 'Carlos R.', puntaje: 4, comentario: 'Buen trabajo, un poco caro.', fecha: '2026-10-12' },
      ],
    },
    {
      id: 2, nombre: 'Rosa Quispe', correo: 'rosa@demo.com', ci: '5678912', especialidades: ['Electricidad'],
      zonas: ['Queru Queru', 'Hipódromo', 'Centro'], experiencia: 'Instalaciones eléctricas domiciliarias y tableros.',
      estado: 'ACTIVO', documentos: ['CI.pdf', 'Antecedentes.pdf', 'Certificado_INFOCAL.pdf'], promedio: 4.9, trabajosRealizados: 41,
      opiniones: [{ cliente: 'Andrés P.', puntaje: 5, comentario: 'Explicó todo lo que hizo. Muy recomendada.', fecha: '2026-10-30' }],
    },
    {
      id: 3, nombre: 'Pedro Choque', correo: 'pedro@demo.com', ci: '6789123', especialidades: ['Albañilería'],
      zonas: ['Sacaba', 'Quillacollo'], experiencia: 'Muros, revoques, cerámica y pequeñas ampliaciones.',
      estado: 'ACTIVO', documentos: ['CI.pdf', 'Antecedentes.pdf'], promedio: 4.5, trabajosRealizados: 23,
      opiniones: [{ cliente: 'Lucía V.', puntaje: 4, comentario: 'Cumplió con lo acordado.', fecha: '2026-09-20' }],
    },
    {
      id: 4, nombre: 'Miguel Torrez', correo: 'miguel@demo.com', ci: '7891234', especialidades: ['Electrodomésticos', 'Electricidad'],
      zonas: ['Cala Cala', 'Tiquipaya'], experiencia: 'Reparación de lavadoras, refrigeradores y cocinas.',
      estado: 'ACTIVO', documentos: ['CI.pdf', 'Antecedentes.pdf'], promedio: 4.6, trabajosRealizados: 37,
      opiniones: [{ cliente: 'Jorge M.', puntaje: 5, comentario: 'Mi refrigerador quedó como nuevo.', fecha: '2026-10-05' }],
    },
    {
      id: 5, nombre: 'Ana Rojas', correo: 'ana@demo.com', ci: '8912345', especialidades: ['Plomería', 'Albañilería'],
      zonas: ['Quillacollo', 'Tiquipaya', 'Sarco'], experiencia: 'Baños y cocinas: instalación y reparación.',
      estado: 'ACTIVO', documentos: ['CI.pdf', 'Antecedentes.pdf'], promedio: 4.3, trabajosRealizados: 18, opiniones: [],
    },
    {
      id: 6, nombre: 'Luis Vargas', correo: 'luis@demo.com', ci: '9123456', especialidades: ['Electricidad'],
      zonas: ['Sarco', 'Centro'], experiencia: '3 años como ayudante de electricista.',
      estado: 'REVISION', documentos: ['CI.pdf', 'Antecedentes.pdf', 'Carta_recomendacion.pdf'], promedio: 0, trabajosRealizados: 0, opiniones: [],
    },
    {
      id: 7, nombre: 'Carla Medina', correo: 'carla@demo.com', ci: '9234567', especialidades: ['Electrodomésticos'],
      zonas: ['Hipódromo', 'Queru Queru'], experiencia: 'Técnica en refrigeración.',
      estado: 'REVISION', documentos: ['CI.pdf'], promedio: 0, trabajosRealizados: 0, opiniones: [],
    },
  ]);

  trabajadoresActivos = computed(() => this.trabajadores().filter((t) => t.estado === 'ACTIVO'));
  trabajadoresEnRevision = computed(() => this.trabajadores().filter((t) => t.estado === 'REVISION'));

  pedidos = signal<Pedido[]>([
    {
      id: 101, cliente: 'María López', categoria: 'Plomería', descripcion: 'Fuga de agua debajo del lavaplatos.',
      zona: 'Cala Cala', direccion: 'Av. América #123', fecha: dia(-1).slice(0, 10), montoOfrecido: 150, fotos: [],
      estado: 'EN_PROCESO', trabajadorId: 1, trabajador: 'Juan Mamani', trabajoTerminado: false,
      cotizaciones: [
        { id: 1, trabajadorId: 1, trabajador: 'Juan Mamani', requiereVisita: false, costoVisita: 0, monto: 180,
          incluyeMateriales: true, fechaInicio: dia(0, '10:00'), duracionHoras: 3, estado: 'ACEPTADA' },
      ],
      pagos: [{ tipo: 'ANTICIPO_25', medio: 'PASARELA_APP', monto: 45, confirmadoCliente: true, confirmadoTrabajador: true }],
      historial: [
        { fecha: '03/11/2026 09:12', descripcion: 'Solicitud publicada' },
        { fecha: '03/11/2026 11:40', descripcion: 'Juan Mamani envió una cotización de Bs 180' },
        { fecha: '03/11/2026 12:05', descripcion: 'Cotización aceptada y anticipo de Bs 45 pagado' },
        { fecha: '05/11/2026 10:00', descripcion: 'El trabajador inició el servicio' },
      ],
    },
    {
      id: 102, cliente: 'María López', categoria: 'Electricidad', descripcion: 'Instalar dos tomacorrientes en el dormitorio.',
      zona: 'Queru Queru', direccion: 'Calle Tumusla #45', fecha: dia(3).slice(0, 10), montoOfrecido: 100, fotos: [],
      estado: 'PENDIENTE', trabajoTerminado: false, pagos: [],
      cotizaciones: [
        { id: 2, trabajadorId: 2, trabajador: 'Rosa Quispe', requiereVisita: true, costoVisita: 20, monto: 120,
          incluyeMateriales: false, fechaInicio: dia(3, '15:00'), duracionHoras: 2, estado: 'PENDIENTE' },
      ],
      historial: [
        { fecha: '05/11/2026 08:30', descripcion: 'Solicitud publicada' },
        { fecha: '05/11/2026 14:10', descripcion: 'Rosa Quispe envió una cotización de Bs 120 + visita Bs 20' },
      ],
    },
    {
      id: 103, cliente: 'María López', categoria: 'Plomería', descripcion: 'Cambiar la llave de paso del baño.',
      zona: 'Centro', direccion: 'Calle Jordán #210', fecha: dia(-10).slice(0, 10), montoOfrecido: 80, fotos: [],
      estado: 'FINALIZADO', trabajadorId: 1, trabajador: 'Juan Mamani', trabajoTerminado: true,
      cotizaciones: [
        { id: 3, trabajadorId: 1, trabajador: 'Juan Mamani', requiereVisita: false, costoVisita: 0, monto: 90,
          incluyeMateriales: true, fechaInicio: dia(-10, '09:00'), duracionHoras: 2, estado: 'ACEPTADA' },
      ],
      pagos: [
        { tipo: 'ANTICIPO_25', medio: 'PASARELA_APP', monto: 23, confirmadoCliente: true, confirmadoTrabajador: true },
        { tipo: 'SALDO_75', medio: 'QR_TRABAJADOR', monto: 67, confirmadoCliente: true, confirmadoTrabajador: true },
      ],
      historial: [
        { fecha: '25/10/2026 08:00', descripcion: 'Solicitud publicada' },
        { fecha: '25/10/2026 09:30', descripcion: 'Cotización aceptada y anticipo de Bs 23 pagado' },
        { fecha: '27/10/2026 11:15', descripcion: 'Servicio finalizado y saldo de Bs 67 confirmado por ambas partes' },
      ],
    },
    {
      id: 104, cliente: 'Carlos Rocha', categoria: 'Plomería', descripcion: 'El tanque de agua rebalsa y no corta.',
      zona: 'Sarco', direccion: 'Av. Melchor Pérez #890', fecha: dia(2).slice(0, 10), montoOfrecido: 120, fotos: [],
      estado: 'PENDIENTE', trabajoTerminado: false, cotizaciones: [], pagos: [],
      historial: [{ fecha: '06/11/2026 07:45', descripcion: 'Solicitud publicada' }],
    },
    {
      id: 105, cliente: 'Lucía Vargas', categoria: 'Plomería', descripcion: 'Destapar la ducha.',
      zona: 'Centro', direccion: 'Calle España #77', fecha: dia(1).slice(0, 10), montoOfrecido: 70, fotos: [],
      estado: 'APROBADO', trabajadorId: 1, trabajador: 'Juan Mamani', trabajoTerminado: false,
      cotizaciones: [
        { id: 4, trabajadorId: 1, trabajador: 'Juan Mamani', requiereVisita: false, costoVisita: 0, monto: 80,
          incluyeMateriales: false, fechaInicio: dia(1, '09:00'), duracionHoras: 2, estado: 'ACEPTADA' },
      ],
      pagos: [{ tipo: 'ANTICIPO_25', medio: 'PASARELA_APP', monto: 20, confirmadoCliente: true, confirmadoTrabajador: true }],
      historial: [
        { fecha: '06/11/2026 10:00', descripcion: 'Solicitud publicada' },
        { fecha: '06/11/2026 12:20', descripcion: 'Cotización aceptada y anticipo de Bs 20 pagado' },
      ],
    },
  ]);

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
    return this.pedidos().filter((p) => p.trabajadorId === t.id);
  }

  cotizacionAceptada(p: Pedido): Cotizacion | undefined {
    return p.cotizaciones.find((c) => c.estado === 'ACEPTADA');
  }

  total(c: Cotizacion): number {
    return c.monto + c.costoVisita;
  }

  anticipo(c: Cotizacion): number {
    return Math.round(this.total(c) * 0.25);
  }

  // Agenda del trabajador: trabajos aprobados o en proceso, ordenados por fecha
  agendaDe(trabajadorId: number) {
    return this.pedidos()
      .filter((p) => p.trabajadorId === trabajadorId && (p.estado === 'APROBADO' || p.estado === 'EN_PROCESO'))
      .map((p) => ({ pedido: p, cotizacion: this.cotizacionAceptada(p)! }))
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

  // ---------- Cliente ----------

  crearPedido(datos: {
    cliente: string;
    categoria: string;
    descripcion: string;
    zona: string;
    direccion: string;
    fecha: string;
    montoOfrecido: number;
    fotos: string[];
    trabajador?: string;
  }) {
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
  }

  // Acepta una cotización y paga el anticipo del 25% (pasarela simulada)
  aceptarCotizacion(pedidoId: number, cotizacionId: number): string | null {
    const p = this.buscarPedido(pedidoId);
    const c = p.cotizaciones.find((x) => x.id === cotizacionId)!;
    const cruce = this.hayCruce(c.trabajadorId, c.fechaInicio, c.duracionHoras, p.id);
    if (cruce) return `${c.trabajador} ya tiene otro trabajo en ese horario. Pídele otra fecha o elige otra cotización.`;
    const anticipo = this.anticipo(c);
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

  rechazarCotizacion(pedidoId: number, cotizacionId: number) {
    this.actualizar(pedidoId, (x) => ({
      ...x,
      cotizaciones: x.cotizaciones.map((y) => (y.id === cotizacionId ? { ...y, estado: 'RECHAZADA' } : y)),
    }), 'El cliente rechazó una cotización');
  }

  // RN-12: con 24 horas o más de anticipación se devuelve el anticipo; con menos, se libera al trabajador
  cancelarPedido(id: number) {
    const p = this.buscarPedido(id);
    let detalle = 'El cliente canceló la solicitud';
    const c = this.cotizacionAceptada(p);
    if (p.estado === 'APROBADO' && c) {
      const horas = (new Date(c.fechaInicio).getTime() - Date.now()) / 3600000;
      detalle += horas >= 24
        ? '. Se devuelve el anticipo al cliente (RN-12)'
        : '. Faltaban menos de 24 horas: el anticipo se libera al trabajador (RN-12)';
    }
    this.actualizar(id, (x) => ({ ...x, estado: 'CANCELADO' }), detalle);
  }

  // Doble firma: el cliente confirma conformidad y pago del saldo; luego el trabajador confirma que lo recibió
  confirmarConformidad(pedidoId: number, medio: Pago['medio']) {
    const p = this.buscarPedido(pedidoId);
    const c = this.cotizacionAceptada(p)!;
    const saldo = this.total(c) - this.anticipo(c);
    this.actualizar(pedidoId, (x) => ({
      ...x,
      pagos: [...x.pagos, { tipo: 'SALDO_75', medio, monto: saldo, confirmadoCliente: true, confirmadoTrabajador: false }],
    }), `El cliente firmó la conformidad y declaró el pago del saldo de Bs ${saldo} (${medio === 'EFECTIVO' ? 'efectivo' : 'QR'})`);
  }

  calificar(pedidoId: number, puntaje: number, comentario: string) {
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
  }

  // RN-06: un solo reclamo por servicio
  reclamar(pedidoId: number, motivo: MotivoReclamo, descripcion: string) {
    this.actualizar(pedidoId, (x) => ({
      ...x,
      reclamo: { pedidoId, motivo, descripcion, fecha: ahora(), estado: 'EN_REVISION' },
    }), 'El cliente registró un reclamo');
  }

  // ---------- Trabajador ----------

  enviarCotizacion(pedidoId: number, t: Trabajador, datos: Omit<Cotizacion, 'id' | 'trabajadorId' | 'trabajador' | 'estado'>): string | null {
    if (datos.monto <= 0) return 'Indica el monto del trabajo.';
    if (!datos.fechaInicio) return 'Indica la fecha y hora en que puedes hacer el trabajo.';
    if (datos.duracionHoras <= 0) return 'Indica cuántas horas dura el trabajo.';
    const cruce = this.hayCruce(t.id, datos.fechaInicio, datos.duracionHoras);
    if (cruce) return `Ese horario se cruza con tu trabajo "${cruce.descripcion}". Elige otra hora.`;
    const cotizacion: Cotizacion = { ...datos, id: Date.now(), trabajadorId: t.id, trabajador: t.nombre, estado: 'PENDIENTE' };
    const visita = datos.requiereVisita ? ` + visita Bs ${datos.costoVisita}` : '';
    this.actualizar(pedidoId, (x) => ({ ...x, cotizaciones: [...x.cotizaciones, cotizacion] }),
      `${t.nombre} envió una cotización de Bs ${datos.monto}${visita}`);
    return null;
  }

  iniciarServicio(pedidoId: number) {
    this.actualizar(pedidoId, (x) => ({ ...x, estado: 'EN_PROCESO' }), 'El trabajador inició el servicio');
  }

  marcarTerminado(pedidoId: number) {
    this.actualizar(pedidoId, (x) => ({ ...x, trabajoTerminado: true }), 'El trabajador marcó el trabajo como terminado');
  }

  confirmarRecepcionPago(pedidoId: number) {
    const p = this.buscarPedido(pedidoId);
    this.actualizar(pedidoId, (x) => ({
      ...x,
      estado: 'FINALIZADO',
      pagos: x.pagos.map((pg) => (pg.tipo === 'SALDO_75' ? { ...pg, confirmadoTrabajador: true } : pg)),
    }), 'El trabajador confirmó que recibió el saldo. Servicio finalizado');
    this.trabajadores.update((lista) =>
      lista.map((t) => (t.id === p.trabajadorId ? { ...t, trabajosRealizados: t.trabajosRealizados + 1 } : t)),
    );
  }

  // ---------- Administrador ----------

  aprobarTrabajador(id: number) {
    this.trabajadores.update((lista) => lista.map((t) => (t.id === id ? { ...t, estado: 'ACTIVO', motivoRechazo: undefined } : t)));
  }

  agregarTrabajadorEnRevision(d: { nombre: string; correo: string; ci: string; especialidades: string[]; zonas: string[] }) {
    const nuevo: Trabajador = {
      ...d, id: Date.now(), correo: d.correo.toLowerCase(), experiencia: 'Recién registrado.', estado: 'REVISION',
      documentos: ['CI.pdf', 'Antecedentes.pdf'], promedio: 0, trabajosRealizados: 0, opiniones: [],
    };
    this.trabajadores.update((lista) => [...lista, nuevo]);
  }

  rechazarTrabajador(id: number, motivo: string) {
    this.trabajadores.update((lista) =>
      lista.map((t) => (t.id === id ? { ...t, estado: 'SUSPENDIDO', motivoRechazo: motivo } : t)),
    );
  }

  agregarCatalogo(tipo: 'categoria' | 'zona', nombre: string): string | null {
    const lista = tipo === 'categoria' ? this.listaCategorias : this.listaZonas;
    nombre = nombre.trim();
    if (!nombre) return 'Escribe un nombre.';
    if (lista().some((x) => x.nombre.toLowerCase() === nombre.toLowerCase())) return 'Ya existe con ese nombre.';
    lista.update((l) => [...l, { nombre, activa: true }]);
    return null;
  }

  alternarCatalogo(tipo: 'categoria' | 'zona', nombre: string) {
    const lista = tipo === 'categoria' ? this.listaCategorias : this.listaZonas;
    lista.update((l) => l.map((x) => (x.nombre === nombre ? { ...x, activa: !x.activa } : x)));
  }

  pedidosConReclamo = computed(() => this.pedidos().filter((p) => p.reclamo));

  // Si el reclamo procede, el trabajador queda suspendido (bloqueado si fue robo)
  resolverReclamo(pedidoId: number, procede: boolean, resolucion: string) {
    const p = this.buscarPedido(pedidoId);
    this.actualizar(pedidoId, (x) => ({
      ...x,
      reclamo: { ...x.reclamo!, estado: procede ? 'PROCEDENTE' : 'IMPROCEDENTE', resolucion },
    }), `El administrador resolvió el reclamo: ${procede ? 'procedente' : 'improcedente'}`);
    if (procede && p.trabajadorId) {
      const estado = p.reclamo?.motivo === 'ROBO' ? 'BLOQUEADO_PERMANENTE' : 'SUSPENDIDO';
      this.trabajadores.update((lista) => lista.map((t) => (t.id === p.trabajadorId ? { ...t, estado } : t)));
    }
  }

  // ---------- Ayudantes ----------

  private buscarPedido(id: number): Pedido {
    return this.pedidos().find((p) => p.id === id)!;
  }

  // Cambia un pedido y deja el evento en su historial
  private actualizar(id: number, cambio: (p: Pedido) => Pedido, evento: string) {
    this.pedidos.update((lista) =>
      lista.map((p) => (p.id === id ? { ...cambio(p), historial: [...p.historial, { fecha: ahora(), descripcion: evento }] } : p)),
    );
  }
}
