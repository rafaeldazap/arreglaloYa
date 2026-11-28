import { ConfigService } from '@nestjs/config';
import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import {
  Usuario,
  PerfilTrabajador,
  Categoria,
  Zona,
  HorarioAtencion,
  SolicitudServicio,
  FotoSolicitud,
  Cotizacion,
  TransaccionPago,
  ReclamoSancion,
  Calificacion,
  HistorialEstado,
  SuspensionTrabajador,
} from '../entities';

export const getTypeOrmConfig = (configService: ConfigService): TypeOrmModuleOptions => ({
  type: 'postgres',
  host: configService.getOrThrow<string>('DB_HOST'),
  port: parseInt(configService.getOrThrow<string>('DB_PORT'), 10),
  username: configService.getOrThrow<string>('DB_USERNAME'),
  password: configService.getOrThrow<string>('DB_PASSWORD'),
  database: configService.getOrThrow<string>('DB_DATABASE'),
  entities: [
    Usuario,
    PerfilTrabajador,
    Categoria,
    Zona,
    HorarioAtencion,
    SolicitudServicio,
    FotoSolicitud,
    Cotizacion,
    TransaccionPago,
    ReclamoSancion,
    Calificacion,
    HistorialEstado,
    SuspensionTrabajador,
  ],
  // DB_SYNC=true crea/actualiza las tablas automáticamente (útil en Codespaces).
  // Si ya ejecutaste base_de_datos.sql puedes dejarlo en false.
  synchronize: configService.get<string>('DB_SYNC') === 'true',
  logging: ['error', 'warn'],
});
