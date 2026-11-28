import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn, CreateDateColumn } from 'typeorm';
import { ReclamoSancion } from './ReclamoSancion';
import { Usuario } from './Usuario';
import { TipoDecision } from '../modules/escalamiento/escalamiento.enums';

// Historial de decisiones administrativas sobre un reclamo.
// Solo se insertan filas: nunca se editan ni se borran.
@Entity('decision_reclamo')
export class DecisionReclamo {
  @PrimaryGeneratedColumn({ name: 'id_decision' })
  idDecision: number;

  @Column({ name: 'id_reclamo', type: 'int' })
  idReclamo: number;

  @ManyToOne(() => ReclamoSancion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_reclamo' })
  reclamo: ReclamoSancion;

  // null = la decisión la tomó el sistema (escalamiento automático)
  @ManyToOne(() => Usuario, { nullable: true, eager: true })
  @JoinColumn({ name: 'id_administrador' })
  administrador: Usuario | null;

  @Column({ name: 'tipo', type: 'varchar', length: 30 })
  tipo: TipoDecision;

  @Column({ name: 'detalle', type: 'varchar', length: 500 })
  detalle: string;

  @ManyToOne(() => Usuario, { nullable: true, eager: true })
  @JoinColumn({ name: 'id_responsable_anterior' })
  responsableAnterior: Usuario | null;

  @ManyToOne(() => Usuario, { nullable: true, eager: true })
  @JoinColumn({ name: 'id_responsable_nuevo' })
  responsableNuevo: Usuario | null;

  @CreateDateColumn({ name: 'fecha', type: 'timestamptz' })
  fecha: Date;
}
