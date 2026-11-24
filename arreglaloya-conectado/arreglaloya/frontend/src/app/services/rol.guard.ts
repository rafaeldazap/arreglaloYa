import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { Rol } from '../models';
import { AuthService } from './auth.service';

// Deja entrar a una ruta solo a los usuarios con alguno de esos roles
export function rolGuard(...roles: Rol[]): CanActivateFn {
  return () => {
    const auth = inject(AuthService);
    const usuario = auth.usuario();
    if (usuario && roles.includes(usuario.rol)) return true;
    return inject(Router).parseUrl(usuario ? auth.rutaInicio() : '/login');
  };
}
