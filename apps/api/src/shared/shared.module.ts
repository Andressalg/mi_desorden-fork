import { Global, Module } from "@nestjs/common";
import { DeviceTokenGuard } from "./guards/device-token.guard";

/** Lo que usan varios módulos. Global para no importarlo en cada uno. */
@Global()
@Module({
  providers: [DeviceTokenGuard],
  exports: [DeviceTokenGuard],
})
export class SharedModule {}
