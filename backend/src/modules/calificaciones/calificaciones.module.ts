import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CalificacionesService } from './calificaciones.service';
import { CalificacionesController } from './calificaciones.controller';
import { Calificacion } from '../../entities/Calificacion';
import { SolicitudServicio } from '../../entities/SolicitudServicio';
import { Usuario } from '../../entities/Usuario';
import { PerfilTrabajador } from '../../entities/PerfilTrabajador';

@Module({
  imports: [TypeOrmModule.forFeature([Calificacion, SolicitudServicio, Usuario, PerfilTrabajador])],
  controllers: [CalificacionesController],
  providers: [CalificacionesService],
  exports: [CalificacionesService],
})
export class CalificacionesModule {}
