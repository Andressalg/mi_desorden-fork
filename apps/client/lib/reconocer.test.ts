import { describe, expect, it } from "bun:test";
import {
  decidir,
  palabras,
  similitudTexto,
  similitudVisual,
  sugerirNombre,
  type Candidato,
} from "./reconocer";

const productos: Candidato[] = [
  { id: "coca", nombre: "Coca-Cola 500 ml", categoria: "Bebidas › Gaseosas" },
  { id: "sprite", nombre: "Sprite 500 ml", categoria: "Bebidas › Gaseosas" },
  { id: "lavandina", nombre: "Lavandina Ayudín", categoria: "Limpieza" },
  { id: "martillo", nombre: "Martillo de carpintero", categoria: "Herramientas" },
];

describe("palabras", () => {
  it("normaliza y descarta las cortas, salvo números", () => {
    expect(palabras("Coca-Cola 500 ml")).toEqual(["coca", "cola", "500"]);
    expect(palabras("Lavandina AYUDÍN")).toEqual(["lavandina", "ayudin"]);
  });
});

describe("similitudVisual", () => {
  it("1 si es casi igual, 0 si está lejos, intermedio en el medio", () => {
    expect(similitudVisual(0.2)).toBe(1);
    expect(similitudVisual(1.4)).toBe(0);
    expect(similitudVisual(0.7)).toBeCloseTo(0.5);
  });
});

describe("similitudTexto", () => {
  it("cuenta las palabras del nombre que aparecen en la etiqueta", () => {
    const leidas = new Set(palabras("COCA COLA sabor original 500"));
    expect(similitudTexto("Coca-Cola 500 ml", leidas)).toBe(1);
    expect(similitudTexto("Sprite 500 ml", leidas)).toBeLessThan(0.5);
  });
});

describe("decidir", () => {
  it("reconoce por la etiqueta aunque el producto no tenga foto", () => {
    const v = decidir(productos, {}, ["Coca-Cola", "Sabor original", "500 ml"]);
    expect(v.producto?.id).toBe("coca");
  });

  it("reconoce por la foto aunque no se lea nada", () => {
    const v = decidir(productos, { coca: 0.95, sprite: 0.3, lavandina: 1.2 }, []);
    expect(v.producto?.id).toBe("sprite");
  });

  it("si dos se parecen, no elige: los ofrece como alternativas", () => {
    const v = decidir(productos, { coca: 0.42, sprite: 0.44 }, []);
    expect(v.producto).toBeNull();
    expect(v.alternativas.map((a) => a.id)).toEqual(["coca", "sprite"]);
  });

  it("la etiqueta desempata dos fotos parecidas", () => {
    const v = decidir(productos, { coca: 0.5, sprite: 0.48 }, ["Sprite", "lima limón"]);
    expect(v.producto?.id).toBe("sprite");
  });

  it("si no conoce nada, sugiere un nombre con la etiqueta", () => {
    const v = decidir(productos, { coca: 1.3 }, ["750 ml", "Fernet Branca", "IMPORTADO"]);
    expect(v.producto).toBeNull();
    expect(v.alternativas).toEqual([]);
    expect(v.sugerencia).toBe("Fernet Branca");
  });
});

describe("sugerirNombre", () => {
  it("ignora números sueltos y textos largos", () => {
    expect(sugerirNombre(["500", "12/2027", "Yerba Mate Playadito"])).toBe("Yerba Mate Playadito");
    expect(sugerirNombre([])).toBe("");
  });
});
