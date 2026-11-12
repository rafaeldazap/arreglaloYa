# Backend - Arreglalo Ya 🛠️

Backend desarrollado en **Java 21** y **Spring Boot 3.4**, siguiendo la arquitectura limpia en capas (Controller - Service - Repository - Entity - DTO) con seguridad JWT, manejo centralizado de excepciones y documentación OpenAPI/Swagger.

Cubre al 100% las **14 tablas** del modelo PostgreSQL.

---

## 🚀 Tecnologías

* **Java 21** (LTS)
* **Spring Boot 3.4.3**
* **Spring Data JPA / Hibernate** (Schema `public`, `ddl-auto: update`)
* **Spring Security 6** + **JWT (JJWT 0.12.6)**
* **PostgreSQL**
* **Springdoc OpenAPI / Swagger UI**
* **ModelMapper** y **Lombok**
* **Maven Wrapper (`mvnw.cmd`)** incluido

---

## 📁 Módulos y Cobertura de Base de Datos

| Tabla en BD | Entidad JPA | Controlador | Descripción / Endpoints |
|---|---|---|---|
| `usuario` | `Usuario` | `AuthController` | Login, registro de cliente y trabajador, emisión de JWT |
| `perfil_trabajador` | `PerfilTrabajador` | `TrabajadorController` | Búsqueda por filtros (zona/categoría) y consulta de perfil |
| `categoria` | `Categoria` | `CatalogoController` | `GET /categorias` (Plomería, Electricidad, etc.) |
| `zona` | `Zona` | `CatalogoController` | `GET /zonas` (Cala Cala, Queru Queru, etc.) |
| `trabajador_categoria` | *(ManyToMany)* | - | Relación trabajadores y especialidades |
| `trabajador_zona` | *(ManyToMany)* | - | Relación trabajadores y zonas que cubren |
| `horario_atencion` | `HorarioAtencion` | - | Horarios disponibles por trabajador |
| `solicitud_servicio` | `SolicitudServicio` | `SolicitudController` | Creación de pedidos, listado propio y transición de estados |
| `foto_solicitud` | `FotoSolicitud` | `SolicitudController` | Fotos asociadas a cada solicitud |
| `cotizacion` | `Cotizacion` | `CotizacionController` | Propuesta de costo por trabajador, aceptación o rechazo por cliente |
| `transaccion_pago` | `TransaccionPago` | `PagoController` | Anticipo (25%), saldo final (75%) y confirmación de liberación |
| `reclamo_sancion` | `ReclamoSancion` | `ReclamoController` | Disputas (inasistencia, robo, etc.) y suspensiones por ADMIN |
| `calificacion` | `Calificacion` | `CalificacionController` | Calificaciones (1-5 estrellas) y recálculo automático de promedios |
| `historial_estado` | `HistorialEstado` | - | Auditoría automática de cambios de estado de cada servicio |

---

## ⚙️ Configuración y Variables de Entorno

El archivo [`src/main/resources/application.yml`](src/main/resources/application.yml) viene listo para desarrollo local y producción:

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/arreglaloya_db` | URL de conexión PostgreSQL |
| `DB_USERNAME` | `postgres` | Usuario de base de datos |
| `DB_PASSWORD` | `postgres` | Contraseña |
| `JWT_SECRET` | *(Clave de 256 bits predeterminada)* | Clave para firma de tokens JWT |

---

## 🏃‍♂️ Cómo Ejecutar

Desde la carpeta `backend`:

```powershell
# En Windows (con el Maven Wrapper incluido):
.\mvnw.cmd spring-boot:run
```

---

## 📖 Documentación Interactiva (Swagger UI)

Con el backend en ejecución, abre en tu navegador:

👉 **http://localhost:8080/api/v1/swagger-ui.html**
