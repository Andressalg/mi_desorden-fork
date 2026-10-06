import { timingSafeEqual } from "node:crypto";
import {
  type CanActivate,
  type ExecutionContext,
  Injectable,
  UnauthorizedException,
} from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import type { Request } from "express";
import type { Env } from "../config/env";

/**
 * Valida el header `x-device-token` que manda el firmware.
 * Si DEVICE_TOKEN está vacío (desarrollo) deja pasar todo; en producción es obligatorio.
 */
@Injectable()
export class DeviceTokenGuard implements CanActivate {
  constructor(private readonly config: ConfigService<Env, true>) {}

  canActivate(context: ExecutionContext): boolean {
    const esperado = this.config.get("DEVICE_TOKEN", { infer: true });
    if (!esperado) return true;

    const recibido = context.switchToHttp().getRequest<Request>().header("x-device-token") ?? "";
    const a = Buffer.from(recibido);
    const b = Buffer.from(esperado);
    if (a.length !== b.length || !timingSafeEqual(a, b)) {
      throw new UnauthorizedException("x-device-token inválido");
    }
    return true;
  }
}
