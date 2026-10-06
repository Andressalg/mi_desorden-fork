import type { Detection } from "@mi-desorden/core";
import { Injectable } from "@nestjs/common";

/** Store en memoria, igual que DevicesRepository. Lo más nuevo primero. */
@Injectable()
export class DetectionsRepository {
  private readonly detections: Detection[] = [];

  listar(deviceId?: string): Detection[] {
    return deviceId
      ? this.detections.filter((d) => d.device_id === deviceId)
      : [...this.detections];
  }

  guardar(detection: Detection): Detection {
    this.detections.unshift(detection);
    return detection;
  }
}
