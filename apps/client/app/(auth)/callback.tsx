import { router, useLocalSearchParams } from "expo-router";
import { useEffect, useRef, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { MarcoAcceso } from "@/components/Acceso";
import { BotonPrincipal } from "@/components/ui";
import { useStore } from "@/lib/store";

/**
 * A esta ruta vuelve el enlace del correo de confirmación
 * (midesorden://callback?code=…). Canjea el código por la sesión; con la
 * sesión iniciada, el guard del layout raíz lleva solo a las tabs.
 */
export default function Callback() {
  const params = useLocalSearchParams<{ code?: string; error_description?: string }>();
  const { completarDesdeEnlace } = useStore();
  const [error, setError] = useState<string | null>(null);
  const hecho = useRef(false);

  useEffect(() => {
    if (hecho.current) return; // el código sirve una sola vez
    hecho.current = true;
    completarDesdeEnlace(params).catch((e: Error) => setError(e.message));
  }, [params, completarDesdeEnlace]);

  if (error) {
    return (
      <MarcoAcceso titulo="No pudimos confirmar" bajada={error}>
        <BotonPrincipal variante="gris" onPress={() => router.replace("/login")}>
          Volver a iniciar sesión
        </BotonPrincipal>
      </MarcoAcceso>
    );
  }

  return (
    <MarcoAcceso titulo="Confirmando tu cuenta" bajada="Un segundo…">
      <View style={{ alignItems: "center" }}>
        <ActivityIndicator />
      </View>
    </MarcoAcceso>
  );
}
