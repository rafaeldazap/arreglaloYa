# Backend - Arreglalo Ya 🛠️

Backend desarrollado en **Java 21** y **Spring Boot 3.4**, siguiendo la arquitectura limpia y modular de capas (Controller - Service - Repository - Entity - DTO) con seguridad JWT y documentación OpenAPI/Swagger.

---

## 🚀 Tecnologías

* **Java 21** (LTS)
* **Spring Boot 3.4.3**
* **Spring Data JPA / Hibernate**
* **Spring Security 6** + **JWT (JJWT 0.12.6)**
* **PostgreSQL**
* **Springdoc OpenAPI / Swagger UI**
* **ModelMapper** y **Lombok**
* **Maven Wrapper (`mvnw`)** incluido

---

## 📁 Estructura del Proyecto

```
backend/
├── pom.xml
├── mvnw / mvnw.cmd
├── base_de_datos.sql
└── src/
    └── main/
        ├── resources/
        │   └── application.yml
        └── java/com/arreglaloya/
            ├── ArreglaloYaApplication.java
            ├── config/          # SecurityConfig, CorsConfig, OpenApiConfig, ModelMapperConfig
            ├── security/        # JwtService, JwtAuthFilter, CustomUserDetailsService
            ├── exception/       # GlobalExceptionHandler, ResourceNotFoundException, BusinessException
            ├── enums/           # RolUsuario, EstadoCuenta, EstadoSolicitud, etc.
            ├── model/           # Entidades JPA (14 tablas del esquema de base de datos)
            ├── repository/      # Interfaces Spring Data JPA
            ├── dto/             # DTOs clasificados por dominio (auth, catalogo, trabajador, solicitud)
            ├── service/         # Lógica de negocio (AuthService, TrabajadorService, SolicitudService, etc.)
            └── controller/      # Endpoints REST (AuthController, CatalogoController, etc.)
```

---

## ⚙️ Configuración y Variables de Entorno

El archivo [`src/main/resources/application.yml`](src/main/resources/application.yml) ya viene configurado con valores por defecto para desarrollo local, y permite sobreescribir mediante variables de entorno:

| Variable | Valor por defecto | Descripción |
|---|---|---|
| `DB_URL` | `jdbc:postgresql://localhost:5432/arreglaloya_db` | URL de la base de datos |
| `DB_USERNAME` | `postgres` | Usuario de PostgreSQL |
| `DB_PASSWORD` | `postgres` | Contraseña |
| `JWT_SECRET` | *(clave aleatoria 256 bits)* | Clave para firmar tokens |

---

## 🏃‍♂️ Cómo Ejecutar

Desde la carpeta `backend`:

```powershell
# En Windows (usando el Maven Wrapper incluido):
.\mvnw.cmd spring-boot:run
```

---

## 📖 Documentación Interactiva (Swagger UI)

Una vez iniciado el backend, abre en tu navegador:

👉 **http://localhost:8080/api/v1/swagger-ui.html**

Aquí podrás probar directamente todos los endpoints:
* **Autenticación:** `/api/v1/auth/login`, `/api/v1/auth/registro-cliente`, `/api/v1/auth/registro-trabajador`.
* **Catálogos:** `GET /api/v1/categorias`, `GET /api/v1/zonas`.
* **Trabajadores:** `GET /api/v1/trabajadores?categoria=1&zona=2`, `GET /api/v1/trabajadores/{id}`.
* **Solicitudes:** `POST /api/v1/solicitudes`, `GET /api/v1/solicitudes/mis-pedidos`, `PATCH /api/v1/solicitudes/{id}/estado`.
