import { Body, Controller, Get, Post, Query, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiOperation, ApiSecurity, ApiTags } from "@nestjs/swagger";
import { Publico } from "../../shared/auth/publico.decorator";
import { DeviceTokenGuard } from "../../shared/guards/device-token.guard";
import { DetectionsService } from "./detections.service";
import { CrearDeteccionDto } from "./dto/crear-deteccion.dto";
import { ListarDeteccionesQuery } from "./dto/listar-detecciones.query";

@ApiTags("detections")
@ApiBearerAuth()
@Controller("detections")
export class DetectionsController {
  constructor(private readonly detections: DetectionsService) {}

  @Get()
  @ApiOperation({ summary: "Historial de detecciones" })
  listar(@Query() query: ListarDeteccionesQuery) {
    return this.detections.listar(query.device_id);
  }

  @Post()
  @Publico() // no hay sesión de usuario: lo autentica el token del dispositivo
  @UseGuards(DeviceTokenGuard)
  @ApiSecurity("device-token")
  @ApiOperation({ summary: "El ESP32 registra una detección" })
  crear(@Body() dto: CrearDeteccionDto) {
    return this.detections.crear(dto);
  }
}
