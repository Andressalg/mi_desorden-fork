import "reflect-metadata";
import { ConfigService } from "@nestjs/config";
import { NestFactory } from "@nestjs/core";
import { configurarApp } from "./app.setup";
import { CoreModule } from "./core.module";

async function bootstrap() {
  const app = await NestFactory.create(CoreModule);
  configurarApp(app);

  const port = app.get(ConfigService).get<number>("PORT", 3000);
  await app.listen(port);
  console.log(`API en http://localhost:${port} — docs en /docs`);
}

bootstrap();
