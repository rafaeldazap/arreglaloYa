import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CotizacionesService } from './cotizaciones.service';
import { CotizacionesController } from './cotizaciones.controller';
import { Cotizacion } from '../../entities/Cotizacion';
import { SolicitudServicio } from '../../entities/SolicitudServicio';
import { PerfilTrabajador } from '../../entities/PerfilTrabajador';
import { HistorialEstado } from '../../entities/HistorialEstado';
import { TransaccionPago } from '../../entities/TransaccionPago';
import { SuspensionTrabajador } from '../../entities/SuspensionTrabajador';
import { Usuario } from '../../entities/Usuario';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      Cotizacion,
      SolicitudServicio,
      PerfilTrabajador,
      HistorialEstado,
      TransaccionPago,
      SuspensionTrabajador,
      Usuario,
    ]),
  ],
  controllers: [CotizacionesController],
  providers: [CotizacionesService],
  exports: [CotizacionesService],
})
export class CotizacionesModule {}
