import { createClient } from "@mi-desorden/core";

const baseUrl = process.env.EXPO_PUBLIC_API_URL ?? "http://localhost:3000";

export const api = createClient(baseUrl);
