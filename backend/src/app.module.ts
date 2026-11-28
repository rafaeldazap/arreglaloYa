import { Module } from '@nestjs/common';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';
import { ScheduleModule } from '@nestjs/schedule';
import { APP_GUARD } from '@nestjs/core';

import { validateEnv } from './config/env.validation';
import { getTypeOrmConfig } from './config/typeorm.config';

import { AuthModule } from './modules/auth/auth.module';
import { CatalogosModule } from './modules/catalogos/catalogos.module';
import { TrabajadoresModule } from './modules/trabajadores/trabajadores.module';
import { SolicitudesModule } from './modules/solicitudes/solicitudes.module';
import { CotizacionesModule } from './modules/cotizaciones/cotizaciones.module';
import { PagosModule } from './modules/pagos/pagos.module';
import { CalificacionesModule } from './modules/calificaciones/calificaciones.module';
import { ReclamosModule } from './modules/reclamos/reclamos.module';
import { PanelModule } from './modules/panel/panel.module';
import { EscalamientoModule } from './modules/escalamiento/escalamiento.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 1000,
      },
    ]),
    ScheduleModule.forRoot(),
    TypeOrmModule.forRootAsync({
      inject: [ConfigService],
      useFactory: getTypeOrmConfig,
    }),
    AuthModule,
    CatalogosModule,
    TrabajadoresModule,
    SolicitudesModule,
    CotizacionesModule,
    PagosModule,
    CalificacionesModule,
    ReclamosModule,
    PanelModule,
    EscalamientoModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
