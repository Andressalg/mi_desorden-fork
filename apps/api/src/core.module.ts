import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { DetectionsModule } from "./modules/detections/detections.module";
import { DevicesModule } from "./modules/devices/devices.module";
import { HealthModule } from "./modules/health/health.module";
import { validarEnv } from "./shared/config/env";
import { SharedModule } from "./shared/shared.module";

@Module({
  imports: [
    // Las variables vienen de Doppler (`doppler run --`); no se lee ningún .env.
    ConfigModule.forRoot({ isGlobal: true, ignoreEnvFile: true, validate: validarEnv }),
    SharedModule,
    HealthModule,
    DevicesModule,
    DetectionsModule,
  ],
})
export class CoreModule {}
