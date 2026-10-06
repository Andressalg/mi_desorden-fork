import { useQuery } from "@tanstack/react-query";
import Constants from "expo-constants";
import { router } from "expo-router";
import { StyleSheet, Switch, Text, View } from "react-native";
import { Avatar, Contenido, Fila, Grupo, IconoCelda } from "@/components/ui";
import { api } from "@/lib/api";
import { confirmar } from "@/lib/confirmar";
import { useStore } from "@/lib/store";
import { tipo, useTema } from "@/lib/theme";

export default function Perfil() {
  const t = useTema();
  const { usuario, inventarios, seleccionarInventario, enVivo, setEnVivo, cerrarSesion } =
    useStore();
  const dispositivos = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.devices(),
    retry: false,
  });

  if (!usuario) return null;

  return (
    <Contenido>
      <View style={s.heroe}>
        <Avatar nombre={usuario.nombre} tam={88} />
        <Text style={[tipo.titulo2, { color: t.texto }]}>{usuario.nombre}</Text>
        <Text style={[tipo.subtitulo, { color: t.textoSec }]}>{usuario.email}</Text>
      </View>

      <Grupo titulo="Mis inventarios" sangria={58}>
        {inventarios.map((inv) => {
          const n = inv.total_productos;
          return (
            <Fila
              key={inv.id}
              izquierda={<IconoCelda sf="shippingbox.fill" ion="cube" fondo={t.tinte} />}
              titulo={inv.nombre}
              subtitulo={`${n} productos · ${inv.miembros.length} ${inv.miembros.length === 1 ? "persona" : "personas"}`}
              chevron
              onPress={() => {
                seleccionarInventario(inv.id);
                router.navigate("/");
              }}
            />
          );
        })}
      </Grupo>

      <Grupo
        titulo="Dispositivos"
        sangria={58}
        pie="Los ESP32-S3 aparecen solos cuando mandan su primer heartbeat a la API."
      >
        {dispositivos.isError ? (
          <Fila
            izquierda={<IconoCelda sf="cpu" ion="hardware-chip" fondo="#8E8E93" />}
            titulo="Sin conexión con la API"
            subtitulo="Revisá que esté corriendo"
          />
        ) : dispositivos.data?.items.length ? (
          dispositivos.data.items.map((d) => (
            <Fila
              key={d.id}
              izquierda={
                <IconoCelda
                  sf="cpu"
                  ion="hardware-chip"
                  fondo={d.estado === "online" ? t.verde : "#8E8E93"}
                />
              }
              titulo={d.nombre}
              subtitulo={d.ubicacion ?? "Sin ubicación"}
              valor={
                d.estado === "online"
                  ? "En línea"
                  : d.estado === "durmiendo"
                    ? "Durmiendo"
                    : "Sin conexión"
              }
            />
          ))
        ) : (
          <Fila
            izquierda={<IconoCelda sf="cpu" ion="hardware-chip" fondo="#8E8E93" />}
            titulo={dispositivos.isLoading ? "Buscando…" : "Ninguno todavía"}
          />
        )}
      </Grupo>

      <Grupo
        titulo="Preferencias"
        sangria={58}
        pie="Cuando está activa, la lista se actualiza sola cada vez que la cámara recuenta un estante."
      >
        <Fila
          izquierda={<IconoCelda sf="dot.radiowaves.left.and.right" ion="radio" fondo={t.verde} />}
          titulo="Actualización en vivo"
          derecha={
            <Switch value={enVivo} onValueChange={setEnVivo} trackColor={{ true: t.verde }} />
          }
        />
      </Grupo>

      <Grupo titulo="Acerca de">
        <Fila titulo="API" valor={process.env.EXPO_PUBLIC_API_URL ?? "localhost:3000"} />
        <Fila titulo="Versión" valor={Constants.expoConfig?.version ?? "—"} />
      </Grupo>

      <Grupo>
        <Fila
          titulo="Cerrar sesión"
          destructiva
          onPress={() =>
            confirmar(
              "¿Cerrar sesión?",
              "Tus inventarios quedan guardados en tu cuenta.",
              "Cerrar sesión",
              () => void cerrarSesion(),
            )
          }
        />
      </Grupo>
    </Contenido>
  );
}

const s = StyleSheet.create({
  heroe: { alignItems: "center", gap: 6, paddingTop: 8 },
});
