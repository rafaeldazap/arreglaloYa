import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { EscalamientoController } from './escalamiento.controller';
import { EscalamientoService } from './escalamiento.service';
import { EscalamientoTasks } from './escalamiento.tasks';
import { ReclamosModule } from '../reclamos/reclamos.module';
import { ReclamoSancion } from '../../entities/ReclamoSancion';
import { ConfiguracionEscalamiento } from '../../entities/ConfiguracionEscalamiento';
import { GestionReclamo } from '../../entities/GestionReclamo';
import { DecisionReclamo } from '../../entities/DecisionReclamo';
import { Usuario } from '../../entities/Usuario';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      ReclamoSancion,
      ConfiguracionEscalamiento,
      GestionReclamo,
      DecisionReclamo,
      Usuario,
    ]),
    ReclamosModule, // exporta ReclamosService, que se reutiliza para resolver
  ],
  controllers: [EscalamientoController],
  providers: [EscalamientoService, EscalamientoTasks],
})
export class EscalamientoModule {}
