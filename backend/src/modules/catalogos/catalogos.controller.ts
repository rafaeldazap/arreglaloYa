import {
  Controller,
  Get,
  Post,
  Patch,
  Body,
  Param,
  UseGuards,
  ParseIntPipe,
} from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { CatalogosService } from './catalogos.service';
import { CatalogoItemDto } from './dto/catalogo-item.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../../common/guards/roles.guard';
import { Roles } from '../../common/decorators/roles.decorator';
import { RolUsuario } from '../../common/enums';

@ApiTags('Catálogos')
@Controller()
export class CatalogosController {
  constructor(private readonly catalogosService: CatalogosService) {}

  @Get('categorias')
  @ApiOperation({ summary: 'Listar todas las especialidades/categorías activas (Público)' })
  listarCategorias() {
    return this.catalogosService.listarCategorias();
  }

  @Get('categorias/todas')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Listar todas las categorías activas e inactivas (Solo ADMIN)' })
  listarTodasCategoriasAdmin() {
    return this.catalogosService.listarTodasCategoriasAdmin();
  }

  @Post('categorias')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Crear nueva categoría/especialidad (Solo ADMIN, CU-13)' })
  crearCategoria(@Body() dto: CatalogoItemDto) {
    return this.catalogosService.crearCategoria(dto);
  }

  @Patch('categorias/:id/desactivar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Desactivar una categoría sin eliminarla (Solo ADMIN, CU-13)' })
  desactivarCategoria(@Param('id', ParseIntPipe) id: number) {
    return this.catalogosService.alternarEstadoCategoria(id, false);
  }

  @Patch('categorias/:id/activar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Activar una categoría (Solo ADMIN, CU-13)' })
  activarCategoria(@Param('id', ParseIntPipe) id: number) {
    return this.catalogosService.alternarEstadoCategoria(id, true);
  }

  @Get('zonas')
  @ApiOperation({ summary: 'Listar todas las zonas activas de Cochabamba (Público)' })
  listarZonas() {
    return this.catalogosService.listarZonas();
  }

  @Get('zonas/todas')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Listar todas las zonas activas e inactivas (Solo ADMIN)' })
  listarTodasZonasAdmin() {
    return this.catalogosService.listarTodasZonasAdmin();
  }

  @Post('zonas')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Crear nueva zona de Cochabamba (Solo ADMIN, CU-13)' })
  crearZona(@Body() dto: CatalogoItemDto) {
    return this.catalogosService.crearZona(dto);
  }

  @Patch('zonas/:id/desactivar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Desactivar una zona sin eliminarla (Solo ADMIN, CU-13)' })
  desactivarZona(@Param('id', ParseIntPipe) id: number) {
    return this.catalogosService.alternarEstadoZona(id, false);
  }

  @Patch('zonas/:id/activar')
  @ApiBearerAuth()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(RolUsuario.ADMIN)
  @ApiOperation({ summary: 'Activar una zona (Solo ADMIN, CU-13)' })
  activarZona(@Param('id', ParseIntPipe) id: number) {
    return this.catalogosService.alternarEstadoZona(id, true);
  }
}
