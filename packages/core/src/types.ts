/** Tipos compartidos entre la API, el cliente Expo y el firmware. */

/** Un ESP32-S3 con cámara y micrófono. */
export interface Device {
  id: string;
  nombre: string;
  /** Dónde está puesto: "depósito", "garage", "cuarto". */
  ubicacion: string | null;
  estado: DeviceEstado;
  /** Último heartbeat en ISO 8601. */
  visto_en: string | null;
  firmware: string | null;
}

export type DeviceEstado = "online" | "offline" | "durmiendo";

/** Cada cosa que el dispositivo cree haber visto o escuchado. */
export interface Detection {
  id: string;
  device_id: string;
  /** Qué se detectó: "caja", "bolsa", "herramienta". */
  etiqueta: string;
  /** 0 a 1. */
  confianza: number;
  fuente: DetectionFuente;
  /** Recorte del frame, si se guardó. */
  imagen_url: string | null;
  creada_en: string;
}

export type DetectionFuente = "camara" | "microfono";

/** Lo que el firmware manda en cada evento. */
export interface DetectionInput {
  device_id: string;
  etiqueta: string;
  confianza: number;
  fuente: DetectionFuente;
  imagen_url?: string | null;
}

export interface Paginado<T> {
  items: T[];
  total: number;
}
