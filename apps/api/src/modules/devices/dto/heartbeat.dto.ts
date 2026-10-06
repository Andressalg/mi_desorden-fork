import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { IsNotEmpty, IsOptional, IsString, MaxLength } from "class-validator";

export class HeartbeatDto {
  @ApiProperty({ example: "esp32-01" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  device_id: string;

  @ApiProperty({ example: "Estantería A" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  nombre: string;

  @ApiPropertyOptional({ example: "0.1.0" })
  @IsOptional()
  @IsString()
  @MaxLength(32)
  firmware?: string;
}
