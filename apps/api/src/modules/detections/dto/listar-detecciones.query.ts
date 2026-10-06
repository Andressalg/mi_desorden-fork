import { ApiPropertyOptional } from "@nestjs/swagger";
import { IsOptional, IsString } from "class-validator";

export class ListarDeteccionesQuery {
  @ApiPropertyOptional({ description: "Solo las de este dispositivo" })
  @IsOptional()
  @IsString()
  device_id?: string;
}
