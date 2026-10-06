# Inicio rápido

**Documentación:** [Índice](README.md)

## 1. Dependencias

```bash
bun install
```

## 2. Variables de entorno (Doppler)

Las variables viven en Doppler, proyecto `mi_desroden`. Los scripts `dev`, `ios`, `android` y `start` corren con `doppler run --`.

```bash
doppler login
doppler setup          # elegí el config: dev_personal para lo tuyo, dev para el compartido
```

| Variable | Quién la usa | Valor |
|----------|--------------|-------|
| `EXPO_PUBLIC_SUPABASE_URL` | client | `https://eotdzgsisxfqyqbxwqna.supabase.co` |
| `EXPO_PUBLIC_SUPABASE_KEY` | client | Supabase → API Keys → **publishable** (nunca la secret) |
| `EXPO_PUBLIC_API_URL` | client | `http://localhost:3000/api/v1` (o la IP de tu máquina en un teléfono físico; en stg/prd, `https://<deploy>.vercel.app/api/v1`) |
| `PORT` | api | `3000` |
| `SUPABASE_URL` | api | Opcional: si no está, usa `EXPO_PUBLIC_SUPABASE_URL`. Con ella verifica los tokens de la app |
| `DEVICE_TOKEN` | api | El que tenga el firmware |
| `CORS_ORIGIN` | api | `*` en desarrollo |

Sin acceso a Doppler: copiá los `.env.example` a `.env` y usá `bun run dev:local` dentro de cada app.

## 3. Levantar API y cliente

```bash
bun dev
```

API en `http://localhost:3000/api/v1` (Swagger en `/api/v1/docs`), Expo en `http://localhost:8081`.

Probar que responde:

```bash
curl http://localhost:3000/api/v1/health
```

Simular una detección sin hardware:

```bash
curl -X POST http://localhost:3000/api/v1/detections \
  -H 'Content-Type: application/json' \
  -d '{"device_id":"esp32-01","etiqueta":"caja","confianza":0.91,"fuente":"camara"}'
```

## 4. Firmware

Con ESP-IDF v5.2+ instalado y el entorno cargado (`. $HOME/esp/esp-idf/export.sh`):

```bash
cd apps/firmware
idf.py set-target esp32s3
idf.py menuconfig      # menú "mi_desorden"
idf.py build
idf.py -p /dev/cu.usbmodem1101 flash monitor
```

> Antes del primer flash, revisá el pinout en [HARDWARE.md](HARDWARE.md). Si no coincide con tu placa, la cámara no arranca.
