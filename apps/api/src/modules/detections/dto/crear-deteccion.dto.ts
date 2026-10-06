import type { DetectionFuente } from "@mi-desorden/core";
import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import {
  IsIn,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUrl,
  Max,
  MaxLength,
  Min,
} from "class-validator";

const FUENTES: DetectionFuente[] = ["camara", "microfono"];

export class CrearDeteccionDto {
  @ApiProperty({ example: "esp32-01" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(64)
  device_id: string;

  @ApiProperty({ example: "caja" })
  @IsString()
  @IsNotEmpty()
  @MaxLength(80)
  etiqueta: string;

  @ApiProperty({ example: 0.91, minimum: 0, maximum: 1 })
  @IsNumber()
  @Min(0)
  @Max(1)
  confianza: number;

  @ApiProperty({ enum: FUENTES })
  @IsIn(FUENTES)
  fuente: DetectionFuente;

  @ApiPropertyOptional({ nullable: true })
  @IsOptional()
  @IsUrl()
  imagen_url?: string | null;
}
