import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { SolicitudServicio } from './SolicitudServicio';

@Entity('foto_solicitud')
export class FotoSolicitud {
  @PrimaryGeneratedColumn({ name: 'id_foto' })
  idFoto: number;

  @ManyToOne(() => SolicitudServicio, (solicitud) => solicitud.fotos, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudServicio;

  @Column({ name: 'url_foto', type: 'text' })
  urlFoto: string;

  @CreateDateColumn({ name: 'fecha_carga', type: 'timestamptz' })
  fechaCarga: Date;
}
