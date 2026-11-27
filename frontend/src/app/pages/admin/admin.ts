import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { DatosService } from '../../services/datos.service';
import { estrellas, nombresEstado, nombresMotivo } from '../../formato';
import { EstadisticasAdmin } from './estadisticas/estadisticas';

type Pestana = 'trabajadores' | 'catalogos' | 'reclamos' | 'estadisticas';

@Component({
  selector: 'app-admin',
  imports: [FormsModule, EstadisticasAdmin],
  templateUrl: './admin.html',
  styleUrl: './admin.css',
})
export class Admin {
  datos = inject(DatosService);
  estrellas = estrellas;
  nombres = nombresEstado;
  motivos = nombresMotivo;

  pestana = signal<Pestana>('trabajadores');
  reclamosAbiertos = computed(() =>
    this.datos.pedidosConReclamo().filter((p) => p.reclamo!.estado === 'EN_REVISION'),
  );

  // Rechazo de trabajador
  rechazando = signal<number | null>(null);
  motivoRechazo = '';

  // Catálogos
  nuevaCategoria = '';
  nuevaZona = '';
  errorCatalogo = signal('');

  // Reclamos
  resolucion: Record<number, string> = {};

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
    const texto =
      this.resolucion[pedidoId]?.trim() ||
      (procede ? 'Se sancionó al trabajador.' : 'No se encontraron pruebas suficientes.');
    this.datos.resolverReclamo(pedidoId, procede, texto);
  }

  // Ancho de una barra del reporte, en porcentaje del valor más alto
  ancho(valor: number, lista: { cantidad: number }[]): number {
    const max = Math.max(...lista.map((x) => x.cantidad), 1);
    return (valor / max) * 100;
  }
}
