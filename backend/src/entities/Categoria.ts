import { Entity, PrimaryGeneratedColumn, Column } from 'typeorm';

@Entity('categoria')
export class Categoria {
  @PrimaryGeneratedColumn({ name: 'id_categoria' })
  idCategoria: number;

  @Column({ name: 'nombre', length: 60, unique: true })
  nombre: string;

  @Column({ name: 'activa', default: true })
  activa: boolean;
}
