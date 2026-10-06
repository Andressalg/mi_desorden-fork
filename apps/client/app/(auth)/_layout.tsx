import { Stack } from "expo-router";
import { useTema } from "@/lib/theme";

export default function AuthLayout() {
  const t = useTema();
  return (
    <Stack
      initialRouteName="login"
      screenOptions={{ headerShown: false, contentStyle: { backgroundColor: t.fondo } }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="registro" />
      <Stack.Screen name="confirmar" />
      <Stack.Screen name="callback" />
    </Stack>
  );
}
