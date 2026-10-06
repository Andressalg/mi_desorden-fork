import type { Miembro, Rol } from "@mi-desorden/core";
import { useState } from "react";
import { Animated, Pressable, StyleSheet, Text, TextInput, View } from "react-native";
import { Icono, tocar, Vacio } from "@/components/ui";
import {
  Encabezado,
  Seccion,
  SegmentadoAnimado,
  Separador,
  Tarjeta,
  useEntrada,
  useSelectorInventario,
  Vista,
} from "@/components/vistas";
import { confirmar } from "@/lib/confirmar";
import { iniciales } from "@/lib/fecha";
import { useStore } from "@/lib/store";
import { useTema, type Tema } from "@/lib/theme";

const ROL_TEXTO: Record<Rol, string> = { dueño: "Dueño", editor: "Editor", lector: "Lector" };
const PALETA = ["#FF9500", "#007AFF", "#AF52DE", "#34C759", "#FF2D55", "#5AC8FA"];
const colorAvatar = (nombre: string) =>
  PALETA[[...nombre].reduce((a, c) => a + c.charCodeAt(0), 0) % PALETA.length]!;

type RolInvitable = Exclude<Rol, "dueño">;

export default function Accesos() {
  const t = useTema();
  const { activo, usuario, miRol, invitar, cambiarRol, quitarMiembro } = useStore();
  const [abierto, setAbierto] = useState<string | null>(null);
  const [email, setEmail] = useState("");
  const [rol, setRol] = useState<RolInvitable>("editor");
  const [enviando, setEnviando] = useState(false);
  const [aviso, setAviso] = useState<{ texto: string; error: boolean } | null>(null);
  const entrada = useEntrada(4);
  const elegirInventario = useSelectorInventario();

  if (!activo) {
    return (
      <Vista>
        <Encabezado titulo="Accesos" style={entrada(0)} />
        <Vacio
          sf="person.2"
          ion="people-outline"
          titulo="Sin inventarios"
          texto="Creá un inventario para compartirlo con tu equipo."
        />
      </Vista>
    );
  }

  const soyDueño = miRol === "dueño";
  const enLinea = activo.miembros.filter((m) => m.en_linea).length;
  const correo = email.trim().toLowerCase();
  const emailValido = /^\S+@\S+\.\S+$/.test(correo);
  const fallar = (e: Error) => setAviso({ texto: e.message, error: true });

  async function enviar() {
    if (!emailValido || !activo || enviando) return;
    if (activo.miembros.some((m) => m.email === correo)) {
      return setAviso({ texto: `${correo} ya tiene acceso.`, error: true });
    }
    setEnviando(true);
    setAviso(null);
    try {
      await invitar(activo.id, correo, rol);
      setAviso({ texto: `Listo: ${correo} ya tiene acceso.`, error: false });
      setEmail("");
    } catch (e) {
      fallar(e as Error);
    } finally {
      setEnviando(false);
    }
  }

  function quitar(m: Miembro) {
    if (!activo) return;
    const inv = activo.nombre;
    confirmar(
      `¿Quitar a ${m.nombre}?`,
      `Deja de ver “${inv}” al instante.`,
      "Quitar acceso",
      () => {
        setAbierto(null);
        quitarMiembro(activo.id, m.usuario_id)
          .then(() => setAviso({ texto: `${m.nombre} ya no ve “${inv}”.`, error: false }))
          .catch(fallar);
      },
    );
  }

  const colorAviso = aviso ? (aviso.error ? t.rojo : t.oscuro ? t.verde : "#248A3D") : t.textoSec;

  return (
    <Vista>
      <Encabezado
        sobre={activo.nombre}
        titulo="Accesos"
        alTocar={elegirInventario}
        tocarSobre
        style={entrada(0)}
      />

      <Seccion
        titulo={`${activo.miembros.length} ${activo.miembros.length === 1 ? "persona" : "personas"} · ${enLinea} en línea`}
        derecha={
          <View style={s.pila}>
            {activo.miembros.slice(0, 5).map((m) => (
              <View
                key={m.usuario_id}
                style={[s.mini, { backgroundColor: colorAvatar(m.nombre), borderColor: t.fondo }]}
              >
                <Text style={s.miniTexto}>{iniciales(m.nombre)}</Text>
              </View>
            ))}
          </View>
        }
        pie={
          soyDueño
            ? "Tocá a alguien para cambiar su rol o quitarle el acceso."
            : `Tu rol en este inventario: ${ROL_TEXTO[miRol]}.`
        }
        style={entrada(2)}
      >
        <Tarjeta>
          {activo.miembros.map((m, i) => {
            const yo = m.usuario_id === usuario?.id;
            const editable = soyDueño && !yo && m.rol !== "dueño";
            const abiertoEste = abierto === m.usuario_id;
            return (
              <View key={m.usuario_id}>
                {i > 0 ? <Separador sangria={68} /> : null}
                <Pressable
                  disabled={!editable}
                  accessibilityRole={editable ? "button" : undefined}
                  accessibilityState={editable ? { expanded: abiertoEste } : undefined}
                  onPress={() => (tocar(), setAbierto(abiertoEste ? null : m.usuario_id))}
                  style={({ pressed }) => [s.fila, pressed && { backgroundColor: t.relleno }]}
                >
                  <View>
                    <View style={[s.avatar, { backgroundColor: colorAvatar(m.nombre) }]}>
                      <Text style={s.avatarTexto}>{iniciales(m.nombre)}</Text>
                    </View>
                    {m.en_linea ? (
                      <View
                        style={[s.presencia, { backgroundColor: t.verde, borderColor: t.celda }]}
                      />
                    ) : null}
                  </View>
                  <View style={{ flex: 1, minWidth: 0, gap: 2 }}>
                    <Text style={[s.nombre, { color: t.texto }]} numberOfLines={1}>
                      {yo ? `${m.nombre} (vos)` : m.nombre}
                    </Text>
                    <Text
                      style={[s.sub, { color: m.en_linea ? t.verde : t.textoSec }]}
                      numberOfLines={1}
                    >
                      {m.en_linea ? "Viendo ahora" : m.email}
                    </Text>
                  </View>
                  <Insignia rol={m.rol} t={t} />
                  {editable ? (
                    <View style={{ transform: [{ rotate: abiertoEste ? "90deg" : "0deg" }] }}>
                      <Icono
                        sf="chevron.right"
                        ion="chevron-forward"
                        size={13}
                        color={t.textoTer}
                        weight="semibold"
                      />
                    </View>
                  ) : null}
                </Pressable>
                {abiertoEste ? (
                  <View style={s.edicion}>
                    <View style={{ flex: 1 }}>
                      <SegmentadoAnimado<RolInvitable>
                        valor={m.rol === "lector" ? "lector" : "editor"}
                        onCambio={(r) => cambiarRol(activo.id, m.usuario_id, r).catch(fallar)}
                        opciones={[
                          { valor: "lector", etiqueta: "Lector" },
                          { valor: "editor", etiqueta: "Editor" },
                        ]}
                      />
                    </View>
                    <Pressable
                      accessibilityRole="button"
                      onPress={() => quitar(m)}
                      style={({ pressed }) => [
                        s.quitar,
                        { backgroundColor: hexA(t.rojo, 0.1), opacity: pressed ? 0.6 : 1 },
                      ]}
                    >
                      <Text style={[s.quitarTexto, { color: t.rojo }]}>Quitar</Text>
                    </Pressable>
                  </View>
                ) : null}
              </View>
            );
          })}
        </Tarjeta>
      </Seccion>

      {soyDueño ? (
        <Seccion
          titulo="Invitar"
          pie={
            aviso?.texto ??
            "La persona tiene que tener cuenta. Los editores agregan y cambian productos; los lectores solo miran."
          }
          pieColor={colorAviso}
          style={entrada(3)}
        >
          <Tarjeta style={s.invitar}>
            <View style={s.correo}>
              <Icono sf="envelope" ion="mail-outline" size={20} color={t.textoTer} />
              <TextInput
                placeholder="correo@ejemplo.com"
                placeholderTextColor={t.textoTer}
                value={email}
                onChangeText={(v) => (setEmail(v), setAviso(null))}
                autoCapitalize="none"
                keyboardType="email-address"
                autoComplete="email"
                returnKeyType="send"
                onSubmitEditing={enviar}
                selectionColor={t.tinte}
                style={[s.correoInput, { color: t.texto }]}
              />
            </View>
            <View style={{ flexDirection: "row", gap: 6 }}>
              <View style={{ flex: 1 }}>
                <SegmentadoAnimado<RolInvitable>
                  valor={rol}
                  onCambio={setRol}
                  alto={44}
                  redondo
                  opciones={[
                    { valor: "lector", etiqueta: "Lector" },
                    { valor: "editor", etiqueta: "Editor" },
                  ]}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ disabled: !emailValido, busy: enviando }}
                disabled={!emailValido || enviando}
                onPress={() => (tocar(), enviar())}
                style={({ pressed }) => [
                  s.darAcceso,
                  {
                    backgroundColor: t.tinte,
                    opacity: !emailValido || enviando ? 0.4 : pressed ? 0.85 : 1,
                  },
                ]}
              >
                <Text style={s.darAccesoTexto}>{enviando ? "Enviando…" : "Dar acceso"}</Text>
              </Pressable>
            </View>
          </Tarjeta>
        </Seccion>
      ) : (
        <Animated.Text style={[s.soloDueño, { color: t.textoSec }, entrada(3)]}>
          Solo el dueño puede invitar gente.
        </Animated.Text>
      )}
    </Vista>
  );
}

function Insignia({ rol, t }: { rol: Rol; t: Tema }) {
  const dueño = rol === "dueño";
  return (
    <View style={[s.insignia, { backgroundColor: dueño ? hexA(t.tinte, 0.14) : t.relleno }]}>
      <Text
        style={[s.insigniaTexto, { color: dueño ? (t.oscuro ? t.tinte : "#C46E00") : t.textoSec }]}
      >
        {ROL_TEXTO[rol]}
      </Text>
    </View>
  );
}

function hexA(hex: string, a: number) {
  const n = Number.parseInt(hex.slice(1), 16);
  return `rgba(${(n >> 16) & 255},${(n >> 8) & 255},${n & 255},${a})`;
}

const s = StyleSheet.create({
  pila: { flexDirection: "row", paddingLeft: 6 },
  mini: {
    width: 22,
    height: 22,
    marginLeft: -6,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: "center",
    justifyContent: "center",
  },
  miniTexto: { color: "#fff", fontSize: 9, fontWeight: "700" },
  fila: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    minHeight: 64,
    paddingLeft: 16,
    paddingRight: 14,
    paddingVertical: 10,
  },
  avatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarTexto: { color: "#fff", fontSize: 15, fontWeight: "600" },
  presencia: {
    position: "absolute",
    right: -1,
    bottom: -1,
    width: 13,
    height: 13,
    borderRadius: 7,
    borderWidth: 2.5,
  },
  nombre: { fontSize: 17, letterSpacing: -0.4 },
  sub: { fontSize: 13 },
  insignia: { height: 24, paddingHorizontal: 10, borderRadius: 12, justifyContent: "center" },
  insigniaTexto: { fontSize: 13, fontWeight: "600" },
  edicion: {
    flexDirection: "row",
    gap: 8,
    paddingTop: 4,
    paddingRight: 16,
    paddingBottom: 12,
    paddingLeft: 68,
  },
  quitar: { height: 34, paddingHorizontal: 12, borderRadius: 10, justifyContent: "center" },
  quitarTexto: { fontSize: 13, fontWeight: "600" },
  invitar: { padding: 6, gap: 6 },
  correo: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    height: 48,
    paddingHorizontal: 12,
  },
  correoInput: { flex: 1, minWidth: 0, fontSize: 17, letterSpacing: -0.4, paddingVertical: 0 },
  darAcceso: { height: 44, paddingHorizontal: 18, borderRadius: 22, justifyContent: "center" },
  darAccesoTexto: { color: "#fff", fontSize: 15, fontWeight: "600" },
  soloDueño: { fontSize: 13, textAlign: "center" },
});
