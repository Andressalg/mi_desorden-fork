import { Elysia } from "elysia";

export const health = new Elysia().get("/health", () => ({
  ok: true,
  ts: new Date().toISOString(),
}));
