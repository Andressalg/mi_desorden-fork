import { cors } from "@elysiajs/cors";
import { swagger } from "@elysiajs/swagger";
import { Elysia } from "elysia";
import { env } from "./lib/env";
import { detections } from "./routes/detections";
import { devices } from "./routes/devices";
import { health } from "./routes/health";

export const app = new Elysia()
  .use(cors({ origin: env.corsOrigin }))
  .use(swagger({ path: "/docs", documentation: { info: { title: "mi_desorden API", version: "0.1.0" } } }))
  .use(health)
  .use(devices)
  .use(detections);

export type App = typeof app;
