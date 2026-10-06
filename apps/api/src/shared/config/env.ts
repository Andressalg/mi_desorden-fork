/** Valida y normaliza las variables de entorno al arrancar. */
export function validarEnv(crudo: Record<string, unknown>) {
  const env = {
    NODE_ENV: String(crudo.NODE_ENV ?? "development"),
    PORT: Number(crudo.PORT ?? 3000),
    CORS_ORIGIN: String(crudo.CORS_ORIGIN ?? "*"),
    DEVICE_TOKEN: String(crudo.DEVICE_TOKEN ?? ""),
  };

  if (!Number.isInteger(env.PORT) || env.PORT <= 0) {
    throw new Error(`PORT inválido: ${String(crudo.PORT)}`);
  }
  if (env.NODE_ENV === "production" && !env.DEVICE_TOKEN) {
    throw new Error("Falta DEVICE_TOKEN en producción");
  }
  return env;
}

export type Env = ReturnType<typeof validarEnv>;
