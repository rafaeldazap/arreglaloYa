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
backend/    API NestJS (en desarrollo)
```

## Cómo correr el frontend

Sin instalar nada: en GitHub, botón **Code → Codespaces → Create codespace on main**. Cuando termine de cargar, en la terminal:

```
cd frontend
npm start
```

En tu computadora (con Node.js 24 instalado):

```
cd frontend
npm install
npm start
```

Luego abrir http://localhost:4200

## Avance actual (frontend)

- Página de inicio con buscador por especialidad y zona
- Registro de cliente y de trabajador (el trabajador queda en revisión)
- Inicio de sesión (simulado)
- Búsqueda de trabajadores con filtros
- Perfil del trabajador con especialidades, zonas y opiniones
- Nueva solicitud con fotos, zona, fecha, dirección y monto ofrecido
- Mis pedidos con seguimiento por estados, historial y cancelación

Por ahora los datos son de prueba (`frontend/src/app/services/datos.service.ts`). Cuando el backend esté listo se reemplazan por llamadas a la API REST.

## Equipo

| Integrante | Responsabilidad |
|---|---|
| (nombre) | [1] JavaScript/TypeScript: conexión frontend–API, tokens |
| (nombre) | [2] HTML y CSS |
| (nombre) | [3] Angular |
| (nombre) | [4] NestJS |
| (nombre) | [5] PostgreSQL y TypeORM |
