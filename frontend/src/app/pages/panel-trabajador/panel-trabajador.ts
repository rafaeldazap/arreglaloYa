import { Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Pedido } from '../../models';
import { AuthService } from '../../services/auth.service';
import { DatosService } from '../../services/datos.service';
import { estrellas, fechaHora, nombresEstado } from '../../formato';

type Pestana = 'disponibles' | 'trabajos' | 'agenda' | 'perfil';

@Component({
  selector: 'app-panel-trabajador',
  imports: [FormsModule],
  templateUrl: './panel-trabajador.html',
  styleUrl: './panel-trabajador.css',
})
export class PanelTrabajador {
  datos = inject(DatosService);
  auth = inject(AuthService);
  fechaHora = fechaHora;
  estrellas = estrellas;
  nombres = nombresEstado;

  pestana = signal<Pestana>('disponibles');

  // El perfil del trabajador que inició sesión
  trabajador = computed(() => this.datos.trabajadorPorCorreo(this.auth.usuario()?.correo ?? ''));
  enRevision = computed(() => this.auth.usuario()?.estadoCuenta === 'REVISION' || this.trabajador()?.estado === 'REVISION');

  disponibles = computed(() => (this.trabajador() ? this.datos.pedidosDisponibles(this.trabajador()!) : []));
  cotizados = computed(() => (this.trabajador() ? this.datos.pedidosCotizados(this.trabajador()!) : []));
  trabajos = computed(() => (this.trabajador() ? this.datos.trabajosDe(this.trabajador()!) : []));
  activos = computed(() => this.trabajos().filter((p) => p.estado === 'APROBADO' || p.estado === 'EN_PROCESO'));
  terminados = computed(() => this.trabajos().filter((p) => p.estado === 'FINALIZADO' || p.estado === 'CANCELADO'));
  agenda = computed(() => (this.trabajador() ? this.datos.agendaDe(this.trabajador()!.id) : []));

  // Formulario de cotización (uno abierto a la vez)
  cotizando = signal<number | null>(null);
  error = signal('');
  requiereVisita = false;
  costoVisita = 0;
  monto: number | null = null;
  incluyeMateriales = false;
  fechaInicio = '';
  duracionHoras = 2;

  abrirCotizacion(p: Pedido) {
    this.cotizando.set(p.id);
    this.error.set('');
    this.requiereVisita = false;
    this.costoVisita = 0;
    this.monto = p.montoOfrecido || null;
    this.incluyeMateriales = false;
    this.fechaInicio = `${p.fecha}T09:00`;
    this.duracionHoras = 2;
  }

  enviarCotizacion(p: Pedido) {
    const error = this.datos.enviarCotizacion(p.id, this.trabajador()!, {
      requiereVisita: this.requiereVisita,
      costoVisita: this.requiereVisita ? this.costoVisita : 0,
      monto: this.monto ?? 0,
      incluyeMateriales: this.incluyeMateriales,
      fechaInicio: this.fechaInicio,
      duracionHoras: this.duracionHoras,
    });
    if (error) this.error.set(error);
    else this.cotizando.set(null);
  }

  miCotizacion(p: Pedido) {
    return p.cotizaciones.find((c) => c.trabajadorId === this.trabajador()?.id);
  }

  saldoPorConfirmar(p: Pedido) {
    return p.pagos.find((pg) => pg.tipo === 'SALDO_75' && !pg.confirmadoTrabajador);
  }

  horaFin(inicio: string, horas: number): string {
    const fin = new Date(new Date(inicio).getTime() + horas * 3600000);
    return fin.toLocaleTimeString('es-BO', { hour: '2-digit', minute: '2-digit', hour12: false });
  }

  // Solo se muestra el nombre y la inicial del apellido del cliente
  nombreCorto(nombre: string): string {
    const partes = nombre.split(' ');
    return partes.length > 1 ? `${partes[0]} ${partes[1].charAt(0)}.` : nombre;
  }
}
