import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Categoria } from '../entidades/categoria.entity.js';
import { Zona } from '../entidades/zona.entity.js';
import { CatalogosController } from './catalogos.controller.js';
import { CatalogosService } from './catalogos.service.js';

@Module({
  imports: [TypeOrmModule.forFeature([Categoria, Zona])],
  controllers: [CatalogosController],
  providers: [CatalogosService],
})
export class CatalogosModule {}
