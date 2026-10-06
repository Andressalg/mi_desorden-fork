import { useQuery } from "@tanstack/react-query";
import { router, useFocusEffect } from "expo-router";
import { useCallback, useRef, useState, type ReactNode } from "react";
import {
  AccessibilityInfo,
  Animated,
  Easing,
  Image,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
  type RefreshControlProps,
  type StyleProp,
  type ViewStyle,
} from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { productos as productosApi } from "@/api";
import { ANCHO_LECTURA, Icono, tocar } from "@/components/ui";
import { useStore } from "@/lib/store";
import { useTema } from "@/lib/theme";

/**
 * Piezas del rediseño de las vistas principales (Claude Design · "Vistas
 * Principales"): encabezado grande, píldoras de inventario, selector con
 * pulgar deslizante, secciones blancas y la entrada escalonada al cambiar de tab.
 */

const BEZ_SALIDA = Easing.bezier(0.2, 0.9, 0.2, 1);
const BEZ_SEG = Easing.bezier(0.3, 0.9, 0.3, 1);

/**
 * Entrada escalonada: cada bloque sube 14 px y aparece, 60 ms después del
 * anterior. Se repite cada vez que la tab gana el foco, como en el diseño.
 */
export function useEntrada(bloques: number) {
  const valores = useRef(Array.from({ length: bloques }, () => new Animated.Value(0))).current;
  useFocusEffect(
    useCallback(() => {
      let vivo = true;
      AccessibilityInfo.isReduceMotionEnabled().then((reducir) => {
        if (!vivo) return;
        if (reducir) return valores.forEach((v) => v.setValue(1));
        valores.forEach((v) => v.setValue(0));
        Animated.stagger(
          60,
          valores.map((v) =>
            Animated.timing(v, {
              toValue: 1,
              duration: 560,
              easing: BEZ_SALIDA,
              useNativeDriver: true,
            }),
          ),
        ).start();
      });
      return () => {
        vivo = false;
      };
    }, [valores]),
  );
  return (i: number) => ({
    opacity: valores[i],
    transform: [
      { translateY: valores[i]!.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) },
    ],
  });
}

/** Contenedor con scroll: márgenes del diseño, safe area y ancho máximo en tablet. */
export function Vista({
  children,
  refreshControl,
  gap = 16,
}: {
  children: ReactNode;
  refreshControl?: React.ReactElement<RefreshControlProps>;
  gap?: number;
}) {
  const t = useTema();
  const insets = useSafeAreaInsets();
  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: t.fondo }}
      // En iOS las tabs nativas ajustan solas los márgenes del primer scroll (zona segura
      // arriba, tab bar abajo): si además se suma insets.top, el título baja ~60 pt.
      // En Android no lo hacen, así que ahí van a mano.
      contentInsetAdjustmentBehavior="automatic"
      contentContainerStyle={
        Platform.OS === "ios"
          ? { paddingTop: 8, paddingBottom: 32 }
          : { paddingTop: insets.top + 8, paddingBottom: insets.bottom + 120 }
      }
      keyboardShouldPersistTaps="handled"
      keyboardDismissMode="interactive"
      showsVerticalScrollIndicator={false}
      refreshControl={refreshControl}
    >
      <View style={[s.lectura, { gap }]}>{children}</View>
    </ScrollView>
  );
}

/** Título grande con una línea chica arriba (estado o inventario) y una acción a la derecha. */
export function Encabezado({
  sobre,
  punto,
  titulo,
  accion,
  style,
}: {
  sobre?: string;
  punto?: string;
  titulo: string;
  accion?: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTema();
  return (
    <Animated.View style={[s.encabezado, style]}>
      <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
        {sobre ? (
          <View style={s.sobre}>
            {punto ? <View style={[s.punto, { backgroundColor: punto }]} /> : null}
            <Text style={[s.sobreTexto, { color: t.textoSec }]} numberOfLines={1}>
              {sobre}
            </Text>
          </View>
        ) : null}
        <Text style={[s.titulo, { color: t.texto }]} numberOfLines={1}>
          {titulo}
        </Text>
      </View>
      {accion}
    </Animated.View>
  );
}

/** Botón redondo blanco del encabezado (el "+" de Inventario). */
export function BotonRedondo({
  sf,
  ion,
  etiqueta,
  onPress,
}: {
  sf: Parameters<typeof Icono>[0]["sf"];
  ion: Parameters<typeof Icono>[0]["ion"];
  etiqueta: string;
  onPress: () => void;
}) {
  const t = useTema();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={etiqueta}
      onPress={() => (tocar(), onPress())}
      style={({ pressed }) => [
        s.redondo,
        { backgroundColor: t.celda, transform: [{ scale: pressed ? 0.94 : 1 }] },
      ]}
    >
      <Icono sf={sf} ion={ion} size={24} color={t.tinte} weight="semibold" />
    </Pressable>
  );
}

/** Píldoras para cambiar de inventario; el activo va en negro (blanco en modo oscuro). */
export function PildorasInventario({
  conNuevo = true,
  style,
}: {
  conNuevo?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTema();
  const { inventarios, activo, seleccionarInventario } = useStore();
  return (
    <Animated.View style={style}>
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={{ marginHorizontal: -16, flexGrow: 0 }}
        contentContainerStyle={{ gap: 8, paddingHorizontal: 16 }}
      >
        {inventarios.map((inv) => {
          const sel = inv.id === activo?.id;
          return (
            <Pressable
              key={inv.id}
              accessibilityRole="tab"
              accessibilityState={{ selected: sel }}
              onPress={() => (tocar(), seleccionarInventario(inv.id))}
              style={({ pressed }) => [
                s.pildora,
                { backgroundColor: sel ? t.texto : t.celda, opacity: pressed ? 0.75 : 1 },
              ]}
            >
              <Text style={[s.pildoraTexto, { color: sel ? t.fondo : t.texto }]} numberOfLines={1}>
                {inv.nombre}
              </Text>
            </Pressable>
          );
        })}
        {conNuevo ? (
          <Pressable
            accessibilityRole="button"
            onPress={() => (tocar(), router.push("/inventario-nuevo"))}
            style={({ pressed }) => [
              s.pildora,
              s.pildoraNueva,
              { borderColor: t.textoTer, opacity: pressed ? 0.6 : 1 },
            ]}
          >
            <Text style={[s.pildoraTexto, { color: t.textoSec }]}>+ Nuevo</Text>
          </Pressable>
        ) : null}
      </ScrollView>
    </Animated.View>
  );
}

/** Selector segmentado con pulgar que se desliza (filtros, roles). */
export function SegmentadoAnimado<T extends string>({
  opciones,
  valor,
  onCambio,
  alto = 34,
  redondo = false,
}: {
  opciones: { valor: T; etiqueta: string }[];
  valor: T;
  onCambio: (v: T) => void;
  alto?: number;
  /** Cápsula (el de invitar) en vez de esquinas de 10. */
  redondo?: boolean;
}) {
  const t = useTema();
  const [ancho, setAncho] = useState(0);
  const indice = Math.max(
    0,
    opciones.findIndex((o) => o.valor === valor),
  );
  const pos = useRef(new Animated.Value(indice)).current;
  const anterior = useRef(indice);
  if (anterior.current !== indice) {
    anterior.current = indice;
    Animated.timing(pos, {
      toValue: indice,
      duration: 300,
      easing: BEZ_SEG,
      useNativeDriver: true,
    }).start();
  }
  const anchoOpcion = (ancho - 4) / opciones.length;
  const radio = redondo ? alto / 2 : 10;
  return (
    <View
      onLayout={(e) => setAncho(e.nativeEvent.layout.width)}
      style={[s.segmento, { height: alto, borderRadius: radio, backgroundColor: t.relleno }]}
    >
      {ancho > 0 ? (
        <Animated.View
          style={[
            s.segmentoPulgar,
            {
              width: anchoOpcion,
              borderRadius: radio - 2,
              backgroundColor: t.oscuro ? "#636366" : "#fff",
              transform: [{ translateX: Animated.multiply(pos, anchoOpcion) }],
            },
          ]}
        />
      ) : null}
      {opciones.map((o) => (
        <Pressable
          key={o.valor}
          accessibilityRole="tab"
          accessibilityState={{ selected: o.valor === valor }}
          onPress={() => {
            if (o.valor === valor) return;
            tocar();
            onCambio(o.valor);
          }}
          style={s.segmentoOpcion}
        >
          <Text
            style={{
              color: t.texto,
              fontSize: redondo ? 15 : 13,
              fontWeight: redondo || o.valor === valor ? "600" : "500",
              letterSpacing: -0.1,
            }}
            numberOfLines={1}
          >
            {o.etiqueta}
          </Text>
        </Pressable>
      ))}
    </View>
  );
}

/** Título chico de una sección y su tarjeta blanca de esquinas 26. */
export function Seccion({
  titulo,
  derecha,
  pie,
  pieColor,
  children,
  style,
}: {
  titulo?: string;
  derecha?: ReactNode;
  pie?: string;
  pieColor?: string;
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTema();
  return (
    <Animated.View style={[{ gap: 6 }, style]}>
      {titulo || derecha ? (
        <View style={s.seccionCabecera}>
          {titulo ? (
            <Text style={[s.seccionTitulo, { color: t.textoSec }]}>{titulo}</Text>
          ) : (
            <View />
          )}
          {derecha}
        </View>
      ) : null}
      {children}
      {pie ? <Text style={[s.pie, { color: pieColor ?? t.textoSec }]}>{pie}</Text> : null}
    </Animated.View>
  );
}

export function Tarjeta({
  children,
  style,
}: {
  children: ReactNode;
  style?: StyleProp<ViewStyle>;
}) {
  const t = useTema();
  return <View style={[s.tarjeta, { backgroundColor: t.celda }, style]}>{children}</View>;
}

/** Separador con sangría (alineado al texto, no al ícono). */
export function Separador({ sangria = 16 }: { sangria?: number }) {
  const t = useTema();
  return (
    <View
      style={{
        height: StyleSheet.hairlineWidth,
        marginLeft: sangria,
        backgroundColor: t.separador,
      }}
    />
  );
}

/** Miniatura de la foto del producto (URL firmada de Storage, cacheada por React Query). */
export function FotoProducto({
  ruta,
  tam = 40,
  version,
}: {
  ruta: string;
  tam?: number;
  version?: string;
}) {
  const t = useTema();
  const { data: url } = useQuery({
    queryKey: ["foto", ruta, version],
    queryFn: () => productosApi.urlFoto(ruta),
    staleTime: 50 * 60_000, // la URL firmada dura una hora
  });
  return (
    <View
      style={{
        width: tam,
        height: tam,
        borderRadius: tam * 0.22,
        overflow: "hidden",
        backgroundColor: t.relleno,
      }}
    >
      {url ? (
        <Image source={{ uri: url }} style={{ width: tam, height: tam }} resizeMode="cover" />
      ) : null}
    </View>
  );
}

const s = StyleSheet.create({
  lectura: { width: "100%", maxWidth: ANCHO_LECTURA, alignSelf: "center", paddingHorizontal: 16 },
  encabezado: {
    flexDirection: "row",
    alignItems: "flex-end",
    gap: 12,
    paddingTop: 8,
    paddingHorizontal: 4,
  },
  sobre: { flexDirection: "row", alignItems: "center", gap: 6 },
  punto: { width: 7, height: 7, borderRadius: 4 },
  sobreTexto: { fontSize: 13, flexShrink: 1 },
  titulo: { fontSize: 34, fontWeight: "700", letterSpacing: -0.8 },
  redondo: {
    width: 44,
    height: 44,
    marginBottom: 2,
    borderRadius: 22,
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 3,
    shadowOffset: { width: 0, height: 1 },
  },
  pildora: {
    height: 34,
    paddingHorizontal: 14,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
  pildoraNueva: { backgroundColor: "transparent", borderWidth: 1, borderStyle: "dashed" },
  pildoraTexto: { fontSize: 15, fontWeight: "600", letterSpacing: -0.2 },
  segmento: { flexDirection: "row", padding: 2 },
  segmentoPulgar: {
    position: "absolute",
    top: 2,
    bottom: 2,
    left: 2,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  segmentoOpcion: { flex: 1, alignItems: "center", justifyContent: "center" },
  seccionCabecera: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
  },
  seccionTitulo: { fontSize: 13, fontWeight: "600" },
  pie: { fontSize: 13, paddingHorizontal: 16 },
  tarjeta: { borderRadius: 26, overflow: "hidden" },
});
