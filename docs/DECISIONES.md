# Decisiones

**Documentación:** [Índice](README.md)

## Tomadas

| Decisión | Por qué |
|----------|---------|
| Monorepo Bun + Turborepo | Mismo esquema que nexo y wave: un `bun dev` levanta todo |
| Elysia en vez de NestJS | Criterio de siempre: NestJS para productos con muchos módulos, Elysia para APIs chicas sobre Bun |
| ESP-IDF en vez de Arduino | Control sobre PSRAM, I2S y tareas de FreeRTOS. Arduino queda corto para cámara + audio en simultáneo |
| ESP32-**S3** | La PSRAM y el ancho de banda que pide la cámara. Un ESP32 clásico no da |
| `packages/core` con los tipos | Que el cliente y la API no se desincronicen |
| Ramas develop / staging / production | Mismo flujo que canchapp y nexo |

## Pendientes

### 1. Dónde corre el reconocimiento

La grande, y está sin decidir.

| Opción | A favor | En contra |
|--------|---------|-----------|
| **En el servidor** | Modelos grandes (YOLO, ONNX), muchas clases, se actualiza sin reflashear | Necesita red, más latencia, hay que subir frames |
| **En el ESP32 (edge)** | Sin red, latencia baja, no sale nada del dispositivo | Pocas clases, precisión limitada, reentrenar es reflashear |
| **Híbrido** | El ESP32 filtra (movimiento / wake word) y el servidor clasifica solo lo que importa | Más código de los dos lados |

Lo que hay hoy: `tarea_captura` en `apps/firmware/main/main.c` captura y loguea, nada más.

### 2. Base de datos

Hoy es un store en memoria. Candidatos: Supabase (lo de siempre) o SQLite con Bun para algo local.

### 3. Dónde guardar las imágenes

Si se manda el recorte del frame: Supabase Storage, S3, o nada (solo la etiqueta).

### 4. Autenticación del dispositivo

El firmware ya manda `x-device-token`; falta validarlo en la API.

### 5. Deploy de la API

Vercel, como el resto. Ojo con lo aprendido: Corepack no maneja Bun, en Vercel el build va con npm.
