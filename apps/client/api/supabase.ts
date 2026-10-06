import AsyncStorage from "@react-native-async-storage/async-storage";
import { createClient, processLock } from "@supabase/supabase-js";
import { AppState, Platform } from "react-native";
import { config } from "./config";

/** Cliente de Supabase. Uso interno de la carpeta api/: el resto de la app no lo importa. */
export const supabase = createClient(config.supabaseUrl, config.supabaseKey, {
  auth: {
    // En web la sesión va en localStorage (default); en el teléfono, AsyncStorage.
    ...(Platform.OS !== "web" ? { storage: AsyncStorage } : {}),
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false,
    lock: processLock,
    // Implícito, no PKCE: con PKCE Supabase ata el código del correo al flujo y
    // el código de 8 dígitos escrito a mano siempre da "inválido". El enlace
    // vuelve con la sesión en el fragmento (ver auth.completarDesdeEnlace).
    flowType: "implicit",
  },
});

// Refresca el token solo con la app en primer plano (recomendado por Supabase para RN).
if (Platform.OS !== "web") {
  AppState.addEventListener("change", (estado) => {
    if (estado === "active") supabase.auth.startAutoRefresh();
    else supabase.auth.stopAutoRefresh();
  });
}
