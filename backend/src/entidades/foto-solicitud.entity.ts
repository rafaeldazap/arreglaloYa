import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { SolicitudServicio } from './solicitud-servicio.entity.js';

@Entity('foto_solicitud')
export class FotoSolicitud {
  @PrimaryGeneratedColumn({ name: 'id_foto' })
  id: number;

  @ManyToOne(() => SolicitudServicio, (s) => s.fotos)
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: Relation<SolicitudServicio>;

  @Column({ name: 'url_foto' })
  urlFoto: string;

  @CreateDateColumn({ name: 'fecha_carga', type: 'timestamptz' })
  fechaCarga: Date;
}
