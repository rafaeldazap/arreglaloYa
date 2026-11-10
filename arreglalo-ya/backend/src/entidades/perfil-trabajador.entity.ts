import { Column, Entity, JoinColumn, JoinTable, ManyToMany, OneToMany, OneToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { Usuario } from './usuario.entity.js';
import { Categoria } from './categoria.entity.js';
import { Zona } from './zona.entity.js';
import { HorarioAtencion } from './horario-atencion.entity.js';

@Entity('perfil_trabajador')
export class PerfilTrabajador {
  @PrimaryGeneratedColumn({ name: 'id_perfil' })
  id: number;

  @OneToOne(() => Usuario, (u) => u.perfil)
  @JoinColumn({ name: 'id_usuario' })
  usuario: Relation<Usuario>;

  @Column({ name: 'ci_numero', length: 20, unique: true })
  ciNumero: string;

  @Column({ name: 'url_ci', nullable: true })
  urlCi: string;

  @Column({ name: 'url_antecedentes', nullable: true })
  urlAntecedentes: string;

  @Column({ name: 'url_experiencia', nullable: true })
  urlExperiencia: string;

  @Column({ type: 'text', nullable: true })
  experiencia: string;

  @Column({ name: 'margen_error_min', default: 0 })
  margenErrorMin: number;

  @Column({ name: 'qr_imagen_url', nullable: true })
  qrImagenUrl: string;

  @Column({ name: 'qr_vigencia_min', nullable: true })
  qrVigenciaMin: number;

  @Column({ name: 'promedio_semanal', type: 'numeric', precision: 3, scale: 2, default: 0 })
  promedioSemanal: number;

  @Column({ name: 'promedio_mensual', type: 'numeric', precision: 3, scale: 2, default: 0 })
  promedioMensual: number;

  @Column({ name: 'promedio_anual', type: 'numeric', precision: 3, scale: 2, default: 0 })
  promedioAnual: number;

  @ManyToMany(() => Categoria)
  @JoinTable({ name: 'trabajador_categoria', joinColumn: { name: 'id_perfil' }, inverseJoinColumn: { name: 'id_categoria' } })
  categorias: Relation<Categoria[]>;

  @ManyToMany(() => Zona)
  @JoinTable({ name: 'trabajador_zona', joinColumn: { name: 'id_perfil' }, inverseJoinColumn: { name: 'id_zona' } })
  zonas: Relation<Zona[]>;

  @OneToMany(() => HorarioAtencion, (h) => h.perfil)
  horarios: Relation<HorarioAtencion[]>;
}
