import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EstadoPedido, MotivoReclamo, Pago, Pedido } from '../../models';
import { AuthService } from '../../services/auth.service';
import { DatosService } from '../../services/datos.service';
import { estrellas, fechaHora, nombresEstado, nombresMotivo } from '../../formato';

// Qué panel está abierto en cada pedido (solo uno a la vez)
type Panel = { pedido: number; tipo: 'pagar' | 'cancelar' | 'reclamo'; cotizacion?: number } | null;

@Component({
  selector: 'app-mis-pedidos',
  imports: [FormsModule, RouterLink],
  templateUrl: './mis-pedidos.html',
  styleUrl: './mis-pedidos.css',
})
export class MisPedidos {
  datos = inject(DatosService);
  auth = inject(AuthService);
  fechaHora = fechaHora;
  estrellas = estrellas;
  nombres = nombresEstado;
  motivos = nombresMotivo;
  pasos: EstadoPedido[] = ['PENDIENTE', 'APROBADO', 'EN_PROCESO', 'FINALIZADO'];

  misPedidos = computed(() => this.datos.pedidos().filter((p) => p.cliente === this.auth.usuario()?.nombre));

  panel = signal<Panel>(null);
  error = signal('');

  medioPago: Pago['medio'] = 'EFECTIVO';
  puntaje = signal(0);
  comentario = '';
  motivo: MotivoReclamo = 'MAL_ARREGLO';
  descripcionReclamo = '';

  abrir(p: Panel) {
    this.error.set('');
    this.panel.set(p);
  }

  pasoCompletado(pedido: Pedido, paso: EstadoPedido): boolean {
    return this.pasos.indexOf(paso) <= this.pasos.indexOf(pedido.estado);
  }

  puedeCancelar(p: Pedido): boolean {
    return p.estado === 'PENDIENTE' || p.estado === 'APROBADO';
  }

  puedeReclamar(p: Pedido): boolean {
    return !p.reclamo && (p.estado === 'APROBADO' || p.estado === 'EN_PROCESO' || p.estado === 'FINALIZADO');
  }

  cotizacionesPendientes(p: Pedido) {
    return p.cotizaciones.filter((c) => c.estado === 'PENDIENTE');
  }

  saldoDeclarado(p: Pedido): Pago | undefined {
    return p.pagos.find((pg) => pg.tipo === 'SALDO_75');
  }

  pagarYAceptar(p: Pedido, cotizacionId: number) {
    const error = this.datos.aceptarCotizacion(p.id, cotizacionId);
    if (error) this.error.set(error);
    else this.panel.set(null);
  }

  cancelar(p: Pedido) {
    this.datos.cancelarPedido(p.id);
    this.panel.set(null);
  }

  firmarConformidad(p: Pedido) {
    this.datos.confirmarConformidad(p.id, this.medioPago);
  }

  calificar(p: Pedido) {
    if (this.puntaje() === 0) {
      this.error.set('Elige de 1 a 5 estrellas.');
      return;
    }
    this.datos.calificar(p.id, this.puntaje(), this.comentario.trim());
    this.puntaje.set(0);
    this.comentario = '';
    this.error.set('');
  }

  enviarReclamo(p: Pedido) {
    if (this.descripcionReclamo.trim().length < 10) {
      this.error.set('Describe el problema con al menos 10 caracteres.');
      return;
    }
    this.datos.reclamar(p.id, this.motivo, this.descripcionReclamo.trim());
    this.descripcionReclamo = '';
    this.panel.set(null);
  }
}
