import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import helmet from "helmet";
import { HttpExceptionFilter } from "./shared/filters/http-exception.filter";

/** Todo lo global de la app. Lo usan el server y los tests e2e, así prueban lo mismo. */
export function configurarApp(app: INestApplication) {
  const cors = app.get(ConfigService).get<string>("CORS_ORIGIN", "*");
  const origenes = cors
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origenes.includes("*") ? "*" : origenes });

  // Headers de seguridad. Sin CSP: la API solo devuelve JSON y Swagger UI usa scripts inline.
  app.use(helmet({ contentSecurityPolicy: false }));

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

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
  SwaggerModule.setup("docs", app, () => SwaggerModule.createDocument(app, doc));

  return app;
}
