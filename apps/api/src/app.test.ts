import { describe, expect, it } from "bun:test";
import { app } from "./app";

const get = (path: string) => app.handle(new Request(`http://localhost${path}`));

describe("API", () => {
  it("responde el health", async () => {
    const res = await get("/health");
    expect(res.status).toBe(200);
    expect(await res.json()).toMatchObject({ ok: true });
  });

  it("arranca sin dispositivos", async () => {
    const res = await get("/devices");
    expect(await res.json()).toEqual({ items: [], total: 0 });
  });

  it("guarda una detección y la devuelve", async () => {
    const res = await app.handle(
      new Request("http://localhost/detections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: "esp32-01",
          etiqueta: "caja",
          confianza: 0.91,
          fuente: "camara",
        }),
      }),
    );
    expect(res.status).toBe(200);

    const lista = await (await get("/detections")).json();
    expect(lista.total).toBe(1);
    expect(lista.items[0].etiqueta).toBe("caja");
  });

  it("rechaza una confianza fuera de rango", async () => {
    const res = await app.handle(
      new Request("http://localhost/detections", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          device_id: "esp32-01",
          etiqueta: "caja",
          confianza: 4,
          fuente: "camara",
        }),
      }),
    );
    expect(res.status).toBe(422);
  });
});
