import { Entity, PrimaryColumn, Column, ManyToOne, JoinColumn, UpdateDateColumn } from 'typeorm';
import { Usuario } from './Usuario';

// Tabla de una sola fila (id = 1) con el plazo máximo para resolver un reclamo.
@Entity('configuracion_escalamiento')
export class ConfiguracionEscalamiento {
  @PrimaryColumn({ name: 'id_configuracion', type: 'int' })
  idConfiguracion: number;

  // Plazo en minutos (por defecto 4320 = 3 días)
  @Column({ name: 'plazo_minutos', type: 'int', default: 4320 })
  plazoMinutos: number;

  @ManyToOne(() => Usuario, { nullable: true, eager: true })
  @JoinColumn({ name: 'id_actualizado_por' })
  actualizadoPor: Usuario | null;

  @UpdateDateColumn({ name: 'fecha_actualizacion', type: 'timestamptz' })
  fechaActualizacion: Date;
}
