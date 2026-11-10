import { Injectable, signal } from '@angular/core';
import { Pedido, Trabajador } from '../models';

// Datos de prueba. Cuando el backend (NestJS) esté listo,
// estos métodos se cambian por llamadas HTTP a la API REST.
@Injectable({ providedIn: 'root' })
export class DatosService {
  categorias = ['Plomería', 'Electricidad', 'Albañilería', 'Electrodomésticos'];

  zonas = ['Centro', 'Cala Cala', 'Queru Queru', 'Sarco', 'Hipódromo', 'Sacaba', 'Quillacollo', 'Tiquipaya'];

  private trabajadores: Trabajador[] = [
    {
      id: 1, nombre: 'Juan Mamani', especialidades: ['Plomería'], zonas: ['Centro', 'Cala Cala', 'Sarco'],
      experiencia: '8 años arreglando cañerías, tanques de agua y calefones.', promedio: 4.8, trabajosRealizados: 56,
      opiniones: [
        { cliente: 'María L.', puntaje: 5, comentario: 'Llegó puntual y dejó todo limpio.', fecha: '2026-10-28' },
        { cliente: 'Carlos R.', puntaje: 4, comentario: 'Buen trabajo, un poco caro.', fecha: '2026-10-12' },
      ],
    },
    {
      id: 2, nombre: 'Rosa Quispe', especialidades: ['Electricidad'], zonas: ['Queru Queru', 'Hipódromo', 'Centro'],
      experiencia: 'Instalaciones eléctricas domiciliarias y tableros.', promedio: 4.9, trabajosRealizados: 41,
      opiniones: [{ cliente: 'Andrés P.', puntaje: 5, comentario: 'Explicó todo lo que hizo. Muy recomendada.', fecha: '2026-10-30' }],
    },
    {
      id: 3, nombre: 'Pedro Choque', especialidades: ['Albañilería'], zonas: ['Sacaba', 'Quillacollo'],
      experiencia: 'Muros, revoques, cerámica y pequeñas ampliaciones.', promedio: 4.5, trabajosRealizados: 23,
      opiniones: [{ cliente: 'Lucía V.', puntaje: 4, comentario: 'Cumplió con lo acordado.', fecha: '2026-09-20' }],
    },
    {
      id: 4, nombre: 'Miguel Torrez', especialidades: ['Electrodomésticos', 'Electricidad'], zonas: ['Cala Cala', 'Tiquipaya'],
      experiencia: 'Reparación de lavadoras, refrigeradores y cocinas.', promedio: 4.6, trabajosRealizados: 37,
      opiniones: [{ cliente: 'Jorge M.', puntaje: 5, comentario: 'Mi refrigerador quedó como nuevo.', fecha: '2026-10-05' }],
    },
    {
      id: 5, nombre: 'Ana Rojas', especialidades: ['Plomería', 'Albañilería'], zonas: ['Quillacollo', 'Tiquipaya', 'Sarco'],
      experiencia: 'Baños y cocinas: instalación y reparación.', promedio: 4.3, trabajosRealizados: 18,
      opiniones: [],
    },
  ];

  pedidos = signal<Pedido[]>([
    {
      id: 101, categoria: 'Plomería', descripcion: 'Fuga de agua debajo del lavaplatos.', zona: 'Cala Cala',
      direccion: 'Av. América #123', fecha: '2026-11-07', montoOfrecido: 150, fotos: [], estado: 'EN_PROCESO',
      trabajador: 'Juan Mamani',
      historial: [
        { fecha: '2026-11-03 09:12', descripcion: 'Solicitud publicada' },
        { fecha: '2026-11-03 11:40', descripcion: 'Juan Mamani envió una cotización de Bs 180' },
        { fecha: '2026-11-03 12:05', descripcion: 'Cotización aceptada y anticipo del 25% pagado' },
        { fecha: '2026-11-05 10:00', descripcion: 'El trabajador inició el servicio' },
      ],
    },
    {
      id: 102, categoria: 'Electricidad', descripcion: 'Instalar dos tomacorrientes en el dormitorio.', zona: 'Queru Queru',
      direccion: 'Calle Tumusla #45', fecha: '2026-11-10', montoOfrecido: 100, fotos: [], estado: 'PENDIENTE',
      historial: [{ fecha: '2026-11-05 08:30', descripcion: 'Solicitud publicada' }],
    },
  ]);

  obtenerTrabajadores(zona: string, categoria: string): Trabajador[] {
    return this.trabajadores.filter(
      (t) => (zona === '' || t.zonas.includes(zona)) && (categoria === '' || t.especialidades.includes(categoria)),
    );
  }

  obtenerTrabajador(id: number): Trabajador | undefined {
    return this.trabajadores.find((t) => t.id === id);
  }

  crearPedido(datos: Omit<Pedido, 'id' | 'estado' | 'historial'>) {
    const nuevo: Pedido = {
      ...datos,
      id: Date.now(),
      estado: 'PENDIENTE',
      historial: [{ fecha: this.ahora(), descripcion: 'Solicitud publicada' }],
    };
    this.pedidos.update((lista) => [nuevo, ...lista]);
  }

  cancelarPedido(id: number) {
    this.pedidos.update((lista) =>
      lista.map((p) =>
        p.id === id
          ? { ...p, estado: 'CANCELADO', historial: [...p.historial, { fecha: this.ahora(), descripcion: 'El cliente canceló la solicitud' }] }
          : p,
      ),
    );
  }

  private ahora(): string {
    return new Date().toLocaleString('es-BO');
  }
}
