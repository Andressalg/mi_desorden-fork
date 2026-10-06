import "reflect-metadata";
import { afterEach, beforeEach, describe, expect, it } from "bun:test";
import type { INestApplication } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { configurarApp } from "../src/app.setup";
import { CoreModule } from "../src/core.module";
import { validarEnv } from "../src/shared/config/env";

/** Levanta la app completa (mismo setup que el server) con el env que se pase. */
async function crearApp(env: Record<string, string> = {}) {
  const modulo = await Test.createTestingModule({ imports: [CoreModule] })
    .overrideProvider(ConfigService)
    .useValue(new ConfigService(validarEnv({ DEVICE_TOKEN: "", ...env })))
    .compile();
  const app = configurarApp(modulo.createNestApplication({ logger: false }));
  await app.init();
  return app;
}

const deteccion = { device_id: "esp32-01", etiqueta: "caja", confianza: 0.91, fuente: "camara" };

describe("API", () => {
  let app: INestApplication;
  beforeEach(async () => {
    app = await crearApp();
  });
  afterEach(() => app.close());

  it("responde el health", async () => {
    const res = await request(app.getHttpServer()).get("/health").expect(200);
    expect(res.body).toMatchObject({ ok: true });
  });

  it("arranca sin dispositivos", async () => {
    const res = await request(app.getHttpServer()).get("/devices").expect(200);
    expect(res.body).toEqual({ items: [], total: 0 });
  });

  it("registra un dispositivo con el heartbeat", async () => {
    await request(app.getHttpServer())
      .post("/devices/heartbeat")
      .send({ device_id: "esp32-01", nombre: "Estantería A", firmware: "0.1.0" })
      .expect(200);

    const res = await request(app.getHttpServer()).get("/devices/esp32-01").expect(200);
    expect(res.body).toMatchObject({ id: "esp32-01", estado: "online", firmware: "0.1.0" });
  });

  it("da 404 con un dispositivo que no existe", async () => {
    const res = await request(app.getHttpServer()).get("/devices/nada").expect(404);
    expect(res.body).toMatchObject({ statusCode: 404, path: "/devices/nada" });
  });

  it("guarda una detección y la devuelve", async () => {
    await request(app.getHttpServer()).post("/detections").send(deteccion).expect(201);

    const res = await request(app.getHttpServer()).get("/detections").expect(200);
    expect(res.body.total).toBe(1);
    expect(res.body.items[0].etiqueta).toBe("caja");
  });

  it("filtra detecciones por dispositivo", async () => {
    await request(app.getHttpServer()).post("/detections").send(deteccion).expect(201);
    await request(app.getHttpServer())
      .post("/detections")
      .send({ ...deteccion, device_id: "esp32-02" })
      .expect(201);

    const res = await request(app.getHttpServer())
      .get("/detections?device_id=esp32-02")
      .expect(200);
    expect(res.body.total).toBe(1);
  });

  it("rechaza una confianza fuera de rango", async () => {
    const res = await request(app.getHttpServer())
      .post("/detections")
      .send({ ...deteccion, confianza: 4 })
      .expect(400);
    expect(res.body.message).toEqual(
      expect.arrayContaining([expect.stringContaining("confianza")]),
    );
  });

  it("sirve el swagger", async () => {
    await request(app.getHttpServer()).get("/docs-json").expect(200);
  });
});

describe("x-device-token", () => {
  let app: INestApplication;
  beforeEach(async () => {
    app = await crearApp({ DEVICE_TOKEN: "secreto" });
  });
  afterEach(() => app.close());

  it("rechaza sin token", async () => {
    await request(app.getHttpServer()).post("/detections").send(deteccion).expect(401);
  });

  it("rechaza un token incorrecto", async () => {
    await request(app.getHttpServer())
      .post("/detections")
      .set("x-device-token", "otro")
      .send(deteccion)
      .expect(401);
  });

  it("deja pasar con el token correcto", async () => {
    await request(app.getHttpServer())
      .post("/detections")
      .set("x-device-token", "secreto")
      .send(deteccion)
      .expect(201);
  });

  it("no pide token para leer", async () => {
    await request(app.getHttpServer()).get("/detections").expect(200);
  });
});
