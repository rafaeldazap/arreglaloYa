import { Module } from "@nestjs/common";
import { TypeOrmModule } from "@nestjs/typeorm";
import { Categoria, Zona } from "../../entities";
import { EstadisticasController } from "./estadisticas.controller";
import { EstadisticasService } from "./estadisticas.service";

@Module({
  imports: [TypeOrmModule.forFeature([Categoria, Zona])],
  controllers: [EstadisticasController],
  providers: [EstadisticasService],
})
export class EstadisticasModule {}
