/**
 * La foto que sacó la cámara cuando no reconoció el producto. Se pasa así (y
 * no por la URL) porque el base64 es enorme. El formulario de producto la toma
 * y la sube como foto del producto nuevo: queda de referencia para reconocerlo.
 */
export interface Foto {
  uri: string;
  base64: string;
}

let pendiente: Foto | null = null;

export const fotoPendiente = {
  poner(foto: Foto) {
    pendiente = foto;
  },
  ver(): Foto | null {
    return pendiente;
  },
  /** La devuelve y la borra: se usa una sola vez. */
  tomar(): Foto | null {
    const f = pendiente;
    pendiente = null;
    return f;
  },
  descartar() {
    pendiente = null;
  },
};
