/** Valida y normaliza las variables de entorno al arrancar. */
export function validarEnv(crudo: Record<string, unknown>) {
  const texto = (k: string) => (crudo[k] == null ? "" : String(crudo[k]).trim());

  const env = {
    NODE_ENV: texto("NODE_ENV") || "development",
    PORT: Number(texto("PORT") || 3000),
    CORS_ORIGIN: texto("CORS_ORIGIN") || "*",
    DEVICE_TOKEN: texto("DEVICE_TOKEN"),
    /** La misma URL que usa la app; en Doppler alcanza con EXPO_PUBLIC_SUPABASE_URL. */
    SUPABASE_URL: (texto("SUPABASE_URL") || texto("EXPO_PUBLIC_SUPABASE_URL")).replace(/\/$/, ""),
    /** Solo para proyectos con JWT legacy (HS256). Los nuevos firman con claves asimétricas (JWKS). */
    SUPABASE_JWT_SECRET: texto("SUPABASE_JWT_SECRET"),
    /** Tokens inválidos que se toleran por IP antes de bloquearla. */
    AUTH_MAX_FALLOS: Number(texto("AUTH_MAX_FALLOS") || 10),
    AUTH_BLOQUEO_MIN: Number(texto("AUTH_BLOQUEO_MIN") || 15),
  };

  if (!Number.isInteger(env.PORT) || env.PORT <= 0) {
    throw new Error(`PORT inválido: ${texto("PORT")}`);
  }
  if (env.NODE_ENV === "production" && !env.DEVICE_TOKEN) {
    throw new Error("Falta DEVICE_TOKEN en producción");
  }
  // Nunca se imprime el valor: si alguien pegó la cadena de Postgres, trae la contraseña.
  if (
    !/^https:\/\/[a-z0-9-]+\.supabase\.(co|in)$/i.test(env.SUPABASE_URL) &&
    !/^http:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/.test(env.SUPABASE_URL)
  ) {
    throw new Error(
      "SUPABASE_URL (o EXPO_PUBLIC_SUPABASE_URL) falta o no es la URL https del proyecto (https://<ref>.supabase.co). No uses la cadena de conexión de Postgres.",
    );
  }
  return env;
}

export type Env = ReturnType<typeof validarEnv>;
