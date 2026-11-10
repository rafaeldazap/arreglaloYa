import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { Usuario } from './usuario.entity.js';
import { PerfilTrabajador } from './perfil-trabajador.entity.js';
import { Categoria } from './categoria.entity.js';
import { Zona } from './zona.entity.js';
import { FotoSolicitud } from './foto-solicitud.entity.js';
import { Cotizacion } from './cotizacion.entity.js';
import { HistorialEstado } from './historial-estado.entity.js';

export type EstadoServicio =
  | 'PENDIENTE'
  | 'BAJO_REVISION'
  | 'APROBADO'
  | 'EN_PROCESO'
  | 'FINALIZADO'
  | 'CANCELADO'
  | 'FUERA_DE_TIEMPO';

@Entity('solicitud_servicio')
export class SolicitudServicio {
  @PrimaryGeneratedColumn({ name: 'id_solicitud' })
  id: number;

  @ManyToOne(() => Usuario)
  @JoinColumn({ name: 'id_cliente' })
  cliente: Relation<Usuario>;

  @ManyToOne(() => PerfilTrabajador, { nullable: true })
  @JoinColumn({ name: 'id_trabajador' })
  trabajador: Relation<PerfilTrabajador> | null;

  @ManyToOne(() => Categoria)
  @JoinColumn({ name: 'id_categoria' })
  categoria: Relation<Categoria>;

  @ManyToOne(() => Zona)
  @JoinColumn({ name: 'id_zona' })
  zona: Relation<Zona>;

  @Column({ type: 'text' })
  descripcion: string;

  @Column({ name: 'direccion_exacta' })
  direccionExacta: string;

  @Column({ name: 'monto_ofrecido', type: 'numeric', precision: 10, scale: 2, nullable: true })
  montoOfrecido: number;

  @Column({ length: 25, default: 'PENDIENTE' })
  estado: EstadoServicio;

  @CreateDateColumn({ name: 'fecha_creacion', type: 'timestamptz' })
  fechaCreacion: Date;

  @Column({ name: 'fecha_expiracion', type: 'timestamptz' })
  fechaExpiracion: Date;

  @Column({ name: 'fecha_inicio_agendada', type: 'timestamptz', nullable: true })
  fechaInicioAgendada: Date | null;

  @Column({ name: 'fecha_fin_estimada', type: 'timestamptz', nullable: true })
  fechaFinEstimada: Date | null;

  @OneToMany(() => FotoSolicitud, (f) => f.solicitud)
  fotos: Relation<FotoSolicitud[]>;

  @OneToMany(() => Cotizacion, (c) => c.solicitud)
  cotizaciones: Relation<Cotizacion[]>;

  @OneToMany(() => HistorialEstado, (h) => h.solicitud)
  historial: Relation<HistorialEstado[]>;
}
