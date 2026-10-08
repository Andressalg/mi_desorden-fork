/**
 * Decide qué producto es a partir de lo que devuelve Apple Vision: la distancia
 * visual a la foto de cada producto y el texto que se lee en la etiqueta. Sin
 * dependencias de React Native para poder testearlo.
 *
 * Los umbrales son un punto de partida: se ajustan con el uso real.
 */

export interface Candidato {
  id: string;
  nombre: string;
  /** "Bebidas › Gaseosas": también cuenta para el texto. */
  categoria?: string;
}

export interface Puntaje {
  id: string;
  /** 0 a 1. */
  puntaje: number;
  visual: number | null;
  texto: number;
}

export interface Veredicto {
  /** Seguro: se muestra directo. */
  producto: Puntaje | null;
  /** Otros posibles (o los posibles si no hay uno seguro), de mayor a menor. */
  alternativas: Puntaje[];
  /** Para un producto nuevo: la línea de la etiqueta que parece un nombre. */
  sugerencia: string;
}

/** Distancias de VNFeaturePrint: por debajo de CERCA es casi seguro el mismo objeto. */
const CERCA = 0.45;
const LEJOS = 0.95;
const SEGURO = 0.6;
const POSIBLE = 0.3;
/** Si el segundo queda tan cerca del primero, no es seguro: se pregunta. */
const MARGEN = 0.12;

const sinTildes = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "");

/** Palabras que sirven para comparar: minúsculas, sin tildes, de 3+ letras o con números. */
export function palabras(texto: string): string[] {
  return sinTildes(texto.toLowerCase())
    .split(/[^a-z0-9ñ]+/)
    .filter((p) => p.length >= 3 || /\d/.test(p));
}

/** 1 si la distancia es chica (muy parecido), 0 si es grande. */
export function similitudVisual(distancia: number): number {
  return Math.min(1, Math.max(0, (LEJOS - distancia) / (LEJOS - CERCA)));
}

/** Qué parte del nombre del producto aparece en el texto leído (las palabras largas pesan más). */
export function similitudTexto(nombre: string, leidas: Set<string>): number {
  const del = [...new Set(palabras(nombre))];
  if (!del.length || !leidas.size) return 0;
  const peso = (p: string) => Math.min(p.length, 8);
  const total = del.reduce((t, p) => t + peso(p), 0);
  const encontradas = del.filter(
    (p) => leidas.has(p) || (p.length >= 5 && [...leidas].some((l) => l.includes(p))),
  );
  return encontradas.reduce((t, p) => t + peso(p), 0) / total;
}

export function puntuar(
  candidatos: Candidato[],
  distancias: Record<string, number>,
  textos: string[],
): Puntaje[] {
  const leidas = new Set(textos.flatMap(palabras));
  return candidatos
    .map((c) => {
      const d = distancias[c.id];
      const visual = d === undefined ? null : similitudVisual(d);
      const texto = Math.max(
        similitudTexto(c.nombre, leidas),
        // La categoría ayuda poco: solo desempata.
        c.categoria ? similitudTexto(c.categoria, leidas) * 0.3 : 0,
      );
      // Sin foto, solo el texto. Con foto, manda lo más fuerte y lo otro suma.
      const puntaje =
        visual === null
          ? texto
          : Math.min(1, Math.max(visual, texto) * 0.8 + Math.min(visual, texto) * 0.4);
      return { id: c.id, puntaje, visual, texto };
    })
    .sort((a, b) => b.puntaje - a.puntaje);
}

/** La línea de la etiqueta más parecida a un nombre de producto. */
export function sugerirNombre(textos: string[]): string {
  const lineas = textos
    .map((t) => t.replace(/\s+/g, " ").trim())
    .filter((t) => t.length >= 3 && t.length <= 40 && /[a-záéíóúñ]{3}/i.test(t));
  // La más larga suele ser la marca + producto; los textos chicos son pesos o fechas.
  const mejor = [...lineas].sort((a, b) => b.length - a.length)[0] ?? "";
  return mejor ? mejor[0]!.toUpperCase() + mejor.slice(1) : "";
}

export function decidir(
  candidatos: Candidato[],
  distancias: Record<string, number>,
  textos: string[],
): Veredicto {
  const ranking = puntuar(candidatos, distancias, textos).filter((p) => p.puntaje >= POSIBLE);
  const [primero, segundo] = ranking;
  const seguro =
    !!primero &&
    primero.puntaje >= SEGURO &&
    (!segundo || primero.puntaje - segundo.puntaje >= MARGEN);
  return {
    producto: seguro ? primero! : null,
    alternativas: (seguro ? ranking.slice(1) : ranking).slice(0, 3),
    sugerencia: sugerirNombre(textos),
  };
}
