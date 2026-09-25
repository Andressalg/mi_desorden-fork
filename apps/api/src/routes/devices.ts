import { Elysia, t } from "elysia";
import { store } from "../lib/store";

export const devices = new Elysia({ prefix: "/devices" })
  .get("/", () => {
    const items = store.devices();
    return { items, total: items.length };
  })
  .get(
    "/:id",
    ({ params, status }) => store.device(params.id) ?? status(404, { error: "No existe" }),
    { params: t.Object({ id: t.String() }) },
  )
  .post(
    "/heartbeat",
    ({ body }) => store.registrarDevice(body.device_id, body.nombre, body.firmware ?? null),
    {
      body: t.Object({
        device_id: t.String({ minLength: 1 }),
        nombre: t.String({ minLength: 1 }),
        firmware: t.Optional(t.String()),
      }),
    },
  );
