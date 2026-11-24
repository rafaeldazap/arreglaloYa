import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from '../../entities/Categoria';
import { Zona } from '../../entities/Zona';
import { CatalogoItemDto } from './dto/catalogo-item.dto';

@Injectable()
export class CatalogosService {
  constructor(
    @InjectRepository(Categoria)
    private readonly categoriaRepo: Repository<Categoria>,
    @InjectRepository(Zona)
    private readonly zonaRepo: Repository<Zona>,
  ) {}

  listarCategorias() {
    return this.categoriaRepo.find({ where: { activa: true }, order: { nombre: 'ASC' } });
  }

  listarTodasCategoriasAdmin() {
    return this.categoriaRepo.find({ order: { idCategoria: 'ASC' } });
  }

  async crearCategoria(dto: CatalogoItemDto) {
    const nombre = dto.nombre.trim();
    const existe = await this.categoriaRepo
      .createQueryBuilder('c')
      .where('LOWER(c.nombre) = LOWER(:nombre)', { nombre })
      .getOne();
    if (existe) throw new ConflictException(`La categoría '${nombre}' ya existe`);

    const c = this.categoriaRepo.create({
      nombre,
      activa: dto.activa !== undefined ? dto.activa : true,
    });
    return this.categoriaRepo.save(c);
  }

  async alternarEstadoCategoria(id: number, activa: boolean) {
    const c = await this.categoriaRepo.findOneBy({ idCategoria: id });
    if (!c) throw new NotFoundException(`Categoría con ID ${id} no encontrada`);
    c.activa = activa;
    return this.categoriaRepo.save(c);
  }

  listarZonas() {
    return this.zonaRepo.find({ where: { activa: true }, order: { nombre: 'ASC' } });
  }

  listarTodasZonasAdmin() {
    return this.zonaRepo.find({ order: { idZona: 'ASC' } });
  }

  async crearZona(dto: CatalogoItemDto) {
    const nombre = dto.nombre.trim();
    const existe = await this.zonaRepo
      .createQueryBuilder('z')
      .where('LOWER(z.nombre) = LOWER(:nombre)', { nombre })
      .getOne();
    if (existe) throw new ConflictException(`La zona '${nombre}' ya existe`);

    const z = this.zonaRepo.create({
      nombre,
      activa: dto.activa !== undefined ? dto.activa : true,
    });
    return this.zonaRepo.save(z);
  }

  async alternarEstadoZona(id: number, activa: boolean) {
    const z = await this.zonaRepo.findOneBy({ idZona: id });
    if (!z) throw new NotFoundException(`Zona con ID ${id} no encontrada`);
    z.activa = activa;
    return this.zonaRepo.save(z);
  }
}
