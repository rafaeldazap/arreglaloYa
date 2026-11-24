import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { TrabajadoresService } from './trabajadores.service';
import { TrabajadoresController } from './trabajadores.controller';
import { PerfilTrabajador } from '../../entities/PerfilTrabajador';
import { Usuario } from '../../entities/Usuario';
import { HorarioAtencion } from '../../entities/HorarioAtencion';

@Module({
  imports: [TypeOrmModule.forFeature([PerfilTrabajador, Usuario, HorarioAtencion])],
  controllers: [TrabajadoresController],
  providers: [TrabajadoresService],
  exports: [TrabajadoresService],
})
export class TrabajadoresModule {}
