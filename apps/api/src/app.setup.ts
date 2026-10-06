import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { NestExpressApplication } from "@nestjs/platform-express";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import type { Env } from "./shared/config/env";
import { HttpExceptionFilter } from "./shared/filters/http-exception.filter";

/** Todas las rutas cuelgan de acá, igual que en canchapp: /api/v1/health, /api/v1/devices… */
export const PREFIJO = "api/v1";

/** Todo lo global de la app. Lo usan server.ts, serverless.ts y los tests e2e, así prueban lo mismo. */
export function configurarApp<T extends INestApplication>(app: T): T {
  const config = app.get(ConfigService<Env, true>);

  app.setGlobalPrefix(PREFIJO);

  // Detrás del proxy de Vercel, sin esto req.ip es la IP del proxy: el bloqueo
  // por intentos fallidos y el rate limit le pegarían a todos juntos.
  if (process.env.VERCEL) (app as unknown as NestExpressApplication).set("trust proxy", 1);

  const cors = config.get("CORS_ORIGIN", { infer: true });
  const origenes = cors
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origenes.includes("*") ? "*" : origenes });

  // Headers de seguridad. Sin CSP: la API solo devuelve JSON y Swagger UI usa scripts inline.
  app.use(helmet({ contentSecurityPolicy: false }));

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const swagger =
    config.get("NODE_ENV", { infer: true }) !== "production" ||
    process.env.ENABLE_SWAGGER === "true";
  if (swagger) {
    const doc = new DocumentBuilder()
      .setTitle("mi_desorden API")
      .setDescription(
        "Los ESP32-S3 mandan heartbeats y detecciones con x-device-token; la app lee con el access token de Supabase.",
      )
      .setVersion("0.2.0")
      .addBearerAuth({
        type: "http",
        scheme: "bearer",
        bearerFormat: "JWT",
        description: "access_token de Supabase",
      })
      .addApiKey({ type: "apiKey", in: "header", name: "x-device-token" }, "device-token")
      .build();
    SwaggerModule.setup(`${PREFIJO}/docs`, app, () => SwaggerModule.createDocument(app, doc));
  }

  return app;
}
