import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CatalogosService } from './catalogos.service';
import { CatalogosController } from './catalogos.controller';
import { Categoria } from '../../entities/Categoria';
import { Zona } from '../../entities/Zona';

@Module({
  imports: [TypeOrmModule.forFeature([Categoria, Zona])],
  controllers: [CatalogosController],
  providers: [CatalogosService],
  exports: [CatalogosService],
})
export class CatalogosModule {}
