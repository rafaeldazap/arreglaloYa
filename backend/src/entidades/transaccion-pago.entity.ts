import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { SolicitudServicio } from './solicitud-servicio.entity.js';

@Entity('transaccion_pago')
export class TransaccionPago {
  @PrimaryGeneratedColumn({ name: 'id_pago' })
  id: number;

  @ManyToOne(() => SolicitudServicio)
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: Relation<SolicitudServicio>;

  @Column({ length: 15 })
  tipo: 'ANTICIPO_25' | 'SALDO_75';

  @Column({ name: 'medio_pago', length: 20 })
  medioPago: 'PASARELA_APP' | 'EFECTIVO' | 'QR_TRABAJADOR';

  @Column({ type: 'numeric', precision: 10, scale: 2 })
  monto: number;

  @Column({ name: 'url_comprobante', nullable: true })
  urlComprobante: string;

  @Column({ name: 'conformidad_cliente', default: false })
  conformidadCliente: boolean;

  @Column({ name: 'confirmado_por_trabajador', default: false })
  confirmadoPorTrabajador: boolean;

  @Column({ name: 'liberado_al_trabajador', default: false })
  liberadoAlTrabajador: boolean;
}
