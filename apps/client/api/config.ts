/** Variables públicas del backend. Vienen de Doppler (o del .env con `dev:local`). */
export const config = {
  apiUrl: (process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000/api/v1").replace(/\/$/, ""),
  supabaseUrl: process.env.EXPO_PUBLIC_SUPABASE_URL ?? "",
  supabaseKey: process.env.EXPO_PUBLIC_SUPABASE_KEY ?? "",
};

if (!config.supabaseUrl || !config.supabaseKey) {
  throw new Error(
    "Faltan EXPO_PUBLIC_SUPABASE_URL y EXPO_PUBLIC_SUPABASE_KEY: cargalas en Doppler (proyecto mi_desroden) o en apps/client/.env",
  );
}
if (!/^https:\/\//.test(config.supabaseUrl) && !/^http:\/\/localhost/.test(config.supabaseUrl)) {
  // No se imprime el valor: si es la cadena de Postgres, trae la contraseña.
  throw new Error(
    "EXPO_PUBLIC_SUPABASE_URL tiene que ser la URL https del proyecto, no la cadena de conexión de Postgres",
  );
}
