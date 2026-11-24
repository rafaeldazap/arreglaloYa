import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { SolicitudServicio } from './SolicitudServicio';
import { Usuario } from './Usuario';

@Entity('historial_estado')
export class HistorialEstado {
  @PrimaryGeneratedColumn({ name: 'id_evento' })
  idEvento: number;

  @ManyToOne(() => SolicitudServicio, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudServicio;

  @ManyToOne(() => Usuario, { nullable: true, eager: true })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column({ name: 'estado_anterior', length: 25, nullable: true })
  estadoAnterior: string;

  @Column({ name: 'estado_nuevo', length: 25 })
  estadoNuevo: string;

  @Column({ name: 'descripcion', length: 255, nullable: true })
  descripcion: string;

  @CreateDateColumn({ name: 'fecha_hora', type: 'timestamptz' })
  fechaHora: Date;
}
