# Backend — API REST (NestJS + TypeORM + PostgreSQL)

## Cómo correrlo

En el Codespace, PostgreSQL ya está corriendo. En una terminal:

```
cd backend
npm run start:dev
```

La API queda en `http://localhost:3000/api`. Al arrancar, TypeORM crea las tablas solo (`synchronize: true`, solo para desarrollo) y carga las categorías y zonas iniciales.

## Estructura

```
src/
  main.ts                 Arranque: prefijo /api, validación de datos
  app.module.ts           Conexión a PostgreSQL con TypeORM
  entidades/              Las 12 entidades del diagrama de clases
  auth/                   Registro, inicio de sesión y token JWT
  catalogos/              Categorías y zonas
```

## Endpoints

| Método | Ruta | Qué hace | Requiere token |
|---|---|---|---|
| POST | /api/auth/registro | Registra cliente o trabajador (el trabajador queda EN REVISIÓN) | No |
| POST | /api/auth/login | Inicia sesión y devuelve el token JWT | No |
| GET | /api/auth/perfil | Datos del usuario que inició sesión | Sí |
| GET | /api/categorias | Lista de categorías activas | No |
| GET | /api/zonas | Lista de zonas activas | No |

Ejemplo de registro:

```json
POST /api/auth/registro
{
  "nombre": "Juan Mamani",
  "correo": "juan@gmail.com",
  "password": "123456",
  "rol": "TRABAJADOR",
  "ci": "1234567",
  "especialidades": ["Plomería"],
  "zonas": ["Centro", "Sarco"]
}
```

## Seguridad

- Las contraseñas se guardan cifradas con bcrypt (nunca en texto plano).
- El token JWT dura 8 horas y se envía en el encabezado `Authorization: Bearer <token>`.
- Las cuentas suspendidas o bloqueadas no pueden iniciar sesión.

`base_de_datos.sql` es el script del modelo para revisarlo directamente en PostgreSQL.
