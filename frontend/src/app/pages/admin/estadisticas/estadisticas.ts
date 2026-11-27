import {
  Component,
  computed,
  effect,
  ElementRef,
  inject,
  OnDestroy,
  signal,
  viewChild,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { HttpErrorResponse } from '@angular/common/http';
import { Chart, ChartConfiguration, registerables } from 'chart.js';
import { AuthService } from '../../../services/auth.service';
import { DatosService } from '../../../services/datos.service';
import {
  Estadisticas,
  EstadisticasService,
  FiltrosEstadisticas,
} from '../../../services/estadisticas.service';

Chart.register(...registerables);

// Colores de cada grupo de estados (los mismos en todos los gráficos)
const COLORES = {
  atendidas: '#2a9d8f',
  canceladas: '#d64545',
  enCurso: '#1d3557',
  pendientes: '#f4a261',
  vencidas: '#9ca3af',
};

// Fecha local en formato AAAA-MM-DD (para los <input type="date">)
function fechaLocal(d: Date): string {
  return new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);
}

@Component({
  selector: 'app-estadisticas-admin',
  imports: [FormsModule],
  templateUrl: './estadisticas.html',
  styleUrl: './estadisticas.css',
})
export class EstadisticasAdmin implements OnDestroy {
  private api = inject(EstadisticasService);
  private auth = inject(AuthService);
  datos = inject(DatosService);

  // Filtros elegidos por el administrador
  desde = signal('');
  hasta = signal('');
  idCategoria = signal<number | null>(null);
  idZona = signal<number | null>(null);
  agrupacion = signal<'dia' | 'semana' | 'mes'>('semana');
  rapido = signal<number | null>(null); // atajo de días seleccionado (7, 30, 90) o null

  cargando = signal(false);
  error = signal('');
  resultado = signal<Estadisticas | null>(null);

  // Nombre de la categoría / zona filtrada (para mostrarlo en las etiquetas de filtros activos)
  nombreCategoria = computed(
    () => this.datos.todasCategorias().find((c) => c.id === this.idCategoria())?.nombre,
  );
  nombreZona = computed(() => this.datos.todasZonas().find((z) => z.id === this.idZona())?.nombre);
  hayFiltros = computed(
    () => !!(this.desde() || this.hasta() || this.idCategoria() || this.idZona()),
  );

  // Lienzos de los 4 gráficos
  private lienzoEstados = viewChild<ElementRef<HTMLCanvasElement>>('graficoEstados');
  private lienzoCategorias = viewChild<ElementRef<HTMLCanvasElement>>('graficoCategorias');
  private lienzoZonas = viewChild<ElementRef<HTMLCanvasElement>>('graficoZonas');
  private lienzoTendencia = viewChild<ElementRef<HTMLCanvasElement>>('graficoTendencia');
  private graficos: Chart[] = [];

  constructor() {
    // Cada vez que cambia un filtro se vuelve a pedir al backend
    effect(() => {
      const filtros: FiltrosEstadisticas = {
        desde: this.desde() || undefined,
        hasta: this.hasta() || undefined,
        idCategoria: this.idCategoria() ?? undefined,
        idZona: this.idZona() ?? undefined,
        agrupacion: this.agrupacion(),
      };
      this.cargar(filtros);
    });

    // Cuando llegan datos nuevos (y los lienzos ya existen) se vuelven a dibujar los gráficos
    effect(() => {
      const r = this.resultado();
      const lienzos = [
        this.lienzoEstados(),
        this.lienzoCategorias(),
        this.lienzoZonas(),
        this.lienzoTendencia(),
      ];
      if (r && lienzos.every(Boolean)) this.dibujar(r);
    });
  }

  private cargar(filtros: FiltrosEstadisticas) {
    // Validación en el frontend: no se pide nada si el rango está al revés
    if (filtros.desde && filtros.hasta && filtros.desde > filtros.hasta) {
      this.error.set('La fecha "desde" no puede ser posterior a la fecha "hasta".');
      return;
    }
    this.cargando.set(true);
    this.error.set('');
    this.api.obtener(filtros).subscribe({
      next: (r) => {
        this.resultado.set(r);
        this.cargando.set(false);
      },
      error: (e: HttpErrorResponse) => {
        this.error.set(this.auth.mensajeError(e));
        this.cargando.set(false);
      },
    });
  }

  // ---------- Filtros ----------

  ultimosDias(dias: number) {
    const hoy = new Date();
    const inicio = new Date();
    inicio.setDate(hoy.getDate() - (dias - 1));
    this.desde.set(fechaLocal(inicio));
    this.hasta.set(fechaLocal(hoy));
    this.rapido.set(dias);
  }

  cambiarFecha(campo: 'desde' | 'hasta', valor: string) {
    (campo === 'desde' ? this.desde : this.hasta).set(valor);
    this.rapido.set(null);
  }

  limpiar() {
    this.desde.set('');
    this.hasta.set('');
    this.idCategoria.set(null);
    this.idZona.set(null);
    this.rapido.set(null);
  }

  // ---------- Gráficos (Chart.js) ----------

  private dibujar(r: Estadisticas) {
    this.graficos.forEach((g) => g.destroy());
    const s = r.resumen;

    // 1) Distribución por estado (dona). Al pasar el mouse muestra cantidad y porcentaje.
    const estados: ChartConfiguration<'doughnut'> = {
      type: 'doughnut',
      data: {
        labels: ['Atendidas', 'Canceladas', 'En curso', 'Pendientes', 'Vencidas'],
        datasets: [
          {
            data: [s.atendidas, s.canceladas, s.enCurso, s.pendientes, s.vencidas],
            backgroundColor: Object.values(COLORES),
            borderWidth: 2,
            borderColor: '#fff',
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        cutout: '62%',
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              label: (c) =>
                ` ${c.label}: ${c.parsed} (${s.total ? Math.round((Number(c.parsed) / s.total) * 1000) / 10 : 0}%)`,
            },
          },
        },
      },
    };

    // 2) Demanda por categoría (barras apiladas por estado). Clic en una barra = filtrar por esa categoría.
    const cats = r.porCategoria;
    const categorias: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: cats.map((c) => c.nombre),
        datasets: [
          {
            label: 'Atendidas',
            data: cats.map((c) => c.atendidas),
            backgroundColor: COLORES.atendidas,
          },
          {
            label: 'Canceladas',
            data: cats.map((c) => c.canceladas),
            backgroundColor: COLORES.canceladas,
          },
          {
            label: 'Otras (en curso, pendientes, vencidas)',
            data: cats.map((c) => c.total - c.atendidas - c.canceladas),
            backgroundColor: '#c9d3e0',
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true, ticks: { precision: 0 } },
        },
        plugins: {
          legend: { position: 'bottom' },
          tooltip: {
            callbacks: {
              footer: (items) => `Total: ${cats[items[0].dataIndex].total} solicitudes`,
            },
          },
        },
        onClick: (_e, elementos) => {
          if (elementos.length) this.idCategoria.set(cats[elementos[0].index].id);
        },
        onHover: (e, elementos) => {
          (e.native?.target as HTMLElement).style.cursor = elementos.length ? 'pointer' : 'default';
        },
      },
    };

    // 3) Zonas con mayor actividad (barras horizontales; la primera resaltada). Clic = filtrar por esa zona.
    const zonas = r.porZona;
    const zonasGrafico: ChartConfiguration<'bar'> = {
      type: 'bar',
      data: {
        labels: zonas.map((z) => z.nombre),
        datasets: [
          {
            label: 'Solicitudes',
            data: zonas.map((z) => z.total),
            backgroundColor: zonas.map((z, i) => (i === 0 && z.total > 0 ? '#e76f51' : '#1d3557')),
            borderRadius: 4,
          },
        ],
      },
      options: {
        indexAxis: 'y',
        maintainAspectRatio: false,
        scales: { x: { beginAtZero: true, ticks: { precision: 0 } } },
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (c) => {
                const z = zonas[c.dataIndex];
                return ` ${z.total} solicitudes (${z.porcentajeDelTotal}% del total)`;
              },
              footer: (items) => {
                const z = zonas[items[0].dataIndex];
                return `Atendidas: ${z.porcentajeAtendidas}% · Canceladas: ${z.porcentajeCanceladas}%`;
              },
            },
          },
        },
        onClick: (_e, elementos) => {
          if (elementos.length) this.idZona.set(zonas[elementos[0].index].id);
        },
        onHover: (e, elementos) => {
          (e.native?.target as HTMLElement).style.cursor = elementos.length ? 'pointer' : 'default';
        },
      },
    };

    // 4) Evolución en el tiempo (líneas)
    const t = r.tendencia;
    const tendencia: ChartConfiguration<'line'> = {
      type: 'line',
      data: {
        labels: t.map((p) => this.etiquetaPeriodo(p.periodo)),
        datasets: [
          {
            label: 'Total',
            data: t.map((p) => p.total),
            borderColor: COLORES.enCurso,
            backgroundColor: COLORES.enCurso,
            tension: 0.3,
          },
          {
            label: 'Atendidas',
            data: t.map((p) => p.atendidas),
            borderColor: COLORES.atendidas,
            backgroundColor: COLORES.atendidas,
            tension: 0.3,
          },
          {
            label: 'Canceladas',
            data: t.map((p) => p.canceladas),
            borderColor: COLORES.canceladas,
            backgroundColor: COLORES.canceladas,
            tension: 0.3,
          },
        ],
      },
      options: {
        maintainAspectRatio: false,
        interaction: { mode: 'index', intersect: false },
        scales: { y: { beginAtZero: true, ticks: { precision: 0 } } },
        plugins: { legend: { position: 'bottom' } },
      },
    };

    this.graficos = [
      new Chart(this.lienzoEstados()!.nativeElement, estados),
      new Chart(this.lienzoCategorias()!.nativeElement, categorias),
      new Chart(this.lienzoZonas()!.nativeElement, zonasGrafico),
      new Chart(this.lienzoTendencia()!.nativeElement, tendencia),
    ];
  }

  etiquetaPeriodo(periodo: string): string {
    const [a, m, d] = periodo.split('-');
    const meses = [
      'ene',
      'feb',
      'mar',
      'abr',
      'may',
      'jun',
      'jul',
      'ago',
      'sep',
      'oct',
      'nov',
      'dic',
    ];
    if (this.agrupacion() === 'mes') return `${meses[Number(m) - 1]} ${a}`;
    if (this.agrupacion() === 'semana') return `Sem. ${d}-${meses[Number(m) - 1]}`;
    return `${d}-${meses[Number(m) - 1]}`;
  }

  ngOnDestroy() {
    this.graficos.forEach((g) => g.destroy());
  }
}
