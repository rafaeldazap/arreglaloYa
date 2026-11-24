import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ReclamosService } from './reclamos.service';
import { ReclamosController } from './reclamos.controller';
import { ReclamoSancion } from '../../entities/ReclamoSancion';
import { SolicitudServicio } from '../../entities/SolicitudServicio';
import { Usuario } from '../../entities/Usuario';

@Module({
  imports: [TypeOrmModule.forFeature([ReclamoSancion, SolicitudServicio, Usuario])],
  controllers: [ReclamosController],
  providers: [ReclamosService],
  exports: [ReclamosService],
})
export class ReclamosModule {}
