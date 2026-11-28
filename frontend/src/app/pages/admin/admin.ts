import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatosService } from '../../services/datos.service';
import { estrellas, fechaHora, nombresEstado, nombresMotivo } from '../../formato';
import { Suspension, Trabajador } from '../../models';

type Pestana = 'trabajadores' | 'catalogos' | 'reclamos' | 'reportes';

@Component({
  selector: 'app-admin',
  imports: [FormsModule],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  datos = inject(DatosService);
  estrellas = estrellas;
  nombres = nombresEstado;
  motivos = nombresMotivo;

  pestana = signal<Pestana>('trabajadores');
  reclamosAbiertos = computed(() => this.datos.pedidosConReclamo().filter((p) => p.reclamo!.estado === 'EN_REVISION'));

  // Rechazo de trabajador
  rechazando = signal<number | null>(null);
  motivoRechazo = '';

  // Catálogos
  nuevaCategoria = '';
  nuevaZona = '';
  errorCatalogo = signal('');

  // Reclamos
  resolucion: Record<number, string> = {};

  // Suspensión de trabajador (RF-17)
  fechaHora = fechaHora;
  suspendiendo = signal<Trabajador | null>(null);
  motivoSuspension = '';
  diasSuspension = 7;
  errorSuspension = signal('');

  // Historial de suspensiones (RF-17)
  viendoHistorial = signal<Trabajador | null>(null);
  historialSuspensiones = signal<Suspension[]>([]);
  cargandoHistorial = signal(false);

  abrirSuspender(t: Trabajador) {
    this.suspendiendo.set(t);
    this.motivoSuspension = '';
    this.diasSuspension = 7;
    this.errorSuspension.set('');
  }

  cancelarSuspender() {
    this.suspendiendo.set(null);
    this.motivoSuspension = '';
    this.errorSuspension.set('');
  }

  async confirmarSuspender() {
    const t = this.suspendiendo();
    if (!t) return;
    if (!this.motivoSuspension.trim()) {
      this.errorSuspension.set('Debe ingresar un motivo para la suspensión.');
      return;
    }
    if (!this.diasSuspension || this.diasSuspension < 1) {
      this.errorSuspension.set('El periodo de suspensión debe ser de al menos 1 día.');
      return;
    }

    const err = await this.datos.suspenderTrabajador(t.id, this.motivoSuspension.trim(), this.diasSuspension);
    if (err) {
      this.errorSuspension.set(err);
    } else {
      this.cancelarSuspender();
    }
  }

  async levantarSuspension(t: Trabajador) {
    if (!confirm(`¿Estás seguro de levantar la suspensión y reactivar a ${t.nombre}?`)) return;
    await this.datos.levantarSuspensionTrabajador(t.id, 'Levantamiento anticipado por el administrador');
  }

  async abrirHistorial(t: Trabajador) {
    this.viendoHistorial.set(t);
    this.cargandoHistorial.set(true);
    const resp = await this.datos.consultarSuspensionesTrabajador(t.id);
    this.historialSuspensiones.set(resp.historial || []);
    this.cargandoHistorial.set(false);
  }

  cerrarHistorial() {
    this.viendoHistorial.set(null);
    this.historialSuspensiones.set([]);
  }

  async rechazar(id: number) {
    if (!this.motivoRechazo.trim()) return;
    await this.datos.rechazarTrabajador(id, this.motivoRechazo.trim());
    this.rechazando.set(null);
    this.motivoRechazo = '';
  }

  async agregar(tipo: 'categoria' | 'zona') {
    const nombre = tipo === 'categoria' ? this.nuevaCategoria : this.nuevaZona;
    const error = await this.datos.agregarCatalogo(tipo, nombre);
    this.errorCatalogo.set(error ?? '');
    if (!error) {
      if (tipo === 'categoria') this.nuevaCategoria = '';
      else this.nuevaZona = '';
    }
  }

  resolver(pedidoId: number, procede: boolean) {
    const texto = this.resolucion[pedidoId]?.trim() || (procede ? 'Se sancionó al trabajador.' : 'No se encontraron pruebas suficientes.');
    this.datos.resolverReclamo(pedidoId, procede, texto);
  }

  // Ancho de una barra del reporte, en porcentaje del valor más alto
  ancho(valor: number, lista: { cantidad: number }[]): number {
    const max = Math.max(...lista.map((x) => x.cantidad), 1);
    return (valor / max) * 100;
  }
}
