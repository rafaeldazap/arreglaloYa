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
import { UploadsModule } from './modules/uploads/uploads.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      validate: validateEnv,
    }),
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 120,
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
    UploadsModule,
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class AppModule {}
