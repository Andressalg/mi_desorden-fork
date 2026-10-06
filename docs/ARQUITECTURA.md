# Arquitectura

**Documentación:** [Índice](README.md)

```
┌────────────────────┐        POST /devices/heartbeat        ┌──────────────────┐
│  apps/firmware     │ ────────────────────────────────────> │   apps/api       │
│  ESP32-S3          │        POST /detections               │   NestJS (Bun)   │
│  cámara + mic      │                                       │                  │
└────────────────────┘                                       └────────┬─────────┘
                                                                      │ GET /devices
                                                                      │ GET /detections
                                                             ┌────────┴─────────┐
                                                             │  apps/client     │
                                                             │  Expo            │
                                                             └──────────────────┘
```

## Workspaces

| Workspace | Qué es |
|-----------|--------|
| `apps/firmware` | ESP-IDF v5 en C. Conecta WiFi, inicializa cámara e I2S, manda heartbeat y detecciones. |
| `apps/api` | NestJS sobre Bun, modular (ver abajo). Recibe heartbeats y detecciones del ESP32. Swagger en `/docs`. |
| `apps/client` | Expo + Expo Router. Tabs nativas (Liquid Glass en iOS 26+): inventario, cámara, accesos, perfil. Auth, inventarios y productos contra Supabase con Realtime. |
| `packages/core` | Tipos (`Device`, `Detection`) y el cliente HTTP que usa el cliente Expo. |

## Estructura del cliente

```
apps/client
├── api/            ÚNICA conexión con el backend
│   ├── config.ts       URLs y claves públicas (Doppler)
│   ├── supabase.ts     cliente de Supabase (solo se usa dentro de api/)
│   ├── http.ts         cliente de la API de Nest, con el access token de Supabase
│   ├── auth.ts         registro, login, sesión
│   ├── inventarios.ts · productos.ts · miembros.ts   datos (Supabase + RLS)
│   ├── dispositivos.ts ESP32 y detecciones (API de Nest)
│   ├── realtime.ts     cambios en vivo + presencia
│   ├── errores.ts      errores del backend → mensajes para mostrar
│   └── index.ts        lo único que importa el resto: `import { productos } from "@/api"`
├── lib/store.tsx   estado y caché (React Query); usa api/, no sabe de Supabase
├── app/            pantallas (Expo Router)
└── components/     UI
```

Regla: fuera de `api/` no se importa `@supabase/supabase-js` ni se hace `fetch`.

## Estructura de la API

```
apps/api/src
├── server.ts            arranque local (bun dev)
├── serverless.ts        handler para Vercel: arranca Nest una vez y lo reutiliza
├── app.setup.ts         CORS, ValidationPipe, filtro de errores y Swagger (lo comparten server y tests)
├── core.module.ts       raíz: ConfigModule + módulos
├── shared/              global: config/env, guards/device-token, filters/http-exception
└── modules/
    ├── health/          GET /health
    ├── devices/         controller · service · repository · dto
    └── detections/      controller · service · repository · dto
```

Cada módulo separa HTTP (controller), lógica (service) y datos (repository). Para pasar a Supabase solo cambian los repositories.

## Deploy (Vercel, igual que canchapp)

Proyecto de Vercel con **Root Directory = `apps/api`**. `vercel.json` usa `framework: null` y funciones propias en `apps/api/api/`:

| Función | Qué hace |
|---------|----------|
| `api/index.ts` | `GET /` y `/api`: responde sin cargar Nest |
| `api/v1/health/liveness.ts` | Probe liviano sin Nest, para un monitor de uptime externo |
| `api/v1/health/index.ts` | `GET /api/v1/health` pasando por Nest |
| `api/[[...path]].ts` | Todo `/api/v1/*` por rewrite → `dist/serverless.js` |

> Sin `crons` en `vercel.json`: el plan Hobby solo permite crons diarios y uno más frecuente hace fallar el deploy entero. Para mantener la función tibia, usar un monitor externo (UptimeRobot, Better Stack) contra `/api/v1/health/liveness`.

`bun run build` empaqueta `src/serverless.ts` en `dist/serverless.js` (CommonJS para Node). Variables en Vercel (vía Doppler): `NODE_ENV=production`, `DEVICE_TOKEN` (obligatoria en producción), `EXPO_PUBLIC_SUPABASE_URL` o `SUPABASE_URL`, `CORS_ORIGIN`. `ENABLE_SWAGGER=true` para ver `/api/v1/docs` fuera de desarrollo.

## Endpoints

| Método | Ruta | Para qué |
|--------|------|----------|
| GET | `/api/v1/health` | Healthcheck |
| GET | `/api/v1/auth/me` | La sesión según el token (requiere Bearer) |
| GET | `/api/v1/devices` | Lista de dispositivos |
| GET | `/api/v1/devices/:id` | Un dispositivo |
| POST | `/api/v1/devices/heartbeat` | El ESP32 avisa que está vivo |
| GET | `/api/v1/detections` | Historial (filtra por `device_id`) |
| POST | `/api/v1/detections` | El ESP32 registra una detección |

## Persistencia

- **App** → Supabase directo (auth, inventarios, productos) con RLS y Realtime. Esquema en `supabase/migrations/`.
- **API** → todavía en memoria (`DevicesRepository`, `DetectionsRepository`): se pierde al reiniciar. El paso siguiente es que esos repositories escriban en Supabase (ver [DECISIONES.md](DECISIONES.md)).

## Autenticación

Dos tipos de cliente, dos credenciales:

| Quién | Cómo se autentica | Dónde se valida |
|-------|-------------------|-----------------|
| App (usuarios) | `Authorization: Bearer <access_token de Supabase>` | `SesionGuard`, global |
| ESP32 | `x-device-token` | `DeviceTokenGuard` en las rutas `@Publico()` del firmware |

`SesionGuard` (en `apps/api/src/shared/auth/`):

- Verifica el JWT **localmente** con las claves públicas del proyecto (`/auth/v1/.well-known/jwks.json`, ES256, cacheadas 10 min). Si el proyecto usara JWT legacy, se configura `SUPABASE_JWT_SECRET` y verifica HS256.
- Exige emisor del proyecto, `aud = authenticated` y `role = authenticated` (la anon key no pasa).
- Responde siempre lo mismo ante un token malo: no se filtra qué falló.
- Cuenta tokens inválidos por IP: con `AUTH_MAX_FALLOS` (10) dentro de `AUTH_BLOQUEO_MIN` (15) la IP recibe `429` con `Retry-After`. En memoria: con varias instancias, pasar a Redis.
- Si no se pueden bajar las claves, devuelve `503` y no cuenta como intento fallido.

Además, global: `helmet` (headers de seguridad) y `@nestjs/throttler` (120 requests/min por IP).

Rutas sin sesión, marcadas con `@Publico()`: `GET /api/v1/health`, `POST /api/v1/devices/heartbeat`, `POST /api/v1/detections`. `GET /api/v1/auth/me` devuelve la sesión del token.

> En Vercel (`VERCEL=1`) se activa `trust proxy`, así `req.ip` es la del cliente y no la del proxy.
