import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('categoria')
export class Categoria {
  @PrimaryGeneratedColumn({ name: 'id_categoria' })
  id: number;

  @Column({ length: 60, unique: true })
  nombre: string;

  @Column({ default: true })
  activa: boolean;
}
