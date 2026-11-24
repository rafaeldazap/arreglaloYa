import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { SolicitudServicio } from './SolicitudServicio';
import { Usuario } from './Usuario';
import { MotivoReclamo, EstadoResolucion } from '../common/enums';

@Entity('reclamo_sancion')
export class ReclamoSancion {
  @PrimaryGeneratedColumn({ name: 'id_reclamo' })
  idReclamo: number;

  @OneToOne(() => SolicitudServicio, { eager: true, onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_solicitud' })
  solicitud: SolicitudServicio;

  @ManyToOne(() => Usuario, { eager: true })
  @JoinColumn({ name: 'id_denunciante' })
  denunciante: Usuario;

  @ManyToOne(() => Usuario, { eager: true })
  @JoinColumn({ name: 'id_denunciado' })
  denunciado: Usuario;

  @Column({ name: 'motivo', type: 'varchar', length: 25 })
  motivo: MotivoReclamo;

  @Column({ name: 'descripcion', type: 'text', nullable: true })
  descripcion: string;

  @Column({ name: 'url_pruebas', length: 255, nullable: true })
  urlPruebas: string;

  @Column({
    name: 'estado_resolucion',
    type: 'varchar',
    length: 15,
    default: EstadoResolucion.EN_REVISION,
  })
  estadoResolucion: EstadoResolucion;

  @Column({ name: 'dias_suspension', type: 'int', default: 0 })
  diasSuspension: number;
}
