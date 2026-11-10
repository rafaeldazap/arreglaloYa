import { Routes } from '@angular/router';
import { Inicio } from './pages/inicio/inicio';
import { Login } from './pages/login/login';
import { Registro } from './pages/registro/registro';
import { Buscar } from './pages/buscar/buscar';
import { PerfilTrabajador } from './pages/perfil-trabajador/perfil-trabajador';
import { NuevaSolicitud } from './pages/nueva-solicitud/nueva-solicitud';
import { MisPedidos } from './pages/mis-pedidos/mis-pedidos';

export const routes: Routes = [
  { path: '', component: Inicio },
  { path: 'login', component: Login },
  { path: 'registro', component: Registro },
  { path: 'buscar', component: Buscar },
  { path: 'trabajador/:id', component: PerfilTrabajador },
  { path: 'nueva-solicitud', component: NuevaSolicitud },
  { path: 'mis-pedidos', component: MisPedidos },
  { path: '**', redirectTo: '' },
];
