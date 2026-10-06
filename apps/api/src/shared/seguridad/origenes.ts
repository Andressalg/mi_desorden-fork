/**
 * Lista blanca de orígenes (CORS). Solo aplica a navegadores: la app móvil y el
 * ESP32 no mandan Origin y no se ven afectados.
 */

/** Normaliza y valida un origen: esquema + host [+ puerto], sin path. */
export function normalizarOrigen(valor: string): string {
  const crudo = valor.trim().replace(/\/$/, "");
  const url = new URL(crudo.includes("://") ? crudo : `https://${crudo}`);
  if (
    !["http:", "https:"].includes(url.protocol) ||
    url.pathname !== "/" ||
    url.search ||
    url.username
  ) {
    throw new Error(`Origen CORS inválido: ${valor}`);
  }
  return url.origin;
}

export type FiltroOrigen = (origen: string | undefined) => boolean;

/** `*` permite todo (solo fuera de producción); si no, coincidencia exacta del origen. */
export function crearFiltroOrigen(permitidos: string[]): FiltroOrigen {
  if (permitidos.includes("*")) return () => true;
  const set = new Set(permitidos);
  return (origen) => {
    if (!origen) return true; // sin Origin: app móvil, ESP32, curl
    try {
      return set.has(new URL(origen).origin) && new URL(origen).origin === origen;
    } catch {
      return false;
    }
  };
}
