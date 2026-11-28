import { Entity, PrimaryGeneratedColumn, Column, OneToOne, ManyToOne, JoinColumn } from 'typeorm';
import { ReclamoSancion } from './ReclamoSancion';
import { Usuario } from './Usuario';

// Datos de gestión administrativa de un reclamo (responsable y escalamiento).
// Se guardan aparte para no modificar la tabla original de reclamos.
@Entity('gestion_reclamo')
export class GestionReclamo {
  @PrimaryGeneratedColumn({ name: 'id_gestion' })
  idGestion: number;

  @Column({ name: 'id_reclamo', type: 'int' })
  idReclamo: number;

  @OneToOne(() => ReclamoSancion, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_reclamo' })
  reclamo: ReclamoSancion;

  @ManyToOne(() => Usuario, { nullable: true, eager: true })
  @JoinColumn({ name: 'id_responsable' })
  responsable: Usuario | null;

  @Column({ name: 'escalado', type: 'boolean', default: false })
  escalado: boolean;

  @Column({ name: 'fecha_escalamiento', type: 'timestamptz', nullable: true })
  fechaEscalamiento: Date | null;
}
