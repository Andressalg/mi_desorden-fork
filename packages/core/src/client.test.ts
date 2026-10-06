import { describe, expect, it } from "bun:test";
import { ApiError, createClient } from "./client";

/** Reemplaza fetch y devuelve las URLs que se pidieron. */
function espiarFetch(respuesta: Response) {
  const urls: string[] = [];
  globalThis.fetch = (async (input: RequestInfo | URL) => {
    urls.push(String(input));
    return respuesta.clone();
  }) as typeof fetch;
  return urls;
}

describe("createClient", () => {
  it("saca la barra final de la URL base", async () => {
    const urls = espiarFetch(new Response(JSON.stringify({ items: [], total: 0 })));

    await createClient("http://localhost:3000/").devices();

    expect(urls[0]).toBe("http://localhost:3000/devices");
  });

  it("filtra el historial por dispositivo", async () => {
    const urls = espiarFetch(new Response(JSON.stringify({ items: [], total: 0 })));

    await createClient("http://localhost:3000").detections("esp32 01");

    expect(urls[0]).toBe("http://localhost:3000/detections?device_id=esp32%2001");
  });

  it("manda el token de sesión si hay", async () => {
    let auth = null as string | null;
    globalThis.fetch = (async (_: RequestInfo | URL, init?: RequestInit) => {
      auth = new Headers(init?.headers).get("Authorization");
      return new Response(JSON.stringify({ items: [], total: 0 }));
    }) as typeof fetch;

    await createClient("http://localhost:3000", { token: async () => "abc" }).devices();
    expect(auth).toBe("Bearer abc");

    await createClient("http://localhost:3000", { token: () => null }).devices();
    expect(auth).toBeNull();
  });

  it("tira ApiError con el status cuando la API falla", async () => {
    espiarFetch(new Response("nope", { status: 500 }));

    expect(createClient("http://localhost:3000").devices()).rejects.toBeInstanceOf(ApiError);
  });
});
