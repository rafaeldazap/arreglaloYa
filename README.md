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

### Opción A: GitHub Codespaces (sin instalar nada)

En GitHub: **Code → Codespaces → Create codespace on main**. Trae Node.js 24 y PostgreSQL 16 listos, y las variables del backend ya configuradas (no hace falta `.env`).

Terminal 1 (backend):

```
cd backend
npm run start:dev
```

Debe aparecer `Nest application successfully started` y `Backend Arreglalo Ya corriendo en: http://localhost:8080/api/v1`.

Terminal 2 (frontend):

```
cd frontend
npm start
```

Abrir el puerto **4200** (pestaña Puertos). El frontend manda todo lo que empieza con `/api` al backend (puerto 8080) mediante `frontend/proxy.conf.json`.

> Si el Codespace se creó antes de este cambio: **Ctrl+Shift+P → Codespaces: Rebuild Container**.

### Opción B: en la computadora (Windows)

1. Instalar Node.js 24 y PostgreSQL 16.
2. `cd backend`, copiar `.env.example` a `.env` y poner la contraseña de PostgreSQL.
3. `npm install` y `npm run start:dev` en `backend`; `npm install` y `npm start` en `frontend`.
4. Abrir http://localhost:4200

### Cuentas de prueba

Se crean solas la primera vez que arranca el backend (contraseña `123456`):

| Correo | Rol |
|---|---|
| cliente@demo.com | Cliente |
| trabajador@demo.com | Trabajador (plomería: Centro, Cala Cala, Sarco) |
| admin@demo.com | Administrador |

Documentación de la API (Swagger): http://localhost:8080/api/v1/swagger-ui

### Ver la base de datos

En el Codespace: `psql -h db -U postgres arreglaloya` (contraseña `postgres`), luego por ejemplo `select * from usuario;`.

## Avance actual

**Backend (NestJS + TypeORM + PostgreSQL)** — prefijo `/api/v1`, puerto 8080
- 12 entidades, validación de datos, JWT, roles (cliente, trabajador, administrador), Swagger
- Registro e inicio de sesión; el trabajador queda en revisión hasta que el administrador lo apruebe
- Solicitudes, cotizaciones con control de cruce de horarios (RN-10), pagos con anticipo del 25% y doble firma, calificaciones, reclamos con sanción, categorías y zonas, caducidad a los 30 días (RN-08)
- Módulo `panel`: junta en una sola respuesta los datos que cada pantalla necesita y crea las cuentas de prueba

**Frontend (Angular)** — conectado al backend en todas las pantallas
- Cliente: buscar trabajadores, ver perfiles, publicar solicitud con fotos, recibir cotizaciones, aceptar y pagar el anticipo (simulado), firmar conformidad y pago del saldo, calificar, reclamar y cancelar (RN-12)
- Trabajador: pedidos de su zona y especialidad, cotizar, iniciar y terminar trabajos, confirmar el pago recibido, agenda y perfil
- Administrador: aprobar o rechazar trabajadores, administrar categorías y zonas, resolver reclamos y ver reportes

**Versión demo:** `docs/index.html` (GitHub Pages) funciona sin backend con datos de prueba (`npm run build -- --configuration demo`).

## Cómo se conectan

| Acción en la pantalla | Endpoint |
|---|---|
| Iniciar sesión / registrarse | POST /api/v1/auth/login, /auth/registro-cliente, /auth/registro-trabajador |
| Categorías y zonas | GET /api/v1/categorias, /zonas (admin: POST y PATCH .../activar, .../desactivar) |
| Trabajadores y perfiles | GET /api/v1/panel/trabajadores (admin: /panel/trabajadores/todos) |
| Pedidos de cada usuario | GET /api/v1/panel/pedidos |
| Publicar solicitud | POST /api/v1/solicitudes |
| Cancelar | PATCH /api/v1/solicitudes/:id/cancelar |
| Cotizar | POST /api/v1/cotizaciones |
| Aceptar / rechazar cotización | PATCH /api/v1/cotizaciones/:id/responder?estado=ACEPTADA o RECHAZADA |
| Pagar anticipo / saldo | POST /api/v1/pagos |
| Trabajador confirma el pago | PATCH /api/v1/pagos/:id/confirmar |
| Iniciar / terminar servicio | PATCH /api/v1/panel/pedidos/:id/iniciar, .../terminar |
| Calificar | POST /api/v1/calificaciones |
| Reclamar / resolver | POST /api/v1/reclamos, PATCH /api/v1/reclamos/:id/resolver |
| Aprobar o rechazar trabajador | PATCH /api/v1/trabajadores/:id/verificar |
| Panel de estadísticas (admin) | GET /api/v1/estadisticas/admin?desde=&hasta=&idCategoria=&idZona=&agrupacion= |

## Equipo

| Integrante | Responsabilidad |
|---|---|
| (nombre) | [1] JavaScript/TypeScript: conexión frontend–API, tokens |
| (nombre) | [2] HTML y CSS |
| (nombre) | [3] Angular |
| (nombre) | [4] NestJS |
| (nombre) | [5] PostgreSQL y TypeORM |
