import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('zona')
export class Zona {
  @PrimaryGeneratedColumn({ name: 'id_zona' })
  id: number;

  @Column({ length: 80, unique: true })
  nombre: string;

  @Column({ default: true })
  activa: boolean;
}
