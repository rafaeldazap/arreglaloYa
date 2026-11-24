import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('zona')
export class Zona {
  @PrimaryGeneratedColumn({ name: 'id_zona' })
  idZona: number;

  @Column({ name: 'nombre', length: 80, unique: true })
  nombre: string;

  @Column({ name: 'activa', default: true })
  activa: boolean;
}
