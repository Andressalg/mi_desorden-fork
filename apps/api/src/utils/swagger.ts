import type { INestApplication } from "@nestjs/common";
import { DocumentBuilder, SwaggerModule } from "@nestjs/swagger";

/** Swagger en `/<prefijo>/docs`. Quien llama decide si se monta (no en producción salvo ENABLE_SWAGGER). */
export function crearSwagger(app: INestApplication, prefijo: string) {
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
  SwaggerModule.setup(`${prefijo}/docs`, app, () => SwaggerModule.createDocument(app, doc), {
    swaggerOptions: { persistAuthorization: true, displayRequestDuration: true },
  });
}
