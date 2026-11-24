import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SolicitudServicio } from './SolicitudServicio';
import { PerfilTrabajador } from './PerfilTrabajador';
import { EstadoCotizacion } from '../common/enums';

@Entity('cotizacion')
export class Cotizacion {
  @PrimaryGeneratedColumn({ name: 'id_cotizacion' })
  idCotizacion: number;

  @ManyToOne(() => SolicitudServicio, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudServicio;

  @ManyToOne(() => PerfilTrabajador, { eager: true })
  @JoinColumn({ name: 'id_trabajador' })
  trabajador: PerfilTrabajador;

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

  @Column({
    name: 'estado_aprobacion',
    type: 'varchar',
    length: 15,
    default: EstadoCotizacion.PENDIENTE,
  })
  estadoAprobacion: EstadoCotizacion;
}
