# Arquitectura

**Documentación:** [Índice](README.md)

```
┌────────────────────┐        POST /devices/heartbeat        ┌──────────────────┐
│  apps/firmware     │ ────────────────────────────────────> │   apps/api       │
│  ESP32-S3          │        POST /detections               │   Bun + Elysia   │
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
| `apps/api` | Bun + Elysia. Recibe detecciones, las guarda y las sirve. Swagger en `/docs`. |
| `apps/client` | Expo + Expo Router. Tabs: dispositivos, historial, ajustes. |
| `packages/core` | Tipos (`Device`, `Detection`) y el cliente HTTP que usa el cliente Expo. |

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

Hoy es un **store en memoria** (`apps/api/src/lib/store.ts`): se pierde al reiniciar. Es a propósito, hasta elegir base de datos (ver [DECISIONES.md](DECISIONES.md)).

## Autenticación

El firmware manda `x-device-token`. La API todavía **no lo valida** — falta el middleware.
