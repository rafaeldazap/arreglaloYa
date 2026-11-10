import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { TypeOrmModule } from '@nestjs/typeorm';
import { entidades } from './entidades/index.js';
import { AuthModule } from './auth/auth.module.js';
import { CatalogosModule } from './catalogos/catalogos.module.js';

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5432),
      username: process.env.DB_USER ?? 'postgres',
      password: process.env.DB_PASSWORD ?? 'postgres',
      database: process.env.DB_NAME ?? 'arreglaloya',
      entities: entidades,
      synchronize: true,
    }),
    AuthModule,
    CatalogosModule,
  ],
})
export class AppModule {}
