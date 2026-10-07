import type { Producto } from "@mi-desorden/core";
import { useEffect, useRef } from "react";
import { Animated, Pressable, StyleSheet, Text, View } from "react-native";
import { Icono, tocar } from "@/components/ui";
import { FotoProducto } from "@/components/vistas";
import { haceCuanto } from "@/lib/fecha";
import { colorLed, tipo, useTema, type Tema } from "@/lib/theme";

export function estadoStock(t: Tema, p: Producto) {
  if (p.cantidad === 0) return { texto: "Agotado", color: t.rojo };
  if (p.cantidad < p.minimo) return { texto: "Por reponer", color: t.tinte };
  return { texto: "", color: t.texto };
}

/**
 * Fila de producto. Se ilumina un instante cuando cambia en vivo (otra persona
 * o la cámara). `categoria` se muestra solo si se pasa (fuera de las carpetas).
 */
export function FilaProducto({
  producto,
  categoria,
  onPress,
}: {
  producto: Producto;
  categoria?: string;
  onPress: () => void;
}) {
  const t = useTema();
  const brillo = useRef(new Animated.Value(0)).current;
  const anterior = useRef(producto.actualizado_en);

  useEffect(() => {
    if (anterior.current === producto.actualizado_en) return;
    anterior.current = producto.actualizado_en;
    brillo.setValue(1);
    Animated.timing(brillo, { toValue: 0, duration: 900, useNativeDriver: false }).start();
  }, [producto.actualizado_en, brillo]);

  const estado = estadoStock(t, producto);
  const fondo = brillo.interpolate({
    inputRange: [0, 1],
    outputRange: [`${t.tinte}00`, `${t.tinte}2E`], // 0 → 18 % de naranja, como el diseño
  });
  const led = colorLed(t, producto.led);

  return (
    <Pressable onPress={() => (tocar(), onPress())}>
      {({ pressed }) => (
        <Animated.View style={[s.fila, { backgroundColor: pressed ? t.relleno : fondo }]}>
          <View style={[s.led, { backgroundColor: led, shadowColor: led }]} />
          {producto.foto_path ? (
            <FotoProducto ruta={producto.foto_path} tam={40} version={producto.actualizado_en} />
          ) : null}
          <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
            <Text style={[tipo.cuerpo, { color: t.texto, fontWeight: "500" }]} numberOfLines={1}>
              {producto.nombre}
            </Text>
            <View style={s.meta}>
              {producto.fuente === "camara" ? (
                <Icono sf="camera.fill" ion="videocam" size={11} color={t.textoSec} />
              ) : null}
              <Text style={[tipo.nota, { color: t.textoSec, flexShrink: 1 }]} numberOfLines={1}>
                {[producto.ubicacion, categoria, haceCuanto(producto.actualizado_en)]
                  .filter(Boolean)
                  .join(" · ")}
              </Text>
            </View>
          </View>
          <View style={{ alignItems: "flex-end" }}>
            <Text style={[tipo.titulo3, s.numero, { color: estado.color }]}>
              {producto.cantidad}
            </Text>
            {estado.texto ? (
              <Text style={[tipo.leyenda, { color: estado.color, fontWeight: "600" }]}>
                {estado.texto}
              </Text>
            ) : null}
          </View>
          <Icono
            sf="chevron.right"
            ion="chevron-forward"
            size={13}
            color={t.textoTer}
            weight="semibold"
          />
        </Animated.View>
      )}
    </Pressable>
  );
}

const s = StyleSheet.create({
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
    minHeight: 64,
    paddingLeft: 16,
    paddingRight: 14,
    paddingVertical: 10,
  },
  led: {
    width: 12,
    height: 12,
    borderRadius: 6,
    shadowOpacity: 0.8,
    shadowRadius: 5,
    shadowOffset: { width: 0, height: 0 },
  },
  meta: { flexDirection: "row", alignItems: "center", gap: 4 },
  numero: { fontVariant: ["tabular-nums"], fontWeight: "600" },
});
