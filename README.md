# mi_desorden

Reconocimiento de objetos con un **ESP32-S3** con cámara y micrófono: identifica lo que hay dando vueltas (cajas, bolsas, herramientas) y lo manda a una API para verlo desde el celular.

> Estado: **estructura inicial**. El reconocimiento todavía no está implementado — falta decidir dónde corre el modelo (ver [docs/DECISIONES.md](docs/DECISIONES.md)).

## Arquitectura

```
ESP32-S3 (cámara + mic)  ──HTTP──>  api (Bun + Elysia)  <──HTTP──  client (Expo)
       apps/firmware                    apps/api                    apps/client
                                            │
                                     packages/core
                                  (tipos + cliente HTTP)
```

## Stack

| Capa | Tecnología |
|------|------------|
| Monorepo | Bun workspaces + Turborepo (TUI) |
| Firmware | ESP-IDF v5 (C) sobre ESP32-S3 |
| API | Bun + Elysia + Swagger |
| Cliente | Expo (React Native) + Expo Router + TanStack Query |
| Compartido | `packages/core` — tipos y cliente HTTP |
| Env vars | Doppler |

## Requisitos

- [Bun](https://bun.sh)
- [ESP-IDF v5.2+](https://docs.espressif.com/projects/esp-idf/en/stable/esp32s3/get-started/) (solo para el firmware)
- [Doppler](https://doppler.com) (opcional, para envs)

## Setup

```bash
bun install
cp apps/api/.env.example apps/api/.env
cp apps/client/.env.example apps/client/.env
```

## Levantar el proyecto

```bash
bun dev        # api (:3000) + client (:8081) en el TUI de Turbo
bun run api    # solo la API
bun run client # solo el cliente Expo
```

Firmware:

```bash
cd apps/firmware
idf.py set-target esp32s3
idf.py menuconfig          # menú "mi_desorden": WiFi, URL de la API, token
idf.py build flash monitor
```

## Scripts

| Comando | Qué hace |
|---------|----------|
| `bun dev` | Todo: API + cliente |
| `bun run build` | Build de todas las apps |
| `bun run lint` | ESLint en todo el monorepo |
| `bun run typecheck` | `tsc --noEmit` por workspace |
| `bun run test` | `bun test` por workspace |
| `bun run fw:build` | Compila el firmware (necesita ESP-IDF) |

## Ramas

`develop` (por defecto) → `staging` → `production`. Detalle en [docs/BRANCHING.md](docs/BRANCHING.md).

## Documentación

- [Arquitectura](docs/ARQUITECTURA.md)
- [Hardware](docs/HARDWARE.md)
- [Decisiones pendientes](docs/DECISIONES.md)
- [Roadmap](docs/ROADMAP.md)
- [Inicio rápido](docs/QUICKSTART.md)
- [Ramas](docs/BRANCHING.md)
