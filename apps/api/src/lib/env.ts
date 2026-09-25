/** Variables de entorno. En producción se inyectan con Doppler. */
export const env = {
  port: Number(process.env.PORT ?? 3000),
  deviceToken: process.env.DEVICE_TOKEN ?? "",
  corsOrigin: process.env.CORS_ORIGIN ?? "*",
  isProd: process.env.NODE_ENV === "production",
};

if (env.isProd && !env.deviceToken) {
  throw new Error("Falta DEVICE_TOKEN en producción");
}
