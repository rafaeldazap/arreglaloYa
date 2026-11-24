import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  OneToMany,
  JoinColumn,
  CreateDateColumn,
} from 'typeorm';
import { Usuario } from './Usuario';
import { PerfilTrabajador } from './PerfilTrabajador';
import { Categoria } from './Categoria';
import { Zona } from './Zona';
import { EstadoSolicitud } from '../common/enums';
import { FotoSolicitud } from './FotoSolicitud';

@Entity('solicitud_servicio')
export class SolicitudServicio {
  @PrimaryGeneratedColumn({ name: 'id_solicitud' })
  idSolicitud: number;

  @ManyToOne(() => Usuario, { eager: true })
  @JoinColumn({ name: 'id_cliente' })
  cliente: Usuario;

  @ManyToOne(() => PerfilTrabajador, { nullable: true, eager: true })
  @JoinColumn({ name: 'id_trabajador' })
  trabajador: PerfilTrabajador;

  @ManyToOne(() => Categoria, { eager: true })
  @JoinColumn({ name: 'id_categoria' })
  categoria: Categoria;

  @ManyToOne(() => Zona, { eager: true })
  @JoinColumn({ name: 'id_zona' })
  zona: Zona;

  @Column({ name: 'descripcion', type: 'text' })
  descripcion: string;

  @Column({ name: 'direccion_exacta', length: 255 })
  direccionExacta: string;

  @Column({ name: 'monto_ofrecido', type: 'numeric', precision: 10, scale: 2, nullable: true })
  montoOfrecido: number;

  @Column({
    name: 'estado',
    type: 'varchar',
    length: 25,
    default: EstadoSolicitud.PENDIENTE,
  })
  estado: EstadoSolicitud;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_expiracion', type: 'timestamptz', nullable: true })
  fechaExpiracion: Date;

  @Column({ name: 'fecha_inicio_agendada', type: 'timestamptz', nullable: true })
  fechaInicioAgendada: Date;

  @Column({ name: 'fecha_fin_estimada', type: 'timestamptz', nullable: true })
  fechaFinEstimada: Date;

  @OneToMany(() => FotoSolicitud, (foto) => foto.solicitud, { cascade: true, eager: true })
  fotos: FotoSolicitud[];
}
