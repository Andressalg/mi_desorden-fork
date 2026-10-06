import { Body, Controller, Get, HttpCode, Param, Post, UseGuards } from "@nestjs/common";
import { ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { DeviceTokenGuard } from "../../shared/guards/device-token.guard";
import { DevicesService } from "./devices.service";
import { HeartbeatDto } from "./dto/heartbeat.dto";

@ApiTags("devices")
@Controller("devices")
export class DevicesController {
  constructor(private readonly devices: DevicesService) {}

  @Get()
  @ApiOperation({ summary: "Lista de dispositivos" })
  listar() {
    return this.devices.listar();
  }

  @Get(":id")
  @ApiOperation({ summary: "Un dispositivo" })
  obtener(@Param("id") id: string) {
    return this.devices.obtener(id);
  }

  @Post("heartbeat")
  @HttpCode(200)
  @UseGuards(DeviceTokenGuard)
  @ApiSecurity("device-token")
  @ApiOperation({ summary: "El ESP32 avisa que está vivo" })
  heartbeat(@Body() dto: HeartbeatDto) {
    return this.devices.heartbeat(dto);
  }
}
