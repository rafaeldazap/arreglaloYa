import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  OneToOne,
  JoinColumn,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import { Usuario } from './Usuario';
import { Categoria } from './Categoria';
import { Zona } from './Zona';
import { HorarioAtencion } from './HorarioAtencion';
import { SuspensionTrabajador } from './SuspensionTrabajador';

@Entity('perfil_trabajador')
export class PerfilTrabajador {
  @PrimaryGeneratedColumn({ name: 'id_perfil' })
  idPerfil: number;

  @OneToOne(() => Usuario, (usuario) => usuario.perfilTrabajador, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_usuario' })
  usuario: Usuario;

  @Column({ name: 'ci_numero', length: 20, unique: true })
  ciNumero: string;

  @Column({ name: 'url_ci', length: 255, nullable: true })
  urlCi: string;

  @Column({ name: 'url_antecedentes', length: 255, nullable: true })
  urlAntecedentes: string;

  @Column({ name: 'url_experiencia', length: 255, nullable: true })
  urlExperiencia: string;

  @Column({ name: 'margen_error_min', type: 'int', default: 0 })
  margenErrorMin: number;

  @Column({ name: 'qr_imagen_url', length: 255, nullable: true })
  qrImagenUrl: string;

  @Column({ name: 'qr_vigencia_min', type: 'int', nullable: true })
  qrVigenciaMin: number;

  @Column({ name: 'promedio_semanal', type: 'numeric', precision: 3, scale: 2, default: 0 })
  promedioSemanal: number;

  @Column({ name: 'promedio_mensual', type: 'numeric', precision: 3, scale: 2, default: 0 })
  promedioMensual: number;

  @Column({ name: 'promedio_anual', type: 'numeric', precision: 3, scale: 2, default: 0 })
  promedioAnual: number;

  @ManyToMany(() => Categoria)
  @JoinTable({
    name: 'trabajador_categoria',
    joinColumn: { name: 'id_perfil', referencedColumnName: 'idPerfil' },
    inverseJoinColumn: { name: 'id_categoria', referencedColumnName: 'idCategoria' },
  })
  categorias: Categoria[];

  @ManyToMany(() => Zona)
  @JoinTable({
    name: 'trabajador_zona',
    joinColumn: { name: 'id_perfil', referencedColumnName: 'idPerfil' },
    inverseJoinColumn: { name: 'id_zona', referencedColumnName: 'idZona' },
  })
  zonas: Zona[];

  @OneToMany(() => HorarioAtencion, (horario) => horario.perfilTrabajador)
  horarios: HorarioAtencion[];

  @OneToMany(() => SuspensionTrabajador, (suspension) => suspension.trabajador)
  suspensiones: SuspensionTrabajador[];
}
