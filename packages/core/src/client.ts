import type { Detection, DetectionInput, Device, Paginado } from "./types";

export class ApiError extends Error {
  constructor(
    message: string,
    readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

/** Cliente HTTP de la API. Lo usan el cliente Expo y los scripts. */
export function createClient(baseUrl: string) {
  const url = baseUrl.replace(/\/$/, "");

  async function request<T>(path: string, init?: RequestInit): Promise<T> {
    const res = await fetch(`${url}${path}`, {
      ...init,
      headers: { "Content-Type": "application/json", ...init?.headers },
    });
    if (!res.ok) throw new ApiError(`${init?.method ?? "GET"} ${path} → ${res.status}`, res.status);
    return (await res.json()) as T;
  }

  return {
    devices: () => request<Paginado<Device>>("/devices"),
    device: (id: string) => request<Device>(`/devices/${id}`),
    detections: (deviceId?: string) =>
      request<Paginado<Detection>>(
        deviceId ? `/detections?device_id=${encodeURIComponent(deviceId)}` : "/detections",
      ),
    crearDeteccion: (input: DetectionInput) =>
      request<Detection>("/detections", { method: "POST", body: JSON.stringify(input) }),
  };
}

export type Client = ReturnType<typeof createClient>;
