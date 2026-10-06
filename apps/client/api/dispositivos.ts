import type { Detection, Device } from "@mi-desorden/core";
import { http } from "./http";

/** Lo que viene de la API de Nest: los ESP32 y lo que detectan. */
export const dispositivos = {
  async listar(): Promise<Device[]> {
    return (await http.devices()).items;
  },

  async detecciones(deviceId?: string): Promise<Detection[]> {
    return (await http.detections(deviceId)).items;
  },
};
