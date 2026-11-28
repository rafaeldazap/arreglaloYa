import { Routes } from '@angular/router';
import { Inicio } from './pages/inicio/inicio';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Buscar } from './pages/buscar/buscar';
import { PerfilTrabajador } from './pages/perfil-trabajador/perfil-trabajador';
import { NuevaSolicitud } from './pages/nueva-solicitud/nueva-solicitud';
import { MisPedidos } from './pages/mis-pedidos/mis-pedidos';
import { PanelTrabajador } from './pages/panel-trabajador/panel-trabajador';
import { Admin } from './pages/admin/admin';
import { Escalamiento } from './pages/escalamiento/escalamiento';
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
  { path: 'admin', component: Admin, canActivate: [rolGuard('ADMIN')] },
  { path: 'admin/escalamiento', component: Escalamiento, canActivate: [rolGuard('ADMIN')] },
  { path: '**', redirectTo: '' },
];
