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

@Entity('calificacion')
export class Calificacion {
  @PrimaryGeneratedColumn({ name: 'id_calificacion' })
  idCalificacion: number;

  @ManyToOne(() => SolicitudServicio, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudServicio;

  @ManyToOne(() => Usuario, { eager: true })
  @JoinColumn({ name: 'id_evaluador' })
  evaluador: Usuario;

  @ManyToOne(() => Usuario, { eager: true })
  @JoinColumn({ name: 'id_evaluado' })
  evaluado: Usuario;

  @Column({ name: 'puntaje', type: 'smallint' })
  puntaje: number;

  @Column({ name: 'comentario', type: 'text', nullable: true })
  comentario: string;

  @Column({ name: 'es_interna', default: false })
  esInterna: boolean;

  @CreateDateColumn({ name: 'fecha', type: 'timestamptz' })
  fecha: Date;
}
