import { Injectable, signal } from '@angular/core';
import { Rol, Usuario } from '../models';

// Inicio de sesión simulado. Más adelante se reemplaza por
// POST /auth/login y se guarda el token JWT que devuelva el backend.
@Injectable({ providedIn: 'root' })
export class AuthService {
  usuario = signal<Usuario | null>(null);

  iniciarSesion(correo: string, password: string): boolean {
    if (!correo.includes('@') || password.length < 6) return false;
    const nombre = correo.split('@')[0];
    this.usuario.set({ id: 1, nombre, correo, rol: 'CLIENTE' });
    return true;
  }

  registrar(nombre: string, correo: string, rol: Rol) {
    this.usuario.set({ id: 2, nombre, correo, rol });
  }

  cerrarSesion() {
    this.usuario.set(null);
  }
}
