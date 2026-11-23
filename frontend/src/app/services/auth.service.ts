import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { inject, Injectable, signal } from '@angular/core';
import { Observable, of, tap, throwError } from 'rxjs';
import { environment } from '../../environments/environment';
import { Usuario } from '../models';

interface RespuestaAuth {
  token: string;
  usuario: Usuario;
}

export interface DatosRegistro {
  nombre: string;
  correo: string;
  telefono: string;
  password: string;
  rol: 'CLIENTE' | 'TRABAJADOR';
  ci?: string;
  especialidades?: string[];
  zonas?: string[];
}

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private api = '/api/auth';

  usuario = signal<Usuario | null>(this.usuarioGuardado());

  iniciarSesion(correo: string, password: string): Observable<RespuestaAuth> {
    if (environment.demo) {
      return this.demo(correo.split('@')[0], correo, 'CLIENTE', password).pipe(tap((r) => this.guardarSesion(r)));
    }
    return this.http
      .post<RespuestaAuth>(`${this.api}/login`, { correo, password })
      .pipe(tap((r) => this.guardarSesion(r)));
  }

  registrar(datos: DatosRegistro): Observable<RespuestaAuth> {
    if (environment.demo) {
      return this.demo(datos.nombre, datos.correo, datos.rol, datos.password).pipe(
        tap((r) => {
          if (datos.rol === 'CLIENTE') this.guardarSesion(r);
        }),
      );
    }
    return this.http.post<RespuestaAuth>(`${this.api}/registro`, datos).pipe(
      tap((r) => {
        // El trabajador queda en revisión: no inicia sesión hasta ser aprobado
        if (datos.rol === 'CLIENTE') this.guardarSesion(r);
      }),
    );
  }

  cerrarSesion() {
    try {
      localStorage.removeItem('token');
      localStorage.removeItem('usuario');
    } catch {}
    this.usuario.set(null);
  }

  // Convierte el error que devuelve NestJS en un texto para mostrar
  mensajeError(err: HttpErrorResponse): string {
    if (err.status === 0) return 'No se pudo conectar con el servidor. ¿Está corriendo el backend?';
    const m = err.error?.message;
    return Array.isArray(m) ? m.join('. ') : m ?? 'Ocurrió un error inesperado';
  }

  private guardarSesion(r: RespuestaAuth) {
    try {
      localStorage.setItem('token', r.token);
      localStorage.setItem('usuario', JSON.stringify(r.usuario));
    } catch {}
    this.usuario.set(r.usuario);
  }

  private usuarioGuardado(): Usuario | null {
    try {
      const texto = localStorage.getItem('usuario');
      return texto ? JSON.parse(texto) : null;
    } catch {
      return null;
    }
  }

  // Respuesta simulada para la versión de demostración (sin backend)
  // Cuentas de prueba de la versión demo (contraseña: 123456)
  cuentasDemo: Usuario[] = [
    { id: 1, nombre: 'María López', correo: 'cliente@demo.com', rol: 'CLIENTE', estadoCuenta: 'ACTIVO' },
    { id: 2, nombre: 'Juan Mamani', correo: 'trabajador@demo.com', rol: 'TRABAJADOR', estadoCuenta: 'ACTIVO' },
    { id: 3, nombre: 'Administrador', correo: 'admin@demo.com', rol: 'ADMIN', estadoCuenta: 'ACTIVO' },
  ];

  esDemo = environment.demo;

  // Página de inicio según el rol
  rutaInicio(): string {
    const rol = this.usuario()?.rol;
    if (rol === 'ADMIN') return '/admin';
    if (rol === 'TRABAJADOR') return '/panel-trabajador';
    return '/mis-pedidos';
  }

  // Respuesta simulada para la versión de demostración (sin backend)
  private demo(nombre: string, correo: string, rol: 'CLIENTE' | 'TRABAJADOR', password: string): Observable<RespuestaAuth> {
    if (!correo.includes('@') || password.length < 6) {
      return throwError(
        () => new HttpErrorResponse({ status: 400, error: { message: 'Correo no válido o contraseña de menos de 6 caracteres' } }),
      );
    }
    const cuenta = this.cuentasDemo.find((c) => c.correo === correo.toLowerCase());
    if (cuenta) return of({ token: 'demo', usuario: cuenta });
    const estadoCuenta = rol === 'TRABAJADOR' ? 'REVISION' : 'ACTIVO';
    return of({ token: 'demo', usuario: { id: Date.now(), nombre, correo, rol, estadoCuenta } });
  }
}
