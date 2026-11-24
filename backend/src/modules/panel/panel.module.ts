import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import {
  Calificacion,
  Categoria,
  Cotizacion,
  HistorialEstado,
  PerfilTrabajador,
  ReclamoSancion,
  SolicitudServicio,
  TransaccionPago,
  Usuario,
  Zona,
} from '../../entities';
import { PanelController } from './panel.controller';
import { PanelService } from './panel.service';
import { SemillaService } from './semilla.service';

// Módulo de apoyo para el frontend Angular:
// junta en una sola respuesta lo que cada pantalla necesita y carga datos de prueba.
@Module({
  imports: [
    TypeOrmModule.forFeature([
      Usuario,
      PerfilTrabajador,
      Categoria,
      Zona,
      SolicitudServicio,
      Cotizacion,
      TransaccionPago,
      HistorialEstado,
      ReclamoSancion,
      Calificacion,
    ]),
  ],
  controllers: [PanelController],
  providers: [PanelService, SemillaService],
})
export class PanelModule {}
