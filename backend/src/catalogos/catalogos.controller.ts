import { Controller, Get } from '@nestjs/common';
import { CatalogosService } from './catalogos.service.js';

@Controller()
export class CatalogosController {
  constructor(private catalogos: CatalogosService) {}

  @Get('categorias')
  categorias() {
    return this.catalogos.listarCategorias();
  }

  @Get('zonas')
  zonas() {
    return this.catalogos.listarZonas();
  }
}
