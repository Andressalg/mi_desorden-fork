import type { Detection, Paginado } from "@mi-desorden/core";
import { Injectable } from "@nestjs/common";
import { DetectionsRepository } from "./detections.repository";
import type { CrearDeteccionDto } from "./dto/crear-deteccion.dto";
import { ahoraIso, paginar } from "../../utils";

@Injectable()
export class DetectionsService {
  constructor(private readonly repo: DetectionsRepository) {}

  listar(deviceId?: string): Paginado<Detection> {
    return paginar(this.repo.listar(deviceId));
  }

  crear(dto: CrearDeteccionDto): Detection {
    return this.repo.guardar({
      id: crypto.randomUUID(),
      device_id: dto.device_id,
      etiqueta: dto.etiqueta,
      confianza: dto.confianza,
      fuente: dto.fuente,
      imagen_url: dto.imagen_url ?? null,
      creada_en: ahoraIso(),
    });
  }
}
