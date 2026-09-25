import type { Detection } from "@mi-desorden/core";
import { useQuery } from "@tanstack/react-query";
import { FlatList, RefreshControl, StyleSheet, Text, View } from "react-native";
import { api } from "@/lib/api";

export default function Historial() {
  const { data, isFetching, refetch } = useQuery({
    queryKey: ["detections"],
    queryFn: () => api.detections(),
  });

  return (
    <FlatList<Detection>
      data={data?.items ?? []}
      keyExtractor={(d) => d.id}
      contentContainerStyle={styles.lista}
      refreshControl={<RefreshControl refreshing={isFetching} onRefresh={refetch} />}
      ListEmptyComponent={
        <View style={styles.centro}>
          <Text style={styles.vacio}>Sin detecciones todavía.</Text>
        </View>
      }
      renderItem={({ item }) => (
        <View style={styles.item}>
          <Text style={styles.titulo}>{item.etiqueta}</Text>
          <Text style={styles.sub}>
            {item.fuente} · {Math.round(item.confianza * 100)}% ·{" "}
            {new Date(item.creada_en).toLocaleString("es-AR")}
          </Text>
        </View>
      )}
    />
  );
}

const styles = StyleSheet.create({
  lista: { padding: 16, gap: 12, flexGrow: 1 },
  centro: { flex: 1, alignItems: "center", justifyContent: "center", padding: 32 },
  vacio: { color: "#888" },
  item: { padding: 16, borderRadius: 12, backgroundColor: "#f2f2f7", gap: 4 },
  titulo: { fontSize: 16, fontWeight: "600", textTransform: "capitalize" },
  sub: { color: "#666" },
});
