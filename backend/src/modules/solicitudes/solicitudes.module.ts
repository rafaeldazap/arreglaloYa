import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { SolicitudesService } from './solicitudes.service';
import { SolicitudesController } from './solicitudes.controller';
import { SolicitudesTasks } from './solicitudes.tasks';
import { SolicitudServicio } from '../../entities/SolicitudServicio';
import { FotoSolicitud } from '../../entities/FotoSolicitud';
import { HistorialEstado } from '../../entities/HistorialEstado';
import { Categoria } from '../../entities/Categoria';
import { Zona } from '../../entities/Zona';
import { PerfilTrabajador } from '../../entities/PerfilTrabajador';
import { TransaccionPago } from '../../entities/TransaccionPago';
import { CancelacionSolicitud } from '../../entities/CancelacionSolicitud';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      SolicitudServicio,
      FotoSolicitud,
      HistorialEstado,
      Categoria,
      Zona,
      PerfilTrabajador,
      TransaccionPago,
      CancelacionSolicitud,
    ]),
  ],
  controllers: [SolicitudesController],
  providers: [SolicitudesService, SolicitudesTasks],
  exports: [SolicitudesService],
})
export class SolicitudesModule {}
