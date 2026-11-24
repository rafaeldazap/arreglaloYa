import { Entity, PrimaryGeneratedColumn, Column, OneToOne } from 'typeorm';
import { Exclude } from 'class-transformer';
import { RolUsuario, EstadoCuenta } from '../common/enums';
import { PerfilTrabajador } from './PerfilTrabajador';

@Entity('usuario')
export class Usuario {
  @PrimaryGeneratedColumn({ name: 'id_usuario' })
  idUsuario: number;

  @Column({ name: 'nombre_completo', length: 120 })
  nombreCompleto: string;

  @Column({ name: 'telefono', length: 20, nullable: true })
  telefono: string;

  @Column({ name: 'correo', length: 120, unique: true })
  correo: string;

  @Exclude()
  @Column({ name: 'password_hash', length: 255, select: false })
  passwordHash: string;

  @Column({ name: 'rol', type: 'varchar', length: 15 })
  rol: RolUsuario;

  @Column({ name: 'estado_cuenta', type: 'varchar', length: 25, default: EstadoCuenta.ACTIVO })
  estadoCuenta: EstadoCuenta;

  @Column({ name: 'nivel_fibonacci', type: 'int', default: 0 })
  nivelFibonacci: number;

  @Column({ name: 'suspendido_hasta', type: 'timestamptz', nullable: true })
  suspendidoHasta: Date | null;

  @OneToOne(() => PerfilTrabajador, (perfil) => perfil.usuario)
  perfilTrabajador: PerfilTrabajador;
}
