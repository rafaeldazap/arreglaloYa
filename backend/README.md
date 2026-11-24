# Backend - Arreglalo Ya 🛠️ (NestJS + TypeORM)

Backend oficial de la materia **Sistemas de Información I**, desarrollado con **NestJS (Node.js)** y **TypeORM**, conectado a **PostgreSQL**.

*(Nota: La versión previa en Spring Boot quedó respaldada en `backend-spring-backup`).*

---

## 🚀 Tecnologías y Seguridad

* **Node.js**: v20+ / v24 (LTS)
* **Framework**: **NestJS v10** (TypeScript)
* **ORM**: **TypeORM v0.3** + **PostgreSQL**
* **Seguridad**:
  * Passport.js + `@nestjs/jwt` (JWT Bearer Token) + `bcrypt`
  * Control de acceso basado en roles (**RBAC**: `CLIENTE`, `TRABAJADOR`, `ADMIN`) y propiedad por recurso (anti-IDOR)
  * `helmet` + CORS por lista blanca (`CORS_ORIGINS`) + `@nestjs/throttler` (rate limiting)
  * Serialización segura (`select: false` + `@Exclude()` en `passwordHash`, filtro global de excepciones)
  * `@nestjs/schedule` para caducidad automática a los 30 días (**RN-08**)
* **Validación**: `class-validator` y `class-transformer` (`whitelist: true`, `forbidNonWhitelisted: true`)
* **Documentación**: Swagger / OpenAPI en `/api/v1/swagger-ui` (solo en desarrollo)

---

## ⚙️ Variables de Entorno

Copia `.env.example` a `.env` y completa tus credenciales locales (nunca subas `.env` a Git):

```bash
cp .env.example .env
```

Variables requeridas:

```env
PORT=8080
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USERNAME=postgres
DB_PASSWORD=TU_PASSWORD_DE_POSTGRES
DB_DATABASE=postgres
JWT_SECRET=TU_SECRETO_JWT_DE_AL_MENOS_32_CARACTERES
JWT_EXPIRATION=86400s
CORS_ORIGINS=http://localhost:4200,http://localhost:8080
UPLOAD_DIR=uploads
```

---

## 🏃‍♂️ Cómo Ejecutar

Desde la carpeta `backend`:

```powershell
# Instalar dependencias (solo primera vez)
npm install

# Compilar TypeScript
npm run build

# Modo desarrollo con recarga automática (watch mode):
npm run start:dev

# O modo producción compilado:
npm run start:prod
```

---

## 📖 Documentación Swagger UI

Con `NODE_ENV=development` y el servidor corriendo, abre en tu navegador:

👉 **http://localhost:8080/api/v1/swagger-ui**
