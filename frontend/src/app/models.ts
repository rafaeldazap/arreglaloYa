export type Rol = 'CLIENTE' | 'TRABAJADOR' | 'ADMIN';

export type EstadoCuenta = 'REVISION' | 'ACTIVO' | 'SUSPENDIDO' | 'BLOQUEADO_PERMANENTE';

export type EstadoPedido =
  | 'PENDIENTE'
  | 'APROBADO'
  | 'EN_PROCESO'
  | 'FINALIZADO'
  | 'CANCELADO'
  | 'FUERA_DE_TIEMPO';

export interface Usuario {
  id: number;
  nombre: string;
  correo: string;
  rol: Rol;
  estadoCuenta: EstadoCuenta;
}

export interface Catalogo {
  id?: number; // id en la base de datos (versiÃ³n con backend)
  nombre: string;
  activa: boolean;
}

export interface Opinion {
  cliente: string;
  puntaje: number;
  comentario: string;
  fecha: string;
}

export interface Trabajador {
  id: number; // id del perfil de trabajador
  idUsuario?: number;
  nombre: string;
  correo: string;
  ci: string;
  especialidades: string[];
  zonas: string[];
  experiencia: string;
  estado: EstadoCuenta;
  documentos: string[];
  motivoRechazo?: string;
  promedio: number;
  trabajosRealizados: number;
  opiniones: Opinion[];
}

export interface Cotizacion {
  id: number;
  trabajadorId: number;
  trabajador: string;
  requiereVisita: boolean;
  costoVisita: number;
  monto: number;
  incluyeMateriales: boolean;
  fechaInicio: string;
  duracionHoras: number;
  estado: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
}

export interface Pago {
  id?: number;
  tipo: 'ANTICIPO_25' | 'SALDO_75' | 'PARCIAL';
  medio: 'PASARELA_APP' | 'EFECTIVO' | 'QR_TRABAJADOR';
  monto: number;
  confirmadoCliente: boolean;
  confirmadoTrabajador: boolean;
}

export interface Calificacion {
  puntaje: number;
  comentario: string;
  fecha: string;
}

export type MotivoReclamo = 'INASISTENCIA' | 'MAL_ARREGLO' | 'INCUMPLIMIENTO_PAGO' | 'ROBO';

export interface Reclamo {
  id?: number;
  pedidoId: number;
  motivo: MotivoReclamo;
  descripcion: string;
  fecha: string;
  estado: 'EN_REVISION' | 'PROCEDENTE' | 'IMPROCEDENTE';
  resolucion?: string;
}

export interface EventoHistorial {
  fecha: string;
  descripcion: string;
}

export interface Pedido {
  id: number;
  cliente: string;
  categoria: string;
  descripcion: string;
  zona: string;
  direccion: string;
  fecha: string;
  montoOfrecido: number;
  fotos: string[];
  estado: EstadoPedido;
  trabajadorId?: number;
  trabajador?: string;
  cotizaciones: Cotizacion[];
  pagos: Pago[];
  trabajoTerminado: boolean;
  calificacion?: Calificacion;
  reclamo?: Reclamo;
  historial: EventoHistorial[];
}

