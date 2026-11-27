import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

// Filtros que se mandan al backend (todos opcionales)
export interface FiltrosEstadisticas {
  desde?: string; // AAAA-MM-DD
  hasta?: string; // AAAA-MM-DD
  idCategoria?: number;
  idZona?: number;
  agrupacion?: 'dia' | 'semana' | 'mes';
}

export interface Conteos {
  total: number;
  atendidas: number;
  canceladas: number;
  enCurso: number;
  pendientes: number;
  vencidas: number;
}

export interface FilaEstadistica extends Conteos {
  id: number;
  nombre: string;
  porcentajeDelTotal: number;
  porcentajeAtendidas: number;
  porcentajeCanceladas: number;
}

export interface Estadisticas {
  filtros: FiltrosEstadisticas;
  resumen: Conteos & {
    porcentajeAtendidas: number;
    porcentajeCanceladas: number;
    porcentajeEnCurso: number;
    porcentajePendientes: number;
    porcentajeVencidas: number;
    zonaMayorActividad: { id: number; nombre: string; total: number } | null;
    categoriaMasDemandada: { id: number; nombre: string; total: number } | null;
  };
  porCategoria: FilaEstadistica[];
  porZona: FilaEstadistica[];
  tendencia: (Conteos & { periodo: string })[];
}

// Llama al endpoint GET /api/v1/estadisticas/admin (solo administrador; el token lo agrega el interceptor)
@Injectable({ providedIn: 'root' })
export class EstadisticasService {
  private http = inject(HttpClient);

  obtener(filtros: FiltrosEstadisticas): Observable<Estadisticas> {
    let params = new HttpParams();
    for (const [clave, valor] of Object.entries(filtros)) {
      if (valor !== undefined && valor !== null && valor !== '')
        params = params.set(clave, String(valor));
    }
    return this.http.get<Estadisticas>(`${environment.api}/estadisticas/admin`, { params });
  }
}
