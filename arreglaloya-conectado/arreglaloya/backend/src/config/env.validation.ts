export function validateEnv(config: Record<string, unknown>) {
  const requiredVars = [
    'DB_HOST',
    'DB_PORT',
    'DB_USERNAME',
    'DB_PASSWORD',
    'DB_DATABASE',
    'JWT_SECRET',
  ];

  const missing = requiredVars.filter((key) => {
    const val = config[key];
    return val === undefined || val === null || String(val).trim() === '';
  });

  if (missing.length > 0) {
    throw new Error(
      `Faltan variables de entorno obligatorias en backend/.env: ${missing.join(', ')}`,
    );
  }

  const jwtSecret = String(config['JWT_SECRET']);
  if (jwtSecret.length < 32) {
    throw new Error('JWT_SECRET debe tener al menos 32 caracteres de longitud.');
  }

  const dbPort = Number(config['DB_PORT']);
  if (!Number.isInteger(dbPort) || dbPort <= 0 || dbPort > 65535) {
    throw new Error('DB_PORT debe ser un puerto TCP válido.');
  }

  return config;
}
