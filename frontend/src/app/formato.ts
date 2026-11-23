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
  APROBADO: 'Aprobado',
  EN_PROCESO: 'En proceso',
  FINALIZADO: 'Finalizado',
  CANCELADO: 'Cancelado',
  FUERA_DE_TIEMPO: 'Fuera de tiempo',
};

export const nombresMotivo: Record<string, string> = {
  INASISTENCIA: 'El trabajador no llegó',
  MAL_ARREGLO: 'El arreglo quedó mal',
  INCUMPLIMIENTO_PAGO: 'Problema con el pago',
  ROBO: 'Robo o daño a la propiedad',
};
