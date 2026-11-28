// Estado de un reclamo desde el punto de vista del plazo de resolución
export enum EstadoEscalamiento {
  EN_PLAZO = 'EN_PLAZO', // sin resolver, todavía dentro del plazo
  ESCALADO = 'ESCALADO', // sin resolver y superó el plazo configurado
  RESUELTO = 'RESUELTO', // ya fue resuelto (procedente o improcedente)
}

// Tipo de decisión administrativa que queda registrada en el historial
export enum TipoDecision {
  ESCALAMIENTO_AUTOMATICO = 'ESCALAMIENTO_AUTOMATICO', // lo hace el sistema al vencer el plazo
  ESCALAMIENTO_MANUAL = 'ESCALAMIENTO_MANUAL', // lo hace un administrador
  REASIGNACION = 'REASIGNACION', // cambio de responsable
  RESOLUCION = 'RESOLUCION', // el admin resuelve el reclamo
}
