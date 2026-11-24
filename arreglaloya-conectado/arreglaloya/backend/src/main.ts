import { NestFactory, Reflector } from '@nestjs/core';
import { ClassSerializerInterceptor, ValidationPipe } from '@nestjs/common';
import { SwaggerModule, DocumentBuilder } from '@nestjs/swagger';
import { NestExpressApplication } from '@nestjs/platform-express';
import helmet from 'helmet';
import * as path from 'path';
import * as fs from 'fs';
import { AppModule } from './app.module';
import { AllExceptionsFilter } from './common/filters/http-exception.filter';

async function bootstrap() {
  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // Las fotos viajan como imágenes comprimidas en base64: se amplía el tamaño máximo del cuerpo
  app.useBodyParser('json', { limit: '10mb' });

  // Cabeceras HTTP de seguridad (permite cargar imágenes estáticas desde el frontend)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    }),
  );

  // Prefijo global de la API: /api/v1
  app.setGlobalPrefix('api/v1');

  // CORS restringido por lista blanca de orígenes configurados
  const allowedOrigins = (process.env.CORS_ORIGINS || 'http://localhost:4200,http://localhost:8080')
    .split(',')
    .map((o) => o.trim())
    .filter(Boolean);

  app.enableCors({
    origin: (origin, callback) => {
      // Permitir herramientas sin Origin (Postman, curl, móvil nativo) u orígenes en lista blanca
      // En desarrollo (Codespaces, localhost) se acepta cualquier origen
      const desarrollo = process.env.NODE_ENV !== 'production';
      if (!origin || desarrollo || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error(`Origen CORS no autorizado: ${origin}`), false);
      }
    },
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
  });

  // Servir archivos de /uploads de forma controlada
  const uploadDir = path.resolve(process.cwd(), process.env.UPLOAD_DIR || 'uploads');
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  app.useStaticAssets(uploadDir, { prefix: '/uploads/' });

  // Filtro global para ocultar stack traces y detalles internos de SQL
  app.useGlobalFilters(new AllExceptionsFilter());

  // Serialización automática respetando @Exclude() en entidades
  app.useGlobalInterceptors(new ClassSerializerInterceptor(app.get(Reflector)));

  // Validación automática estricta de DTOs
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      transform: true,
      forbidNonWhitelisted: true,
      transformOptions: { enableImplicitConversion: true },
    }),
  );

  // Documentación OpenAPI / Swagger UI (habilitada fuera de producción)
  if (process.env.NODE_ENV !== 'production') {
    const config = new DocumentBuilder()
      .setTitle('Arreglalo Ya - API REST')
      .setDescription(
        'Documentación técnica interactiva de la plataforma de servicios técnicos del hogar en Cochabamba (Sistemas de Información I)',
      )
      .setVersion('1.0.0')
      .addBearerAuth({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'JWT',
        name: 'JWT',
        description: 'Ingrese su token JWT (sin el prefijo "Bearer ")',
        in: 'header',
      })
      .build();

    const document = SwaggerModule.createDocument(app, config);
    SwaggerModule.setup('api/v1/swagger-ui', app, document);
  }

  const port = process.env.PORT || 8080;
  await app.listen(port);

  console.log(`\n======================================================`);
  console.log(`🚀 Backend Arreglalo Ya corriendo en: http://localhost:${port}/api/v1`);
  if (process.env.NODE_ENV !== 'production') {
    console.log(`📖 Documentación Swagger UI en: http://localhost:${port}/api/v1/swagger-ui`);
  }
  console.log(`======================================================\n`);
}

bootstrap();
