# Roadmap

**Documentación:** [Índice](README.md)

## Fase 0 — Estructura ✅

- [x] Monorepo Bun + Turborepo
- [x] API con Elysia, endpoints de devices y detections
- [x] Cliente Expo con tabs
- [x] Firmware ESP-IDF: WiFi, cámara, mic, heartbeat
- [x] CI y ramas develop / staging / production

## Fase 1 — Que hable el hardware

- [ ] Corregir el pinout a la placa real y flashear
- [ ] Heartbeat llegando a la API desde el ESP32
- [ ] Validar `x-device-token` en la API
- [ ] Subir un frame JPEG a la API

## Fase 2 — Reconocimiento

- [ ] Decidir dónde corre el modelo ([DECISIONES.md](DECISIONES.md))
- [ ] Dataset de las cosas de casa (cajas, bolsas, herramientas)
- [ ] Primera clasificación de punta a punta
- [ ] Detecciones reales en el historial de la app

## Fase 3 — Audio

- [ ] Guardar audio y sacarle features
- [ ] Wake word o detección de eventos sonoros

## Fase 4 — Producto

- [ ] Base de datos de verdad
- [ ] Deploy de la API
- [ ] Push cuando aparece algo
- [ ] Varios dispositivos por ubicación
