import { HttpInterceptorFn } from '@angular/common/http';

// Agrega el token JWT a todas las peticiones que van a la API
export const tokenInterceptor: HttpInterceptorFn = (req, next) => {
  let token: string | null = null;
  try {
    token = localStorage.getItem('token');
  } catch {}
  if (token) {
    req = req.clone({ setHeaders: { Authorization: `Bearer ${token}` } });
  }
  return next(req);
};
