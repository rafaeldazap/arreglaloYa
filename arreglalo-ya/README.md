# Arréglalo Ya

Plataforma web para encontrar trabajadores de servicios del hogar (plomería, electricidad, albañilería y electrodomésticos) en Cochabamba.

Proyecto de la materia Sistemas de Información I.

## Tecnologías

| Parte | Tecnología |
|---|---|
| Frontend | Angular 22, TypeScript, HTML, CSS |
| Backend | NestJS (Node.js), API REST |
| Base de datos | PostgreSQL con TypeORM |
| Versión de Node.js del equipo | 24 (LTS) |

## Estructura

```
frontend/   Aplicación Angular
backend/    API REST NestJS
```

## Cómo correr el proyecto

Sin instalar nada: en GitHub, botón **Code → Codespaces → Create codespace on main**. El Codespace trae Node.js 24 y PostgreSQL 16 listos.

Terminal 1 (backend):

```
cd backend
npm run start:dev
```

Terminal 2 (frontend):

```
cd frontend
npm start
```

Luego abrir el puerto 4200 (pestaña Puertos). El frontend envía las peticiones `/api` al backend mediante `frontend/proxy.conf.json`.

## Avance actual

**Backend (NestJS)**
- Conexión a PostgreSQL con TypeORM y las 12 entidades del diagrama de clases
- Registro de cliente y trabajador (el trabajador queda en revisión), con contraseñas cifradas con bcrypt
- Inicio de sesión con token JWT
- Catálogo de categorías y zonas

**Frontend (Angular)**
- Inicio de sesión y registro conectados a la API
- Página de inicio con buscador por especialidad y zona
- Búsqueda de trabajadores, perfil con opiniones, nueva solicitud con fotos y mis pedidos con seguimiento (todavía con datos de prueba en `frontend/src/app/services/datos.service.ts`)

## Equipo

| Integrante | Responsabilidad |
|---|---|
| (nombre) | [1] JavaScript/TypeScript: conexión frontend–API, tokens |
| (nombre) | [2] HTML y CSS |
| (nombre) | [3] Angular |
| (nombre) | [4] NestJS |
| (nombre) | [5] PostgreSQL y TypeORM |
