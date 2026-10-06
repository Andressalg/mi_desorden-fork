import { Global, Module } from "@nestjs/common";
import { IntentosFallidosService } from "./auth/intentos-fallidos.service";
import { SesionGuard } from "./auth/sesion.guard";
import { SupabaseJwtService } from "./auth/supabase-jwt.service";
import { DeviceTokenGuard } from "./guards/device-token.guard";

/** Lo que usan varios módulos. Global para no importarlo en cada uno. */
@Global()
@Module({
  providers: [DeviceTokenGuard, SupabaseJwtService, IntentosFallidosService, SesionGuard],
  exports: [DeviceTokenGuard, SupabaseJwtService, IntentosFallidosService, SesionGuard],
})
export class SharedModule {}
