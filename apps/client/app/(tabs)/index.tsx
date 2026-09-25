import type { Device } from "@mi-desorden/core";
import { useQuery } from "@tanstack/react-query";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { api } from "@/lib/api";

export default function Dispositivos() {
  const { data, isFetching, refetch, error } = useQuery({
    queryKey: ["devices"],
    queryFn: () => api.devices(),
  });

  if (error) {
    return (
      <View style={styles.centro}>
        <Text style={styles.vacio}>No se pudo hablar con la API.</Text>
      </View>
    );
  }

  return (
    <FlatList<Device>
      data={data?.items ?? []}
      keyExtractor={(d) => d.id}
      contentContainerStyle={styles.lista}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      ListEmptyComponent={
        <View style={styles.centro}>
          <Text style={styles.vacio}>Todavía no hay ningún ESP32 registrado.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.titulo}>{item.nombre}</Text>
          <Text style={styles.sub}>
            {item.ubicacion ?? "sin ubicación"} · {item.estado}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16, gap: 12, flexGrow: 1 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  vacio: { color: "#888", textAlign: "center" },
  item: { padding: 16, borderRadius: 12, backgroundColor: "#f2f2f7", gap: 4 },
  titulo: { fontSize: 16, fontWeight: "600" },
  sub: { color: "#666" },
});
