import { Usuario } from '../../entities/Usuario';
import { PerfilTrabajador } from '../../entities/PerfilTrabajador';
import { SolicitudServicio } from '../../entities/SolicitudServicio';
import { Cotizacion } from '../../entities/Cotizacion';
import { TransaccionPago } from '../../entities/TransaccionPago';
import { ReclamoSancion } from '../../entities/ReclamoSancion';
import { Calificacion } from '../../entities/Calificacion';
import { HistorialEstado } from '../../entities/HistorialEstado';
import { CancelacionSolicitud } from '../../entities/CancelacionSolicitud';
import { EstadoSolicitud, RolUsuario } from '../enums';

export function sanitizeUsuario(u?: Usuario | null, includeContact = false) {
  if (!u) return null;
  return {
    idUsuario: u.idUsuario,
    nombreCompleto: u.nombreCompleto,
    rol: u.rol,
    ...(includeContact ? { telefono: u.telefono, correo: u.correo } : {}),
  };
}

export function sanitizeTrabajador(
  t?: PerfilTrabajador | null,
  options: { includeContact?: boolean; includeQr?: boolean; includeAdminDocs?: boolean } = {},
) {
  if (!t) return null;
  const { includeContact = false, includeQr = false, includeAdminDocs = false } = options;

  return {
    idPerfil: t.idPerfil,
    idUsuario: t.usuario?.idUsuario,
    nombreCompleto: t.usuario?.nombreCompleto,
    ...(includeContact && t.usuario
      ? { telefono: t.usuario.telefono, correo: t.usuario.correo }
      : {}),
    margenErrorMin: t.margenErrorMin,
    ...(includeQr ? { qrImagenUrl: t.qrImagenUrl, qrVigenciaMin: t.qrVigenciaMin } : {}),
    ...(includeAdminDocs
      ? {
          ciNumero: t.ciNumero,
          urlCi: t.urlCi,
          urlAntecedentes: t.urlAntecedentes,
          urlExperiencia: t.urlExperiencia,
          estadoCuenta: t.usuario?.estadoCuenta,
          nivelFibonacci: t.usuario?.nivelFibonacci,
          suspendidoHasta: t.usuario?.suspendidoHasta,
        }
      : {}),
    promedioSemanal: Number(t.promedioSemanal),
    promedioMensual: Number(t.promedioMensual),
    promedioAnual: Number(t.promedioAnual),
    categorias: t.categorias?.map((c) => ({ idCategoria: c.idCategoria, nombre: c.nombre })) ?? [],
    zonas: t.zonas?.map((z) => ({ idZona: z.idZona, nombre: z.nombre })) ?? [],
    ...(t.horarios
      ? {
          horarios: t.horarios.map((h) => ({
            idHorario: h.idHorario,
            diaSemana: h.diaSemana,
            horaInicio: h.horaInicio,
            horaFin: h.horaFin,
          })),
        }
      : {}),
  };
}

export function sanitizeSolicitud(s: SolicitudServicio, viewer: Usuario) {
  const esClienteDueno = s.cliente?.idUsuario === viewer.idUsuario;
  const esTrabajadorAsignado = s.trabajador?.usuario?.idUsuario === viewer.idUsuario;
  const esTrabajadorEnCurso =
    esTrabajadorAsignado &&
    (s.estado === EstadoSolicitud.APROBADO || s.estado === EstadoSolicitud.EN_PROCESO);
  const esAdmin = viewer.rol === RolUsuario.ADMIN;

  const puedeVerDireccion = esClienteDueno || esTrabajadorEnCurso || esAdmin;
  const puedeVerContactoMutuo =
    esAdmin ||
    esTrabajadorEnCurso ||
    (esClienteDueno &&
      (s.estado === EstadoSolicitud.APROBADO || s.estado === EstadoSolicitud.EN_PROCESO));

  return {
    idSolicitud: s.idSolicitud,
    descripcion: s.descripcion,
    direccionExacta: puedeVerDireccion
      ? s.direccionExacta
      : '[DIRECCIÓN RESERVADA - Visible solo al trabajador asignado en estado APROBADO o EN_PROCESO]',
    montoOfrecido: s.montoOfrecido !== null && s.montoOfrecido !== undefined ? Number(s.montoOfrecido) : null,
    estado: s.estado,
    fechaCreacion: s.fechaCreacion,
    fechaExpiracion: s.fechaExpiracion,
    fechaInicioAgendada: s.fechaInicioAgendada,
    fechaFinEstimada: s.fechaFinEstimada,
    categoria: s.categoria
      ? { idCategoria: s.categoria.idCategoria, nombre: s.categoria.nombre }
      : null,
    zona: s.zona ? { idZona: s.zona.idZona, nombre: s.zona.nombre } : null,
    fotos: s.fotos?.map((f) => ({ idFoto: f.idFoto, urlFoto: f.urlFoto, fechaCarga: f.fechaCarga })) ?? [],
    cliente: sanitizeUsuario(s.cliente, esClienteDueno || puedeVerContactoMutuo),
    trabajador: sanitizeTrabajador(s.trabajador, {
      includeContact: puedeVerContactoMutuo,
      includeQr: puedeVerContactoMutuo,
      includeAdminDocs: esAdmin,
    }),
  };
}

export function sanitizeCotizacion(c: Cotizacion) {
  return {
    idCotizacion: c.idCotizacion,
    idSolicitud: c.solicitud?.idSolicitud,
    requiereVisita: c.requiereVisita,
    costoVisita: Number(c.costoVisita),
    montoTotalPropuesto: Number(c.montoTotalPropuesto),
    incluyeMateriales: c.incluyeMateriales,
    esRecotizacion: c.esRecotizacion,
    estadoAprobacion: c.estadoAprobacion,
    fechaInicioPropuesta: c.fechaInicioPropuesta,
    duracionMin: c.duracionMin,
    trabajador: sanitizeTrabajador(c.trabajador),
  };
}

export function sanitizePago(p: TransaccionPago) {
  return {
    idPago: p.idPago,
    idSolicitud: p.solicitud?.idSolicitud,
    tipo: p.tipo,
    medioPago: p.medioPago,
    monto: Number(p.monto),
    urlComprobante: p.urlComprobante,
    conformidadCliente: p.conformidadCliente,
    confirmadoPorTrabajador: p.confirmadoPorTrabajador,
    liberadoAlTrabajador: p.liberadoAlTrabajador,
  };
}

export function sanitizeCalificacion(c: Calificacion) {
  return {
    idCalificacion: c.idCalificacion,
    idSolicitud: c.solicitud?.idSolicitud,
    puntaje: c.puntaje,
    comentario: c.comentario,
    esInterna: c.esInterna,
    fecha: c.fecha,
    evaluador: sanitizeUsuario(c.evaluador),
    evaluado: sanitizeUsuario(c.evaluado),
  };
}

export function sanitizeReclamo(r: ReclamoSancion) {
  return {
    idReclamo: r.idReclamo,
    idSolicitud: r.solicitud?.idSolicitud,
    motivo: r.motivo,
    descripcion: r.descripcion,
    urlPruebas: r.urlPruebas,
    estadoResolucion: r.estadoResolucion,
    diasSuspension: r.diasSuspension,
    denunciante: sanitizeUsuario(r.denunciante),
    denunciado: sanitizeUsuario(r.denunciado),
  };
}

export function sanitizeHistorial(h: HistorialEstado) {
  return {
    idEvento: h.idEvento,
    idSolicitud: h.solicitud?.idSolicitud,
    estadoAnterior: h.estadoAnterior,
    estadoNuevo: h.estadoNuevo,
    descripcion: h.descripcion,
    fechaHora: h.fechaHora,
    usuario: sanitizeUsuario(h.usuario),
  };
}

export function sanitizeCancelacion(c: CancelacionSolicitud) {
  return {
    idCancelacion: c.idCancelacion,
    idSolicitud: c.solicitud?.idSolicitud,
    motivo: c.motivo,
    detalle: c.detalle,
    estadoAlCancelar: c.estadoAlCancelar,
    horasAnticipacion: c.horasAnticipacion === null ? null : Number(c.horasAnticipacion),
    montoAnticipo: Number(c.montoAnticipo),
    porcentajePenalizacion: Number(c.porcentajePenalizacion),
    montoPenalizacion: Number(c.montoPenalizacion),
    montoReembolso: Number(c.montoReembolso),
    fechaCancelacion: c.fechaCancelacion,
    usuario: sanitizeUsuario(c.usuario),
  };
}
