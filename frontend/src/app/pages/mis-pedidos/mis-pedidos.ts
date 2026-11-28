import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { EstadoPedido, MotivoCancelacion, MotivoReclamo, Pago, Pedido, PrevisualizacionCancelacion } from '../../models';
import { AuthService } from '../../services/auth.service';
import { DatosService } from '../../services/datos.service';
import { estrellas, fechaHora, nombresEstado, nombresMotivo, nombresMotivoCancelacion } from '../../formato';

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

  // Cancelación en 2 pasos: (a) motivo y detalle, (b) consecuencias y confirmación
  motivosCancelacion = nombresMotivoCancelacion;
  listaMotivosCancelacion = Object.keys(nombresMotivoCancelacion) as MotivoCancelacion[];
  readonly maxDetalle = 255;
  motivoCancelacion: MotivoCancelacion = 'CAMBIO_DE_PLANES';
  detalleCancelacion = '';
  previsualizacion = signal<PrevisualizacionCancelacion | null>(null);
  cargandoCancelacion = signal(false);

  abrir(p: Panel) {
    this.error.set('');
    this.previsualizacion.set(null);
    this.panel.set(p);
  }

  abrirCancelacion(p: Pedido) {
    this.motivoCancelacion = 'CAMBIO_DE_PLANES';
    this.detalleCancelacion = '';
    this.abrir({ pedido: p.id, tipo: 'cancelar' });
  }

  pasoCompletado(pedido: Pedido, paso: EstadoPedido): boolean {
    return this.pasos.indexOf(paso) <= this.pasos.indexOf(pedido.estado);
  }

  puedeCancelar(p: Pedido): boolean {
    return p.estado === 'PENDIENTE' || p.estado === 'BAJO_REVISION' || p.estado === 'APROBADO';
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

  async pagarYAceptar(p: Pedido, cotizacionId: number) {
    const error = await this.datos.aceptarCotizacion(p.id, cotizacionId);
    if (error) this.error.set(error);
    else this.panel.set(null);
  }

  // Paso (a) -> (b): valida el detalle y pide al backend las consecuencias
  async verConsecuencias(p: Pedido) {
    this.error.set('');
    if (this.motivoCancelacion === 'OTRO' && this.detalleCancelacion.trim().length < 10) {
      this.error.set('Si eliges "Otro", explica el motivo con al menos 10 caracteres.');
      return;
    }
    this.cargandoCancelacion.set(true);
    const r = await this.datos.previsualizarCancelacion(p.id);
    this.cargandoCancelacion.set(false);
    if (r.error) this.error.set(r.error);
    else this.previsualizacion.set(r.datos);
  }

  // Paso (b) -> (a): vuelve a elegir el motivo sin perder lo escrito
  volverAlMotivo() {
    this.error.set('');
    this.previsualizacion.set(null);
  }

  async cancelar(p: Pedido) {
    if (!this.previsualizacion()?.puedeCancelar) return;
    this.error.set('');
    this.cargandoCancelacion.set(true);
    const error = await this.datos.cancelarPedido(p.id, this.motivoCancelacion, this.detalleCancelacion);
    this.cargandoCancelacion.set(false);
    if (error) {
      this.error.set(error);
      return;
    }
    this.abrir(null);
  }

  firmarConformidad(p: Pedido) {
    this.datos.confirmarConformidad(p.id, this.medioPago);
  }

  async calificar(p: Pedido) {
    if (this.puntaje() === 0) {
      this.error.set('Elige de 1 a 5 estrellas.');
      return;
    }
    await this.datos.calificar(p.id, this.puntaje(), this.comentario.trim());
    this.puntaje.set(0);
    this.comentario = '';
    this.error.set('');
  }

  async enviarReclamo(p: Pedido) {
    if (this.descripcionReclamo.trim().length < 10) {
      this.error.set('Describe el problema con al menos 10 caracteres.');
      return;
    }
    const error = await this.datos.reclamar(p.id, this.motivo, this.descripcionReclamo.trim());
    if (error) return;
    this.descripcionReclamo = '';
    this.panel.set(null);
  }
}
