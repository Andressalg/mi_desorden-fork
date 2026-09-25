import { Elysia, t } from "elysia";
import { store } from "../lib/store";

export const detections = new Elysia({ prefix: "/detections" })
  .get(
    "/",
    ({ query }) => {
      const items = store.detections(query.device_id);
      return { items, total: items.length };
    },
    { query: t.Object({ device_id: t.Optional(t.String()) }) },
  )
  .post("/", ({ body }) => store.crearDeteccion(body), {
    body: t.Object({
      device_id: t.String({ minLength: 1 }),
      etiqueta: t.String({ minLength: 1 }),
      confianza: t.Number({ minimum: 0, maximum: 1 }),
      fuente: t.Union([t.Literal("camara"), t.Literal("microfono")]),
      imagen_url: t.Optional(t.Nullable(t.String())),
    }),
  });
