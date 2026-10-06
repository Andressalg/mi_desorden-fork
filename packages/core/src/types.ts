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

/* ---------- Inventario (Sprint 1) ---------- */

/** Color del LED que marca el lugar de un producto en la estantería. */
export type LedColor = "verde" | "azul" | "rojo" | "amarillo" | "violeta";

export interface Usuario {
  id: string;
  nombre: string;
  email: string;
  creado_en: string;
}

export type Rol = "dueño" | "editor" | "lector";

export interface Miembro {
  usuario_id: string;
  nombre: string;
  email: string;
  rol: Rol;
  /** Si está mirando el inventario ahora mismo (presence de Realtime). */
  en_linea: boolean;
}

export interface Inventario {
  id: string;
  nombre: string;
  /** "Depósito", "Tienda centro", "Garage". */
  lugar: string;
  miembros: Miembro[];
  total_productos: number;
  creado_en: string;
}

export interface Producto {
  id: string;
  inventario_id: string;
  nombre: string;
  categoria: string;
  cantidad: number;
  /** Por debajo de esto se marca como stock bajo. */
  minimo: number;
  /** Pasillo / estante, ej. "A2". */
  ubicacion: string;
  led: LedColor;
  /** Quién hizo el último cambio: la persona o la cámara. */
  fuente: "manual" | "camara";
  actualizado_en: string;
}

export type ProductoInput = Pick<
  Producto,
  "nombre" | "categoria" | "cantidad" | "minimo" | "ubicacion" | "led"
>;
