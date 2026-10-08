/**
 * Como `bun dev`, pero para probar en un teléfono físico: la app le pega a la
 * API de esta Mac por su IP en la red (localhost en el teléfono es el teléfono).
 * El teléfono y la Mac tienen que estar en la misma red.
 *
 * Uso: bun run dev:telefono
 */
import { networkInterfaces } from "node:os";

const ip = Object.values(networkInterfaces())
  .flat()
  .find((i) => i && i.family === "IPv4" && !i.internal && /^(192\.168|10\.|172\.)/.test(i.address))
  ?.address;

if (!ip) {
  console.error("✖ No encontré la IP de esta Mac en la red. ¿Estás conectado al Wi-Fi?");
  process.exit(1);
}

const api = `http://${ip}:3000`;
console.log(`\n  Teléfono → API en ${api}/api/v1 (misma red Wi-Fi)\n`);

// Las variables de afuera ganan: la app monta Doppler en un .env (no pisa el
// entorno) y API_PUBLIC_URL no está en Doppler.
const proceso = Bun.spawn(["bun", "run", "dev"], {
  env: {
    ...process.env,
    EXPO_PUBLIC_API_URL: `${api}/api/v1`,
    API_PUBLIC_URL: api,
  },
  stdio: ["inherit", "inherit", "inherit"],
});
process.exit(await proceso.exited);
