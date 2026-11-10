import { Injectable, OnApplicationBootstrap } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Categoria } from '../entidades/categoria.entity.js';
import { Zona } from '../entidades/zona.entity.js';

@Injectable()
export class CatalogosService implements OnApplicationBootstrap {
  constructor(
    @InjectRepository(Categoria) private categorias: Repository<Categoria>,
    @InjectRepository(Zona) private zonas: Repository<Zona>,
  ) {}

  // Carga las categorías y zonas iniciales si la base está vacía
  async onApplicationBootstrap() {
    if ((await this.categorias.count()) === 0) {
      const nombres = ['Plomería', 'Electricidad', 'Albañilería', 'Electrodomésticos'];
      await this.categorias.save(nombres.map((nombre) => ({ nombre })));
    }
    if ((await this.zonas.count()) === 0) {
      const nombres = ['Centro', 'Cala Cala', 'Queru Queru', 'Sarco', 'Hipódromo', 'Sacaba', 'Quillacollo', 'Tiquipaya'];
      await this.zonas.save(nombres.map((nombre) => ({ nombre })));
    }
  }

  listarCategorias() {
    return this.categorias.find({ where: { activa: true }, order: { id: 'ASC' } });
  }

  listarZonas() {
    return this.zonas.find({ where: { activa: true }, order: { id: 'ASC' } });
  }
}
