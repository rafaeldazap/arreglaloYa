-- =====================================================================
-- Datos de prueba para el PANEL DE ESTADÍSTICAS (opcional)
-- Inserta 80 solicitudes repartidas en los últimos 90 días, en distintas
-- categorías, zonas y estados, para que los gráficos tengan información.
-- Requiere que el backend ya haya arrancado una vez (cuentas de prueba y catálogos).
--
-- Ejecutar en el Codespace:
--   psql -h db -U postgres arreglaloya -f backend/datos_prueba_estadisticas.sql
-- Para borrarlas:
--   DELETE FROM solicitud_servicio WHERE descripcion LIKE '[prueba]%';
-- =====================================================================

SELECT setseed(0.42); -- misma "aleatoriedad" cada vez que se ejecuta

WITH datos AS (
  SELECT
    g,
    -- Plomería y Electricidad con más demanda que las demás
    (ARRAY['Plomería','Plomería','Plomería','Electricidad','Electricidad','Albañilería','Electrodomésticos'])
      [1 + floor(random() * 7)::int] AS categoria,
    -- Centro y Cala Cala con más actividad
    (ARRAY['Centro','Centro','Centro','Centro','Cala Cala','Cala Cala','Cala Cala','Queru Queru','Queru Queru',
           'Sarco','Sarco','Hipódromo','Sacaba','Quillacollo','Tiquipaya'])
      [1 + floor(random() * 15)::int] AS zona,
    (ARRAY['FINALIZADO','FINALIZADO','FINALIZADO','FINALIZADO','FINALIZADO','CANCELADO','CANCELADO',
           'EN_PROCESO','APROBADO','PENDIENTE','PENDIENTE','BAJO_REVISION','FUERA_DE_TIEMPO'])
      [1 + floor(random() * 13)::int] AS estado,
    NOW() - (random() * INTERVAL '90 days') AS fecha,
    round((60 + random() * 440)::numeric, 0) AS monto
  FROM generate_series(1, 80) AS g
)
INSERT INTO solicitud_servicio
  (id_cliente, id_trabajador, id_categoria, id_zona, descripcion, direccion_exacta,
   monto_ofrecido, estado, fecha_creacion, fecha_expiracion)
SELECT
  (SELECT id_usuario FROM usuario WHERE correo = 'cliente@demo.com'),
  -- Si el trabajo ya fue asignado, se le asigna un trabajador de esa especialidad (si existe)
  CASE WHEN d.estado IN ('APROBADO', 'EN_PROCESO', 'FINALIZADO') THEN
    (SELECT tc.id_perfil FROM trabajador_categoria tc WHERE tc.id_categoria = c.id_categoria LIMIT 1)
  END,
  c.id_categoria,
  z.id_zona,
  '[prueba] ' || c.nombre || ' en ' || z.nombre,
  'Dirección de prueba #' || d.g,
  d.monto,
  d.estado,
  d.fecha,
  d.fecha + INTERVAL '30 days'
FROM datos d
JOIN categoria c ON c.nombre = d.categoria
JOIN zona z ON z.nombre = d.zona;

SELECT estado, COUNT(*) FROM solicitud_servicio WHERE descripcion LIKE '[prueba]%' GROUP BY estado ORDER BY 2 DESC;
