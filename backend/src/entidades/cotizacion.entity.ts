import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { SolicitudServicio } from './solicitud-servicio.entity.js';
import { PerfilTrabajador } from './perfil-trabajador.entity.js';

@Entity('cotizacion')
export class Cotizacion {
  @PrimaryGeneratedColumn({ name: 'id_cotizacion' })
  id: number;

  @ManyToOne(() => SolicitudServicio, (s) => s.cotizaciones)
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: Relation<SolicitudServicio>;

  @ManyToOne(() => PerfilTrabajador)
  @JoinColumn({ name: 'id_trabajador' })
  trabajador: Relation<PerfilTrabajador>;

  @Column({ name: 'requiere_visita', default: false })
  requiereVisita: boolean;

  @Column({ name: 'costo_visita', type: 'numeric', precision: 10, scale: 2, default: 0 })
  costoVisita: number;

  @Column({ name: 'monto_total_propuesto', type: 'numeric', precision: 10, scale: 2 })
  montoTotalPropuesto: number;

  @Column({ name: 'incluye_materiales', default: false })
  incluyeMateriales: boolean;

  @Column({ name: 'es_recotizacion', default: false })
  esRecotizacion: boolean;

  @Column({ name: 'estado_aprobacion', length: 15, default: 'PENDIENTE' })
  estadoAprobacion: 'PENDIENTE' | 'ACEPTADA' | 'RECHAZADA';
}
