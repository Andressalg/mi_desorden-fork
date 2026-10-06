import type { Device, Paginado } from "@mi-desorden/core";
import { Injectable, NotFoundException } from "@nestjs/common";
import { DevicesRepository } from "./devices.repository";
import type { HeartbeatDto } from "./dto/heartbeat.dto";
import { ahoraIso, paginar } from "../../utils";

@Injectable()
export class DevicesService {
  constructor(private readonly repo: DevicesRepository) {}

  listar(): Paginado<Device> {
    return paginar(this.repo.listar());
  }

  obtener(id: string): Device {
    const device = this.repo.buscar(id);
    if (!device) throw new NotFoundException(`No existe el dispositivo ${id}`);
    return device;
  }

  /** El ESP32 avisa que está vivo: se registra si es nuevo y queda online. */
  heartbeat(dto: HeartbeatDto): Device {
    return this.repo.guardar({
      id: dto.device_id,
      nombre: dto.nombre,
      ubicacion: this.repo.buscar(dto.device_id)?.ubicacion ?? null,
      estado: "online",
      visto_en: ahoraIso(),
      firmware: dto.firmware ?? null,
    });
  }
}
