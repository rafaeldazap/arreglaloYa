import { Entity, PrimaryGeneratedColumn, Column, ManyToOne, JoinColumn } from 'typeorm';
import { PerfilTrabajador } from './PerfilTrabajador';

@Entity('horario_atencion')
export class HorarioAtencion {
  @PrimaryGeneratedColumn({ name: 'id_horario' })
  idHorario: number;

  @ManyToOne(() => PerfilTrabajador, (perfil) => perfil.horarios, { onDelete: 'CASCADE' })
  @JoinColumn({ name: 'id_perfil' })
  perfilTrabajador: PerfilTrabajador;

  @Column({ name: 'dia_semana', type: 'smallint' })
  diaSemana: number;

  @Column({ name: 'hora_inicio', type: 'time' })
  horaInicio: string;

  @Column({ name: 'hora_fin', type: 'time' })
  horaFin: string;
}
