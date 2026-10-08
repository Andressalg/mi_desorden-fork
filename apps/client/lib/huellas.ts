import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Producto } from "@mi-desorden/core";
import { productos as productosApi } from "@/api";
import { Reconocer } from "@/modules/reconocer";

/**
 * Huellas visuales de las fotos de los productos, guardadas en el teléfono.
 * Se calculan una vez por foto (bajarla y pasarla por Vision lleva ~1 s).
 * No se usa actualizado_en (cambia con cada ajuste de stock): cuando la app
 * sube una foto nueva, llama a olvidarHuella.
 */

const CLAVE = "mi_desorden:huellas";

type Guardada = { foto: string; huella: string };
let cache: Record<string, Guardada> | null = null;

async function leer() {
  if (cache) return cache;
  try {
    cache = JSON.parse((await AsyncStorage.getItem(CLAVE)) ?? "{}");
  } catch {
    cache = {};
  }
  return cache!;
}

const vigente = (g: Guardada | undefined, p: Producto) => !!g && g.foto === p.foto_path;

/** La foto de este producto cambió: su huella se rehace la próxima vez. */
export async function olvidarHuella(productoId: string) {
  const guardadas = await leer();
  if (!guardadas[productoId]) return;
  delete guardadas[productoId];
  await AsyncStorage.setItem(CLAVE, JSON.stringify(guardadas)).catch(() => {});
}

/**
 * Devuelve producto → huella de los que tienen foto. Calcula las que faltan
 * (de a una, para no saturar) y avisa el progreso.
 */
export async function huellasDe(
  productos: Producto[],
  progreso?: (hechas: number, total: number) => void,
): Promise<Record<string, string>> {
  const guardadas = await leer();
  const conFoto = productos.filter((p) => p.foto_path);
  const faltan = conFoto.filter((p) => !vigente(guardadas[p.id], p));

  if (Reconocer && faltan.length) {
    let hechas = 0;
    progreso?.(0, faltan.length);
    for (const p of faltan) {
      try {
        const url = await productosApi.urlFoto(p.foto_path!);
        guardadas[p.id] = {
          foto: p.foto_path!,
          huella: await Reconocer.huella(url),
        };
      } catch {
        // Una foto que no baja no frena las demás: ese producto se reconoce por texto.
      }
      progreso?.(++hechas, faltan.length);
    }
    AsyncStorage.setItem(CLAVE, JSON.stringify(guardadas)).catch(() => {});
  }

  return Object.fromEntries(
    conFoto.filter((p) => vigente(guardadas[p.id], p)).map((p) => [p.id, guardadas[p.id]!.huella]),
  );
}
