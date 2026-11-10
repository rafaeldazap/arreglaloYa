import { Column, Entity, OneToOne, PrimaryGeneratedColumn, type Relation } from 'typeorm';
import { PerfilTrabajador } from './perfil-trabajador.entity.js';

export type Rol = 'CLIENTE' | 'TRABAJADOR' | 'ADMIN';
export type EstadoCuenta = 'REVISION' | 'ACTIVO' | 'SUSPENDIDO' | 'BLOQUEADO_PERMANENTE';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  id: number;

  @Column({ name: 'nombre_completo', length: 120 })
  nombreCompleto: string;

  @Column({ length: 20, nullable: true })
  telefono: string;

  @Column({ length: 120, unique: true })
  correo: string;

  @Column({ name: 'password_hash', select: false })
  passwordHash: string;

  @Column({ length: 15 })
  rol: Rol;

  @Column({ name: 'estado_cuenta', length: 25, default: 'ACTIVO' })
  estadoCuenta: EstadoCuenta;

  @Column({ name: 'nivel_fibonacci', default: 0 })
  nivelFibonacci: number;

  @Column({ name: 'suspendido_hasta', type: 'timestamptz', nullable: true })
  suspendidoHasta: Date | null;

  @OneToOne(() => PerfilTrabajador, (p) => p.usuario)
  perfil: Relation<PerfilTrabajador>;
}
