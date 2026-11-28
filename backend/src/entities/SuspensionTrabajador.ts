import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { PerfilTrabajador } from './PerfilTrabajador';
import { Usuario } from './Usuario';

@Entity('suspension_trabajador')
export class SuspensionTrabajador {
  @PrimaryGeneratedColumn({ name: 'id_suspension' })
  idSuspension: number;

  @ManyToOne(() => PerfilTrabajador, (perfil) => perfil.suspensiones, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_perfil' })
  trabajador: PerfilTrabajador;

  @Column({ name: 'motivo', type: 'text' })
  motivo: string;

  @Column({ name: 'fecha_inicio', type: 'timestamptz' })
  fechaInicio: Date;

  @Column({ name: 'fecha_fin', type: 'timestamptz' })
  fechaFin: Date;

  @Column({ name: 'dias', type: 'int', default: 1 })
  dias: number;

  @Column({ name: 'activa', type: 'boolean', default: true })
  activa: boolean;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_admin' })
  creadoPor: Usuario | null;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_levantamiento', type: 'timestamptz', nullable: true })
  fechaLevantamiento: Date | null;

  @Column({ name: 'observacion_levantamiento', type: 'text', nullable: true })
  observacionLevantamiento: string | null;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_admin_levantamiento' })
  levantadoPor: Usuario | null;
}
