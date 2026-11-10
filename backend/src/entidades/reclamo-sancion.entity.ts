import { Column, Entity, JoinColumn, ManyToOne, OneToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { SolicitudServicio } from './solicitud-servicio.entity.js';
import { Usuario } from './usuario.entity.js';

@Entity('reclamo_sancion')
export class ReclamoSancion {
  @PrimaryGeneratedColumn({ name: 'id_reclamo' })
  id: number;

  @OneToOne(() => SolicitudServicio)
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: Relation<SolicitudServicio>;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_denunciante' })
  denunciante: Relation<Usuario>;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_denunciado' })
  denunciado: Relation<Usuario>;

  @Column({ length: 25 })
  motivo: 'INASISTENCIA' | 'MAL_ARREGLO' | 'INCUMPLIMIENTO_PAGO' | 'ROBO';

  @Column({ name: 'url_pruebas', nullable: true })
  urlPruebas: string;

  @Column({ name: 'estado_resolucion', length: 15, default: 'EN_REVISION' })
  estadoResolucion: 'EN_REVISION' | 'PROCEDENTE' | 'IMPROCEDENTE';

  @Column({ name: 'dias_suspension', default: 0 })
  diasSuspension: number;
}
