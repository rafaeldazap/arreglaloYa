import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { SolicitudServicio } from './solicitud-servicio.entity.js';
import { Usuario } from './usuario.entity.js';

@Entity('calificacion')
export class Calificacion {
  @PrimaryGeneratedColumn({ name: 'id_calificacion' })
  id: number;

  @ManyToOne(() => SolicitudServicio)
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: Relation<SolicitudServicio>;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_evaluador' })
  evaluador: Relation<Usuario>;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_evaluado' })
  evaluado: Relation<Usuario>;

  @Column({ type: 'smallint' })
  puntaje: number;

  @Column({ type: 'text', nullable: true })
  comentario: string;

  @Column({ name: 'es_interna', default: false })
  esInterna: boolean;

  @CreateDateColumn({ type: 'timestamptz' })
  fecha: Date;
}
