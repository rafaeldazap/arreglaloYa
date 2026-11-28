import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { SolicitudServicio } from './SolicitudServicio';
import { Usuario } from './Usuario';
import { EstadoSolicitud, MotivoCancelacion } from '../common/enums';

// Registro de la cancelación de una solicitud (CU-10, RN-12): una sola por solicitud
@Entity('cancelacion_solicitud')
export class CancelacionSolicitud {
  @PrimaryGeneratedColumn({ name: 'id_cancelacion' })
  idCancelacion: number;

  @OneToOne(() => SolicitudServicio, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudServicio;

  // Usuario que realizó la cancelación (el cliente dueño o un ADMIN)
  @ManyToOne(() => Usuario, { eager: true })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column({ name: 'motivo', type: 'varchar', length: 30 })
  motivo: MotivoCancelacion;

  @Column({ name: 'detalle', type: 'text', nullable: true })
  detalle: string | null;

  @Column({ name: 'estado_al_cancelar', type: 'varchar', length: 25 })
  estadoAlCancelar: EstadoSolicitud;

  // Horas que faltaban para fechaInicioAgendada (null si no había fecha agendada)
  @Column({ name: 'horas_anticipacion', type: 'numeric', precision: 10, scale: 2, nullable: true })
  horasAnticipacion: number | null;

  @Column({ name: 'monto_anticipo', type: 'numeric', precision: 10, scale: 2, default: 0 })
  montoAnticipo: number;

  @Column({ name: 'porcentaje_penalizacion', type: 'numeric', precision: 5, scale: 2, default: 0 })
  porcentajePenalizacion: number;

  @Column({ name: 'monto_penalizacion', type: 'numeric', precision: 10, scale: 2, default: 0 })
  montoPenalizacion: number;

  @Column({ name: 'monto_reembolso', type: 'numeric', precision: 10, scale: 2, default: 0 })
  montoReembolso: number;

  @CreateDateColumn({ name: 'fecha_cancelacion', type: 'timestamptz' })
  fechaCancelacion: Date;
}
