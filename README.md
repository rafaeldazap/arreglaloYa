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
- Inicio de sesión y registro conectados a la API; menú y rutas protegidas según el rol (cliente, trabajador, administrador)
- Cliente: buscar trabajadores, ver perfiles, publicar solicitud con fotos, recibir cotizaciones, aceptar y pagar el anticipo del 25% (simulado), firmar conformidad y pago del saldo, calificar, reclamar y cancelar (RN-12)
- Trabajador: ver pedidos de su zona y especialidad, cotizar (con control de cruce de horarios), iniciar y terminar trabajos, confirmar el pago recibido, agenda y perfil
- Administrador: aprobar o rechazar trabajadores, administrar categorías y zonas, resolver reclamos y ver reportes
- Todo lo que no es inicio de sesión usa datos de prueba en `frontend/src/app/services/datos.service.ts`

**Versión demo:** `docs/index.html` (GitHub Pages), funciona sin backend. Cuentas de prueba con contraseña `123456`: `cliente@demo.com`, `trabajador@demo.com`, `admin@demo.com`.

## Endpoints que necesita el frontend (pendientes en el backend)

Cada método de `datos.service.ts` se reemplaza por una de estas llamadas:

| Método del frontend | Endpoint |
|---|---|
| obtenerTrabajadores | GET /api/trabajadores?zona=&categoria= |
| obtenerTrabajador | GET /api/trabajadores/:id |
| crearPedido | POST /api/solicitudes (con fotos) |
| pedidos del cliente | GET /api/solicitudes/mias |
| pedidosDisponibles | GET /api/solicitudes/disponibles (trabajador) |
| enviarCotizacion | POST /api/solicitudes/:id/cotizaciones |
| aceptarCotizacion | POST /api/cotizaciones/:id/aceptar |
| rechazarCotizacion | POST /api/cotizaciones/:id/rechazar |
| cancelarPedido | POST /api/solicitudes/:id/cancelar |
| iniciarServicio / marcarTerminado | PATCH /api/solicitudes/:id/estado |
| confirmarConformidad / confirmarRecepcionPago | POST /api/solicitudes/:id/pagos |
| calificar | POST /api/solicitudes/:id/calificacion |
| reclamar | POST /api/solicitudes/:id/reclamo |
| agendaDe | GET /api/trabajadores/:id/agenda |
| aprobarTrabajador / rechazarTrabajador | PATCH /api/admin/trabajadores/:id |
| agregarCatalogo / alternarCatalogo | POST y PATCH /api/categorias, /api/zonas |
| resolverReclamo | PATCH /api/admin/reclamos/:id |
| reportes | GET /api/admin/reportes |

## Equipo

| Integrante | Responsabilidad |
|---|---|
| (nombre) | [1] JavaScript/TypeScript: conexión frontend–API, tokens |
| (nombre) | [2] HTML y CSS |
| (nombre) | [3] Angular |
| (nombre) | [4] NestJS |
| (nombre) | [5] PostgreSQL y TypeORM |
