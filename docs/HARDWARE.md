# Hardware

**Documentación:** [Índice](README.md)

## Componentes

| Parte | Modelo | Nota |
|-------|--------|------|
| MCU | ESP32-S3 con PSRAM (8 MB flash) | La PSRAM no es opcional: el framebuffer de la cámara vive ahí |
| Cámara | OV2640 (módulo ESP32-S3-CAM) | JPEG, SVGA por defecto |
| Micrófono | INMP441 (I2S, 24 bits) | Se leen 32 bits y se truncan a 16 |
| Alimentación | 5 V / 2 A | La cámara tira picos de corriente; USB de PC a veces no alcanza |

## Pinout (ajustar al módulo real)

**Cámara** — definido en `apps/firmware/main/camara.c`:

| Señal | GPIO |
|-------|------|
| XCLK | 15 |
| SIOD / SIOC | 4 / 5 |
| D0–D7 | 11, 9, 8, 10, 12, 18, 17, 16 |
| VSYNC / HREF / PCLK | 6 / 7 / 13 |

**Micrófono I2S** — definido en `apps/firmware/main/microfono.c`:

| Señal | GPIO |
|-------|------|
| BCLK | 41 |
| WS | 42 |
| DIN | 2 |

> Los pines son los de una ESP32-S3-WROOM CAM genérica. Si la placa es otra, hay que corregirlos antes del primer flash.

## Configuración

Todo lo que cambia por dispositivo está en `idf.py menuconfig` → menú **mi_desorden**: SSID, contraseña, URL de la API, ID del dispositivo, token y frecuencia del heartbeat. Nada de credenciales hardcodeadas en el código.
