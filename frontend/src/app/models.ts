export type Rol = 'CLIENTE' | 'TRABAJADOR' | 'ADMIN';

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
}

export interface Opinion {
  cliente: string;
  puntaje: number;
  comentario: string;
  fecha: string;
}

export interface Trabajador {
  id: number;
  nombre: string;
  especialidades: string[];
  zonas: string[];
  experiencia: string;
  promedio: number;
  trabajosRealizados: number;
  opiniones: Opinion[];
}

export interface EventoHistorial {
  fecha: string;
  descripcion: string;
}

export interface Pedido {
  id: number;
  categoria: string;
  descripcion: string;
  zona: string;
  direccion: string;
  fecha: string;
  montoOfrecido: number;
  fotos: string[];
  estado: EstadoPedido;
  trabajador?: string;
  historial: EventoHistorial[];
}
