import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { SolicitudServicio } from './solicitud-servicio.entity.js';
import { Usuario } from './usuario.entity.js';

@Entity('historial_estado')
export class HistorialEstado {
  @PrimaryGeneratedColumn({ name: 'id_evento' })
  id: number;

  @ManyToOne(() => SolicitudServicio, (s) => s.historial)
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: Relation<SolicitudServicio>;

  @ManyToOne(() => Usuario, { nullable: true })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Relation<Usuario> | null;

  @Column({ name: 'estado_anterior', type: 'varchar', length: 25, nullable: true })
  estadoAnterior: string | null;

  @Column({ name: 'estado_nuevo', length: 25 })
  estadoNuevo: string;

  @Column({ nullable: true })
  descripcion: string;

  @CreateDateColumn({ name: 'fecha_hora', type: 'timestamptz' })
  fechaHora: Date;
}
