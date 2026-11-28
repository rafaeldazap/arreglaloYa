import { MotivoCancelacion } from './models';

// Funciones pequeñas para mostrar fechas y estrellas en las pantallas
export function fechaHora(valor: string): string {
  return new Date(valor).toLocaleString('es-BO', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit', hour12: false });
}

export function estrellas(n: number): string {
  const r = Math.round(n);
  return '★'.repeat(r) + '☆'.repeat(5 - r);
}

export const nombresEstado: Record<string, string> = {
  PENDIENTE: 'Pendiente',
  BAJO_REVISION: 'Bajo revisión',
  APROBADO: 'Aprobado',
  EN_PROCESO: 'En proceso',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
  FUERA_DE_TIEMPO: 'Fuera de tiempo',
};

export const nombresMotivoCancelacion: Record<MotivoCancelacion, string> = {
  CAMBIO_DE_PLANES: 'Cambié de planes',
  ENCONTRE_OTRO_TRABAJADOR: 'Encontré otro trabajador',
  PRECIO_ELEVADO: 'El precio es muy alto',
  PROBLEMA_RESUELTO: 'El problema ya se resolvió',
  DEMORA_DEL_TRABAJADOR: 'El trabajador está demorando',
  OTRO: 'Otro',
};

export const nombresMotivo: Record<string, string> = {
  INASISTENCIA: 'El trabajador no llegó',
  MAL_ARREGLO: 'El arreglo quedó mal',
  INCUMPLIMIENTO_PAGO: 'Problema con el pago',
  ROBO: 'Robo o daño a la propiedad',
};
