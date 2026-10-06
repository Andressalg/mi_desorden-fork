/**
 * Lee lo que trae el enlace del correo al volver a la app. Supabase manda los
 * datos en la query (?code=, ?error_description=) o en el fragmento
 * (#access_token=…&refresh_token=…, #error_description=…). Sin URL ni
 * URLSearchParams: en React Native no son confiables con esquemas propios.
 */
export type DatosEnlace = Partial<
  Record<
    | "access_token"
    | "refresh_token"
    | "code"
    | "error"
    | "error_code"
    | "error_description"
    | "type",
    string
  >
>;

export function leerEnlace(url: string): DatosEnlace {
  const [antes, fragmento = ""] = url.split("#");
  const query = antes!.includes("?") ? antes!.slice(antes!.indexOf("?") + 1) : "";
  const datos: Record<string, string> = {};
  for (const par of `${query}&${fragmento}`.split("&")) {
    if (!par) continue;
    const i = par.indexOf("=");
    const clave = decodeURIComponent(i === -1 ? par : par.slice(0, i));
    const valor = i === -1 ? "" : decodeURIComponent(par.slice(i + 1).replace(/\+/g, " "));
    datos[clave] = valor;
  }
  return datos;
}
