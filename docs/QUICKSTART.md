# Inicio rápido

**Documentación:** [Índice](README.md)

## 1. Dependencias

```bash
bun install
```

## 2. Variables de entorno

```bash
cp apps/api/.env.example apps/api/.env
cp apps/client/.env.example apps/client/.env
```

En `apps/client/.env`, si vas a probar en un teléfono físico, poné la IP de tu máquina en vez de `localhost`:

```
EXPO_PUBLIC_API_URL=http://192.168.1.100:3000
```

## 3. Levantar API y cliente

```bash
bun dev
```

API en `http://localhost:3000` (Swagger en `/docs`), Expo en `http://localhost:8081`.

Probar que responde:

```bash
curl http://localhost:3000/health
```

Simular una detección sin hardware:

```bash
curl -X POST http://localhost:3000/detections \
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
