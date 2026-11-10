import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { PerfilTrabajador } from './perfil-trabajador.entity.js';

@Entity('horario_atencion')
export class HorarioAtencion {
  @PrimaryGeneratedColumn({ name: 'id_horario' })
  id: number;

  @ManyToOne(() => PerfilTrabajador, (p) => p.horarios)
  @JoinColumn({ name: 'id_perfil' })
  perfil: Relation<PerfilTrabajador>;

  @Column({ name: 'dia_semana', type: 'smallint' })
  diaSemana: number;

  @Column({ name: 'hora_inicio', type: 'time' })
  horaInicio: string;

  @Column({ name: 'hora_fin', type: 'time' })
  horaFin: string;
}
