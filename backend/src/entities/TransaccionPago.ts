import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { SolicitudServicio } from './SolicitudServicio';
import { TipoPago, MedioPago } from '../common/enums';

@Entity('transaccion_pago')
export class TransaccionPago {
  @PrimaryGeneratedColumn({ name: 'id_pago' })
  idPago: number;

  @ManyToOne(() => SolicitudServicio, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudServicio;

  @Column({ name: 'tipo', type: 'varchar', length: 15 })
  tipo: TipoPago;

  @Column({ name: 'medio_pago', type: 'varchar', length: 20 })
  medioPago: MedioPago;

  @Column({ name: 'monto', type: 'numeric', precision: 10, scale: 2 })
  monto: number;

  @Column({ name: 'url_comprobante', length: 255, nullable: true })
  urlComprobante: string;

  @Column({ name: 'conformidad_cliente', default: false })
  conformidadCliente: boolean;

  @Column({ name: 'confirmado_por_trabajador', default: false })
  confirmadoPorTrabajador: boolean;

  @Column({ name: 'liberado_al_trabajador', default: false })
  liberadoAlTrabajador: boolean;
}
