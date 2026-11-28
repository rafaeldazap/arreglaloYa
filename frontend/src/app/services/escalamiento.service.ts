import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { environment } from '../../environments/environment';

// Servicio de la pantalla "Escalamiento de reclamos" (solo administrador).
// Llama a los endpoints /api/v1/escalamiento/... del backend.

export type EstadoEscalamiento = 'EN_PLAZO' | 'ESCALADO' | 'RESUELTO';

export interface PersonaApi {
  idUsuario: number;
  nombreCompleto: string;
}

export interface FilaReclamo {
  idReclamo: number;
  idSolicitud: number | null;
  motivo: string;
  descripcion: string | null;
  estadoResolucion: 'EN_REVISION' | 'PROCEDENTE' | 'IMPROCEDENTE';
  estadoEscalamiento: EstadoEscalamiento;
  fechaCreacion: string;
  fechaLimite: string;
  minutosRestantes: number | null;
  escalado: boolean;
  fechaEscalamiento: string | null;
  denunciante: PersonaApi | null;
  denunciado: PersonaApi | null;
  responsable: PersonaApi | null;
}

export interface PaginaReclamos {
  plazoMinutos: number;
  data: FilaReclamo[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ResumenEscalamiento {
  plazoMinutos: number;
  total: number;
  enPlazo: number;
  escalados: number;
  resueltos: number;
  abiertosSinResponsable: number;
}

export interface ConfiguracionPlazo {
  plazoMinutos: number;
  descripcion: string;
  actualizadoPor: PersonaApi | null;
  fechaActualizacion: string;
}

export interface EventoDecision {
  idDecision: number;
  tipo: 'ESCALAMIENTO_AUTOMATICO' | 'ESCALAMIENTO_MANUAL' | 'REASIGNACION' | 'RESOLUCION';
  detalle: string;
  fecha: string;
  administrador: PersonaApi | null; // null = lo hizo el sistema
  responsableAnterior: PersonaApi | null;
  responsableNuevo: PersonaApi | null;
}

export interface HistorialReclamo {
  reclamo: FilaReclamo;
  eventos: EventoDecision[];
}

export interface FiltrosReclamos {
  estado: string;
  responsable: string;
  page: number;
  limit: number;
}

@Injectable({ providedIn: 'root' })
export class EscalamientoService {
  private http = inject(HttpClient);
  private base = `${environment.api}/escalamiento`;

  configuracion() {
    return firstValueFrom(this.http.get<ConfiguracionPlazo>(`${this.base}/configuracion`));
  }

  guardarPlazo(plazoMinutos: number) {
    return firstValueFrom(
      this.http.put<{ mensaje: string; configuracion: ConfiguracionPlazo; escaladosAhora: number[] }>(
        `${this.base}/configuracion`,
        { plazoMinutos },
      ),
    );
  }

  resumen() {
    return firstValueFrom(this.http.get<ResumenEscalamiento>(`${this.base}/resumen`));
  }

  reclamos(f: FiltrosReclamos) {
    const params: Record<string, string> = { page: String(f.page), limit: String(f.limit) };
    if (f.estado) params['estado'] = f.estado;
    if (f.responsable) params['responsable'] = f.responsable;
    return firstValueFrom(this.http.get<PaginaReclamos>(`${this.base}/reclamos`, { params }));
  }

  administradores() {
    return firstValueFrom(this.http.get<PersonaApi[]>(`${this.base}/administradores`));
  }

  verificar() {
    return firstValueFrom(this.http.post<{ plazoMinutos: number; escalados: number[] }>(`${this.base}/verificar`, {}));
  }

  historial(idReclamo: number) {
    return firstValueFrom(this.http.get<HistorialReclamo>(`${this.base}/reclamos/${idReclamo}/historial`));
  }

  reasignar(idReclamo: number, idResponsable: number, motivo: string) {
    return firstValueFrom(this.http.patch(`${this.base}/reclamos/${idReclamo}/reasignar`, { idResponsable, motivo }));
  }

  escalar(idReclamo: number, motivo: string) {
    return firstValueFrom(this.http.patch(`${this.base}/reclamos/${idReclamo}/escalar`, { motivo }));
  }

  resolver(idReclamo: number, resolucion: 'PROCEDENTE' | 'IMPROCEDENTE', comentario: string) {
    const cuerpo: { resolucion: string; comentario?: string } = { resolucion };
    if (comentario.trim()) cuerpo.comentario = comentario.trim();
    return firstValueFrom(this.http.patch(`${this.base}/reclamos/${idReclamo}/resolver`, cuerpo));
  }
}
