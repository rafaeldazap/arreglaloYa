import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PagosService } from './pagos.service';
import { PagosController } from './pagos.controller';
import { TransaccionPago } from '../../entities/TransaccionPago';
import { SolicitudServicio } from '../../entities/SolicitudServicio';
import { HistorialEstado } from '../../entities/HistorialEstado';

@Module({
  imports: [TypeOrmModule.forFeature([TransaccionPago, SolicitudServicio, HistorialEstado])],
  controllers: [PagosController],
  providers: [PagosService],
  exports: [PagosService],
})
export class PagosModule {}
