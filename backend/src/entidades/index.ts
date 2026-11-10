import { Usuario } from './usuario.entity.js';
import { PerfilTrabajador } from './perfil-trabajador.entity.js';
import { Categoria } from './categoria.entity.js';
import { Zona } from './zona.entity.js';
import { HorarioAtencion } from './horario-atencion.entity.js';
import { SolicitudServicio } from './solicitud-servicio.entity.js';
import { FotoSolicitud } from './foto-solicitud.entity.js';
import { Cotizacion } from './cotizacion.entity.js';
import { TransaccionPago } from './transaccion-pago.entity.js';
import { ReclamoSancion } from './reclamo-sancion.entity.js';
import { Calificacion } from './calificacion.entity.js';
import { HistorialEstado } from './historial-estado.entity.js';

export const entidades = [
  Usuario,
  PerfilTrabajador,
  Categoria,
  Zona,
  HorarioAtencion,
  SolicitudServicio,
  FotoSolicitud,
  Cotizacion,
  TransaccionPago,
  ReclamoSancion,
  Calificacion,
  HistorialEstado,
];
