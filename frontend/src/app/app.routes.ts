import { Routes } from '@angular/router';
import { Inicio } from './pages/inicio/inicio';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Buscar } from './pages/buscar/buscar';
import { PerfilTrabajador } from './pages/perfil-trabajador/perfil-trabajador';
import { NuevaSolicitud } from './pages/nueva-solicitud/nueva-solicitud';
import { MisPedidos } from './pages/mis-pedidos/mis-pedidos';
import { PanelTrabajador } from './pages/panel-trabajador/panel-trabajador';
import { rolGuard } from './services/rol.guard';

export const routes: Routes = [
  { path: '', component: Inicio },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'buscar', component: Buscar },
  { path: 'trabajador/:id', component: PerfilTrabajador },
  { path: 'nueva-solicitud', component: NuevaSolicitud, canActivate: [rolGuard('CLIENTE')] },
  { path: 'mis-pedidos', component: MisPedidos, canActivate: [rolGuard('CLIENTE')] },
  { path: 'panel-trabajador', component: PanelTrabajador, canActivate: [rolGuard('TRABAJADOR')] },
  // Carga diferida: el panel de admin (con Chart.js) solo se descarga cuando entra un administrador
  {
    path: 'admin',
    loadComponent: () => import('./pages/admin/admin').then((m) => m.Admin),
    canActivate: [rolGuard('ADMIN')],
  },
  { path: '**', redirectTo: '' },
];
