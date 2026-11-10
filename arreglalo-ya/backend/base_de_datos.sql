-- Arréglalo Ya - Modelo inicial de base de datos (PostgreSQL)

CREATE TABLE usuario (
    id_usuario SERIAL PRIMARY KEY,
    nombre_completo VARCHAR(120) NOT NULL,
    telefono VARCHAR(20),
    correo VARCHAR(120) NOT NULL UNIQUE,
    password_hash VARCHAR(255) NOT NULL,
    rol VARCHAR(15) NOT NULL CHECK (rol IN ('CLIENTE', 'TRABAJADOR', 'ADMIN')),
    estado_cuenta VARCHAR(25) NOT NULL DEFAULT 'ACTIVO'
        CHECK (estado_cuenta IN ('REVISION', 'ACTIVO', 'SUSPENDIDO', 'BLOQUEADO_PERMANENTE')),
    nivel_fibonacci INTEGER NOT NULL DEFAULT 0,
    suspendido_hasta TIMESTAMPTZ
);

CREATE TABLE perfil_trabajador (
    id_perfil SERIAL PRIMARY KEY,
    id_usuario INTEGER NOT NULL UNIQUE REFERENCES usuario(id_usuario),
    ci_numero VARCHAR(20) NOT NULL UNIQUE,
    url_ci VARCHAR(255),
    url_antecedentes VARCHAR(255),
    url_experiencia VARCHAR(255),
    margen_error_min INTEGER NOT NULL DEFAULT 0 CHECK (margen_error_min >= 0),
    qr_imagen_url VARCHAR(255),
    qr_vigencia_min INTEGER CHECK (qr_vigencia_min > 0),
    promedio_semanal NUMERIC(3,2) DEFAULT 0,
    promedio_mensual NUMERIC(3,2) DEFAULT 0,
    promedio_anual NUMERIC(3,2) DEFAULT 0
);

CREATE TABLE categoria (
    id_categoria SERIAL PRIMARY KEY,
    nombre VARCHAR(60) NOT NULL UNIQUE,
    activa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE zona (
    id_zona SERIAL PRIMARY KEY,
    nombre VARCHAR(80) NOT NULL UNIQUE,
    activa BOOLEAN NOT NULL DEFAULT TRUE
);

CREATE TABLE trabajador_categoria (
    id_perfil INTEGER REFERENCES perfil_trabajador(id_perfil),
    id_categoria INTEGER REFERENCES categoria(id_categoria),
    PRIMARY KEY (id_perfil, id_categoria)
);

CREATE TABLE trabajador_zona (
    id_perfil INTEGER REFERENCES perfil_trabajador(id_perfil),
    id_zona INTEGER REFERENCES zona(id_zona),
    PRIMARY KEY (id_perfil, id_zona)
);

CREATE TABLE horario_atencion (
    id_horario SERIAL PRIMARY KEY,
    id_perfil INTEGER NOT NULL REFERENCES perfil_trabajador(id_perfil),
    dia_semana SMALLINT NOT NULL CHECK (dia_semana BETWEEN 1 AND 7),
    hora_inicio TIME NOT NULL,
    hora_fin TIME NOT NULL,
    CHECK (hora_fin > hora_inicio)
);

CREATE TABLE solicitud_servicio (
    id_solicitud SERIAL PRIMARY KEY,
    id_cliente INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_trabajador INTEGER REFERENCES perfil_trabajador(id_perfil),
    id_categoria INTEGER NOT NULL REFERENCES categoria(id_categoria),
    id_zona INTEGER NOT NULL REFERENCES zona(id_zona),
    descripcion TEXT NOT NULL,
    direccion_exacta VARCHAR(255) NOT NULL,
    monto_ofrecido NUMERIC(10,2),
    estado VARCHAR(25) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado IN ('PENDIENTE', 'BAJO_REVISION', 'APROBADO', 'EN_PROCESO', 'FINALIZADO', 'CANCELADO', 'FUERA_DE_TIEMPO')),
    fecha_creacion TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    fecha_expiracion TIMESTAMPTZ NOT NULL DEFAULT NOW() + INTERVAL '30 days',
    fecha_inicio_agendada TIMESTAMPTZ,
    fecha_fin_estimada TIMESTAMPTZ
);

CREATE TABLE foto_solicitud (
    id_foto SERIAL PRIMARY KEY,
    id_solicitud INTEGER NOT NULL REFERENCES solicitud_servicio(id_solicitud),
    url_foto VARCHAR(255) NOT NULL,
    fecha_carga TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE cotizacion (
    id_cotizacion SERIAL PRIMARY KEY,
    id_solicitud INTEGER NOT NULL REFERENCES solicitud_servicio(id_solicitud),
    id_trabajador INTEGER NOT NULL REFERENCES perfil_trabajador(id_perfil),
    requiere_visita BOOLEAN NOT NULL DEFAULT FALSE,
    costo_visita NUMERIC(10,2) NOT NULL DEFAULT 0,
    monto_total_propuesto NUMERIC(10,2) NOT NULL,
    incluye_materiales BOOLEAN NOT NULL DEFAULT FALSE,
    es_recotizacion BOOLEAN NOT NULL DEFAULT FALSE,
    estado_aprobacion VARCHAR(15) NOT NULL DEFAULT 'PENDIENTE'
        CHECK (estado_aprobacion IN ('PENDIENTE', 'ACEPTADA', 'RECHAZADA'))
);

CREATE TABLE transaccion_pago (
    id_pago SERIAL PRIMARY KEY,
    id_solicitud INTEGER NOT NULL REFERENCES solicitud_servicio(id_solicitud),
    tipo VARCHAR(15) NOT NULL CHECK (tipo IN ('ANTICIPO_25', 'SALDO_75')),
    medio_pago VARCHAR(20) NOT NULL CHECK (medio_pago IN ('PASARELA_APP', 'EFECTIVO', 'QR_TRABAJADOR')),
    monto NUMERIC(10,2) NOT NULL,
    url_comprobante VARCHAR(255),
    conformidad_cliente BOOLEAN NOT NULL DEFAULT FALSE,
    confirmado_por_trabajador BOOLEAN NOT NULL DEFAULT FALSE,
    liberado_al_trabajador BOOLEAN NOT NULL DEFAULT FALSE
);

CREATE TABLE reclamo_sancion (
    id_reclamo SERIAL PRIMARY KEY,
    id_solicitud INTEGER NOT NULL UNIQUE REFERENCES solicitud_servicio(id_solicitud),
    id_denunciante INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_denunciado INTEGER NOT NULL REFERENCES usuario(id_usuario),
    motivo VARCHAR(25) NOT NULL CHECK (motivo IN ('INASISTENCIA', 'MAL_ARREGLO', 'INCUMPLIMIENTO_PAGO', 'ROBO')),
    url_pruebas VARCHAR(255),
    estado_resolucion VARCHAR(15) NOT NULL DEFAULT 'EN_REVISION'
        CHECK (estado_resolucion IN ('EN_REVISION', 'PROCEDENTE', 'IMPROCEDENTE')),
    dias_suspension INTEGER NOT NULL DEFAULT 0
);

CREATE TABLE calificacion (
    id_calificacion SERIAL PRIMARY KEY,
    id_solicitud INTEGER NOT NULL REFERENCES solicitud_servicio(id_solicitud),
    id_evaluador INTEGER NOT NULL REFERENCES usuario(id_usuario),
    id_evaluado INTEGER NOT NULL REFERENCES usuario(id_usuario),
    puntaje SMALLINT NOT NULL CHECK (puntaje BETWEEN 1 AND 5),
    comentario TEXT,
    es_interna BOOLEAN NOT NULL DEFAULT FALSE,
    fecha TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE historial_estado (
    id_evento SERIAL PRIMARY KEY,
    id_solicitud INTEGER NOT NULL REFERENCES solicitud_servicio(id_solicitud),
    id_usuario INTEGER REFERENCES usuario(id_usuario),
    estado_anterior VARCHAR(25),
    estado_nuevo VARCHAR(25) NOT NULL,
    descripcion VARCHAR(255),
    fecha_hora TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Datos iniciales
INSERT INTO categoria (nombre) VALUES ('Plomería'), ('Electricidad'), ('Albañilería'), ('Electrodomésticos');
INSERT INTO zona (nombre) VALUES ('Centro'), ('Cala Cala'), ('Queru Queru'), ('Sarco'), ('Hipódromo'), ('Sacaba'), ('Quillacollo'), ('Tiquipaya');

SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' ORDER BY table_name;
