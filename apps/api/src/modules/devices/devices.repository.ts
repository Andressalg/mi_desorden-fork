import type { Device } from "@mi-desorden/core";
import { Injectable } from "@nestjs/common";

/**
 * Store en memoria: se pierde al reiniciar. Es el único lugar que hay que
 * cambiar para persistir en Supabase (ver docs/DECISIONES.md).
 */
@Injectable()
export class DevicesRepository {
  private readonly devices = new Map<string, Device>();

  listar(): Device[] {
    return [...this.devices.values()];
  }

  buscar(id: string): Device | null {
    return this.devices.get(id) ?? null;
  }

  guardar(device: Device): Device {
    this.devices.set(device.id, device);
    return device;
  }
}
