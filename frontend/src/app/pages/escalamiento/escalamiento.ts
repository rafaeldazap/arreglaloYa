import { HttpErrorResponse } from '@angular/common/http';
import { Component, inject, OnInit, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../services/auth.service';
import {
  ConfiguracionPlazo,
  EscalamientoService,
  EventoDecision,
  FilaReclamo,
  PersonaApi,
  ResumenEscalamiento,
} from '../../services/escalamiento.service';
import { fechaHora, nombresMotivo } from '../../formato';

@Component({
  selector: 'app-escalamiento',
  imports: [FormsModule],
  templateUrl: './escalamiento.html',
  styleUrl: './escalamiento.css',
})
export class Escalamiento implements OnInit {
  private api = inject(EscalamientoService);
  private auth = inject(AuthService);

  fechaHora = fechaHora;
  motivos = nombresMotivo;

  cargando = signal(false);
  error = signal('');
  aviso = signal('');

  config = signal<ConfiguracionPlazo | null>(null);
  resumen = signal<ResumenEscalamiento | null>(null);
  filas = signal<FilaReclamo[]>([]);
  admins = signal<PersonaApi[]>([]);
  pagina = signal(1);
  totalPaginas = signal(1);
  total = signal(0);

  // Filtros
  filtroEstado = '';
  filtroResponsable = '';

  // Plazo editable (en minutos)
  // Plazo editable, separado en días, horas y minutos
  dias = 3;
  horas = 0;
  minutos = 0;

  get plazoTotal(): number {
    return (Number(this.dias) || 0) * 1440 + (Number(this.horas) || 0) * 60 + (Number(this.minutos) || 0);
  }

  private cargarPlazoEditable(total: number) {
    this.dias = Math.floor(total / 1440);
    this.horas = Math.floor((total % 1440) / 60);
    this.minutos = total % 60;
  }

  // Reclamo seleccionado para gestionar
  seleccionado = signal<FilaReclamo | null>(null);
  eventos = signal<EventoDecision[]>([]);

  // Formularios del reclamo seleccionado
  idResponsableNuevo: number | null = null;
  motivoReasignar = '';
  motivoEscalar = '';
  resolucion: 'PROCEDENTE' | 'IMPROCEDENTE' = 'PROCEDENTE';
  comentarioResolver = '';

  ngOnInit() {
    this.cargarTodo();
  }

  // Convierte minutos a texto: 4320 -> "3 días", 90 -> "1 h 30 min"
  describir(total: number): string {
    const min = Math.max(0, Math.round(total));
    const dias = Math.floor(min / 1440);
    const horas = Math.floor((min % 1440) / 60);
    const resto = min % 60;
    const partes: string[] = [];
    if (dias) partes.push(`${dias} ${dias === 1 ? 'día' : 'días'}`);
    if (horas) partes.push(`${horas} h`);
    if (resto || partes.length === 0) partes.push(`${resto} min`);
    return partes.join(' ');
  }

  // Texto del tiempo que falta (o que pasó) respecto al plazo
  textoPlazo(f: FilaReclamo): string {
    if (f.minutosRestantes === null) return '—';
    return f.minutosRestantes >= 0
      ? `Faltan ${this.describir(f.minutosRestantes)}`
      : `Vencido hace ${this.describir(-f.minutosRestantes)}`;
  }

  nombreEstado(e: string): string {
    return e === 'ESCALADO' ? 'Escalado' : e === 'EN_PLAZO' ? 'En plazo' : 'Resuelto';
  }

  nombreTipo(t: string): string {
    const nombres: Record<string, string> = {
      ESCALAMIENTO_AUTOMATICO: 'Escalamiento automático',
      ESCALAMIENTO_MANUAL: 'Escalamiento manual',
      REASIGNACION: 'Reasignación',
      RESOLUCION: 'Resolución',
    };
    return nombres[t] ?? t;
  }

  // Ejecuta una acción, muestra el aviso o el error y recarga la pantalla
  private async ejecutar(accion: () => Promise<unknown>, mensajeOk: string): Promise<boolean> {
    this.error.set('');
    this.aviso.set('');
    try {
      await accion();
      this.aviso.set(mensajeOk);
      return true;
    } catch (e) {
      const err = e as HttpErrorResponse;
      if (err.status === 401) this.auth.cerrarSesion();
      this.error.set(this.auth.mensajeError(err));
      return false;
    }
  }

  async cargarTodo() {
    this.cargando.set(true);
    this.error.set('');
    try {
      const [config, admins] = await Promise.all([this.api.configuracion(), this.api.administradores()]);
      this.config.set(config);
           this.cargarPlazoEditable(config.plazoMinutos);
      this.admins.set(admins);
      await this.cargarLista();
    } catch (e) {
      this.error.set(this.auth.mensajeError(e as HttpErrorResponse));
    } finally {
      this.cargando.set(false);
    }
  }

  // El backend verifica los vencidos antes de responder, por eso el resumen siempre está al día
  async cargarLista() {
    try {
      const pagina = await this.api.reclamos({
        estado: this.filtroEstado,
        responsable: this.filtroResponsable,
        page: this.pagina(),
        limit: 8,
      });
      this.filas.set(pagina.data);
      this.total.set(pagina.total);
      this.totalPaginas.set(pagina.totalPages);
      this.resumen.set(await this.api.resumen());

      // Mantiene actualizado el reclamo abierto en el panel de gestión
      const sel = this.seleccionado();
      if (sel) await this.abrir(sel.idReclamo);
    } catch (e) {
      this.error.set(this.auth.mensajeError(e as HttpErrorResponse));
    }
  }

  aplicarFiltros() {
    this.pagina.set(1);
    this.cargarLista();
  }

  cambiarPagina(delta: number) {
    const nueva = this.pagina() + delta;
    if (nueva < 1 || nueva > this.totalPaginas()) return;
    this.pagina.set(nueva);
    this.cargarLista();
  }

  async guardarPlazo() {
    const ok = await this.ejecutar(async () => {
           const r = await this.api.guardarPlazo(this.plazoTotal);
      this.config.set(r.configuracion);
      this.cargarPlazoEditable(r.configuracion.plazoMinutos);
    }, 'Plazo actualizado');
    if (ok) await this.cargarLista();
  }

  async verificarAhora() {
    let escalados = 0;
    const ok = await this.ejecutar(async () => {
      escalados = (await this.api.verificar()).escalados.length;
    }, '');
    if (ok) {
      this.aviso.set(escalados ? `Se escalaron ${escalados} reclamo(s) vencido(s)` : 'No hay reclamos nuevos para escalar');
      await this.cargarLista();
    }
  }

  async abrir(idReclamo: number) {
    try {
      const h = await this.api.historial(idReclamo);
      this.seleccionado.set(h.reclamo);
      this.eventos.set(h.eventos);
    } catch (e) {
      this.error.set(this.auth.mensajeError(e as HttpErrorResponse));
    }
  }

  seleccionar(f: FilaReclamo) {
    this.idResponsableNuevo = null;
    this.motivoReasignar = '';
    this.motivoEscalar = '';
    this.comentarioResolver = '';
    this.resolucion = 'PROCEDENTE';
    this.error.set('');
    this.aviso.set('');
    this.abrir(f.idReclamo);
  }

  cerrarPanel() {
    this.seleccionado.set(null);
    this.eventos.set([]);
  }

  async reasignar() {
    const sel = this.seleccionado();
    if (!sel || this.idResponsableNuevo === null) return;
    const ok = await this.ejecutar(
      () => this.api.reasignar(sel.idReclamo, this.idResponsableNuevo!, this.motivoReasignar.trim()),
      'Reclamo reasignado',
    );
    if (ok) {
      this.idResponsableNuevo = null;
      this.motivoReasignar = '';
      await this.cargarLista();
    }
  }

  async escalar() {
    const sel = this.seleccionado();
    if (!sel) return;
    const ok = await this.ejecutar(() => this.api.escalar(sel.idReclamo, this.motivoEscalar.trim()), 'Reclamo escalado');
    if (ok) {
      this.motivoEscalar = '';
      await this.cargarLista();
    }
  }

  async resolver() {
    const sel = this.seleccionado();
    if (!sel) return;
    const ok = await this.ejecutar(
      () => this.api.resolver(sel.idReclamo, this.resolucion, this.comentarioResolver),
      `Reclamo resuelto como ${this.resolucion}`,
    );
    if (ok) {
      this.comentarioResolver = '';
      await this.cargarLista();
    }
  }
}
