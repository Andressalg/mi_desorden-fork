import { PantallaAcceso } from "@/components/PantallaAcceso";

/** Misma pantalla que el login, abierta en "Crear cuenta" (el selector cambia de modo sin navegar). */
export default function Registro() {
  return <PantallaAcceso modoInicial="registro" />;
}
