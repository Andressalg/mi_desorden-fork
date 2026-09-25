import type { Detection, DetectionInput, Device } from "@mi-desorden/core";

/**
 * Store en memoria. Es un placeholder hasta que se decida la base
 * (ver docs/DECISIONES.md). Se reinicia con el proceso.
 */
const devices = new Map<string, Device>();
const detections: Detection[] = [];

export const store = {
  devices: () => [...devices.values()],

  device: (id: string) => devices.get(id) ?? null,

  registrarDevice(id: string, nombre: string, firmware: string | null) {
    const device: Device = {
      id,
      nombre,
      ubicacion: devices.get(id)?.ubicacion ?? null,
      estado: "online",
      visto_en: new Date().toISOString(),
      firmware,
    };
    devices.set(id, device);
    return device;
  },

  detections: (deviceId?: string) =>
    deviceId ? detections.filter((d) => d.device_id === deviceId) : detections,

  crearDeteccion(input: DetectionInput): Detection {
    const detection: Detection = {
      id: crypto.randomUUID(),
      device_id: input.device_id,
      etiqueta: input.etiqueta,
      confianza: input.confianza,
      fuente: input.fuente,
      imagen_url: input.imagen_url ?? null,
      creada_en: new Date().toISOString(),
    };
    detections.unshift(detection);
    return detection;
  },
};
