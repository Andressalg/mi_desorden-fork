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

## Estructura de la API

```
apps/api/src
├── server.ts            arranque
├── app.setup.ts         CORS, ValidationPipe, filtro de errores y Swagger (lo comparten server y tests)
├── core.module.ts       raíz: ConfigModule + módulos
├── shared/              global: config/env, guards/device-token, filters/http-exception
└── modules/
    ├── health/          GET /health
    ├── devices/         controller · service · repository · dto
    └── detections/      controller · service · repository · dto
```

Cada módulo separa HTTP (controller), lógica (service) y datos (repository). Para pasar a Supabase solo cambian los repositories.

## Endpoints

| Método | Ruta | Para qué |
|--------|------|----------|
| GET | `/health` | Healthcheck |
| GET | `/devices` | Lista de dispositivos |
| GET | `/devices/:id` | Un dispositivo |
| POST | `/devices/heartbeat` | El ESP32 avisa que está vivo |
| GET | `/detections` | Historial (filtra por `device_id`) |
| POST | `/detections` | El ESP32 registra una detección |

## Persistencia

- **App** → Supabase directo (auth, inventarios, productos) con RLS y Realtime. Esquema en `supabase/migrations/`.
- **API** → todavía en memoria (`DevicesRepository`, `DetectionsRepository`): se pierde al reiniciar. El paso siguiente es que esos repositories escriban en Supabase (ver [DECISIONES.md](DECISIONES.md)).

## Autenticación

El firmware manda `x-device-token`; `DeviceTokenGuard` lo valida en los `POST` contra `DEVICE_TOKEN`. Si la variable está vacía (desarrollo) deja pasar; en producción es obligatoria.
