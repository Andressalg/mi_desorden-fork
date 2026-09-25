import Constants from "expo-constants";
import { StyleSheet, Text, View } from "react-native";

export default function Ajustes() {
  const apiUrl = process.env.EXPO_PUBLIC_API_URL ?? "sin configurar";

  return (
    <View style={styles.contenedor}>
      <View style={styles.fila}>
        <Text style={styles.label}>API</Text>
        <Text style={styles.valor}>{apiUrl}</Text>
      </View>
      <View style={styles.fila}>
        <Text style={styles.label}>Versión</Text>
        <Text style={styles.valor}>{Constants.expoConfig?.version ?? "—"}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  contenedor: { padding: 16, gap: 12 },
  fila: { padding: 16, borderRadius: 12, backgroundColor: "#f2f2f7", gap: 4 },
  label: { fontWeight: "600" },
  valor: { color: "#666" },
});
