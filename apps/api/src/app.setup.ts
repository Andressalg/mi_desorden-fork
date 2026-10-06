import { type INestApplication, ValidationPipe } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";
import { HttpExceptionFilter } from "./shared/filters/http-exception.filter";

/** Todo lo global de la app. Lo usan el server y los tests e2e, así prueban lo mismo. */
export function configurarApp(app: INestApplication) {
  const cors = app.get(ConfigService).get<string>("CORS_ORIGIN", "*");
  const origenes = cors
    .split(",")
    .map((o) => o.trim())
    .filter(Boolean);
  app.enableCors({ origin: origenes.includes("*") ? "*" : origenes });

  app.useGlobalPipes(new ValidationPipe({ transform: true, whitelist: true }));
  app.useGlobalFilters(new HttpExceptionFilter());

  const doc = new DocumentBuilder()
    .setTitle("mi_desorden API")
    .setDescription("La usan los ESP32-S3 para mandar heartbeats y detecciones.")
    .setVersion("0.2.0")
    .addApiKey({ type: "apiKey", in: "header", name: "x-device-token" }, "device-token")
    .build();
  SwaggerModule.setup("docs", app, () => SwaggerModule.createDocument(app, doc));

  return app;
}
