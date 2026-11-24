import { Injectable, Logger, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import * as bcrypt from 'bcryptjs';
import { Categoria, PerfilTrabajador, Usuario, Zona } from '../../entities';
import { EstadoCuenta, RolUsuario } from '../../common/enums';

// Carga los catálogos y las cuentas de prueba la primera vez que arranca el backend
// (solo si las tablas están vacías). Contraseña de todas las cuentas: 123456
@Injectable()
export class SemillaService implements OnApplicationBootstrap {
  private log = new Logger('Semilla');

  constructor(
    @InjectRepository(Categoria) private readonly categoriaRepo: Repository<Categoria>,
    @InjectRepository(Zona) private readonly zonaRepo: Repository<Zona>,
    @InjectRepository(Usuario) private readonly usuarioRepo: Repository<Usuario>,
    @InjectRepository(PerfilTrabajador) private readonly perfilRepo: Repository<PerfilTrabajador>,
  ) {}

  async onApplicationBootstrap() {
    if (process.env.SEED_DEMO === 'false') return;

    if ((await this.categoriaRepo.count()) === 0) {
      const nombres = ['Plomería', 'Electricidad', 'Albañilería', 'Electrodomésticos'];
      await this.categoriaRepo.save(nombres.map((nombre) => this.categoriaRepo.create({ nombre, activa: true })));
    }
    if ((await this.zonaRepo.count()) === 0) {
      const nombres = ['Centro', 'Cala Cala', 'Queru Queru', 'Sarco', 'Hipódromo', 'Sacaba', 'Quillacollo', 'Tiquipaya'];
      await this.zonaRepo.save(nombres.map((nombre) => this.zonaRepo.create({ nombre, activa: true })));
    }
    if ((await this.usuarioRepo.count()) > 0) return;

    const passwordHash = await bcrypt.hash('123456', 10);
    const usuario = (nombreCompleto: string, correo: string, rol: RolUsuario, estadoCuenta = EstadoCuenta.ACTIVO) =>
      this.usuarioRepo.save(this.usuarioRepo.create({ nombreCompleto, correo, rol, estadoCuenta, passwordHash }));

    await usuario('Administrador', 'admin@demo.com', RolUsuario.ADMIN);
    await usuario('María López', 'cliente@demo.com', RolUsuario.CLIENTE);

    const trabajadores = [
      { nombre: 'Juan Mamani', correo: 'trabajador@demo.com', ci: '4567891', cat: ['Plomería'], zonas: ['Centro', 'Cala Cala', 'Sarco'], estado: EstadoCuenta.ACTIVO },
      { nombre: 'Rosa Quispe', correo: 'rosa@demo.com', ci: '5678912', cat: ['Electricidad'], zonas: ['Queru Queru', 'Hipódromo', 'Centro'], estado: EstadoCuenta.ACTIVO },
      { nombre: 'Luis Vargas', correo: 'luis@demo.com', ci: '9123456', cat: ['Electricidad'], zonas: ['Sarco', 'Centro'], estado: EstadoCuenta.REVISION },
    ];
    for (const t of trabajadores) {
      const u = await usuario(t.nombre, t.correo, RolUsuario.TRABAJADOR, t.estado);
      await this.perfilRepo.save(
        this.perfilRepo.create({
          usuario: u,
          ciNumero: t.ci,
          categorias: await this.categoriaRepo.findBy({ nombre: In(t.cat) }),
          zonas: await this.zonaRepo.findBy({ nombre: In(t.zonas) }),
        }),
      );
    }
    this.log.log('Cuentas de prueba creadas: admin@demo.com, cliente@demo.com, trabajador@demo.com (contraseña 123456)');
  }
}
