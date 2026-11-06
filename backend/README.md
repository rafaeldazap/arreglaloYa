# Backend (NestJS + TypeORM + PostgreSQL)

En desarrollo. Aquí irá la API REST del sistema.

Primeros pasos planificados:

1. Crear el proyecto con `npx @nestjs/cli new backend`.
2. Configurar la conexión a PostgreSQL con TypeORM.
3. Crear las entidades del diagrama de clases: Usuario, PerfilTrabajador, Categoria, Zona, HorarioAtencion, SolicitudServicio, FotoSolicitud, Cotizacion, TransaccionPago, ReclamoSancion, Calificacion e HistorialEstado.
4. Primeros endpoints: `POST /auth/registro`, `POST /auth/login`, `GET /trabajadores?zona=&categoria=`.

El script `base_de_datos.sql` tiene las tablas principales para revisar el modelo en PostgreSQL.
