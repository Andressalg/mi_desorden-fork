import type { LedColor } from "@mi-desorden/core";
import { router, Stack, useLocalSearchParams } from "expo-router";
import { useState } from "react";
import { Pressable, StyleSheet, Text, View } from "react-native";
import { MenuCategoria } from "@/components/menus";
import { Stepper } from "@/components/Stepper";
import { FotoProducto } from "@/components/vistas";
import { BotonPrincipal, CampoFila, Contenido, Fila, Grupo, Icono, tocar } from "@/components/ui";
import { confirmar } from "@/lib/confirmar";
import { haceCuanto } from "@/lib/fecha";
import { puedeEditar, useStore } from "@/lib/store";
import { colorLed, tipo, useTema } from "@/lib/theme";

const LEDS: LedColor[] = ["verde", "azul", "amarillo", "rojo", "violeta"];

export default function ProductoForm() {
  const t = useTema();
  // categoria: viene preelegida al crear el producto desde una carpeta.
  const params = useLocalSearchParams<{ id?: string; categoria?: string }>();
  const id = params.id;
  const {
    productosActivos,
    categoriasActivas,
    guardarProducto,
    eliminarProducto,
    quitarFotoProducto,
    miRol,
  } = useStore();
  const existente = id ? productosActivos.find((p) => p.id === id) : undefined;
  const editable = puedeEditar(miRol);

  const [nombre, setNombre] = useState(existente?.nombre ?? "");
  const [categoriaId, setCategoriaId] = useState<string | null>(
    existente?.categoria_id ?? params.categoria ?? null,
  );
  const categoriaValida = !!categoriaId && categoriasActivas.some((c) => c.id === categoriaId);
  const [cantidad, setCantidad] = useState(existente?.cantidad ?? 1);
  const [minimo, setMinimo] = useState(existente?.minimo ?? 1);
  const [ubicacion, setUbicacion] = useState(existente?.ubicacion ?? "");
  const [led, setLed] = useState<LedColor>(existente?.led ?? "verde");
  const [fotoError, setFotoError] = useState<string | null>(null);

  const [guardando, setGuardando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const valido =
    nombre.trim().length > 0 && ubicacion.trim().length > 0 && categoriaValida && !guardando;

  async function guardar() {
    if (!valido) return;
    setGuardando(true);
    setError(null);
    try {
      await guardarProducto(existente?.id ?? null, {
        nombre: nombre.trim(),
        categoria_id: categoriaId,
        cantidad,
        minimo,
        ubicacion: ubicacion.trim().toUpperCase(),
        led,
      });
      router.back();
    } catch (e) {
      setError((e as Error).message);
      setGuardando(false);
    }
  }

  function eliminar() {
    if (!existente) return;
    confirmar(
      `¿Eliminar “${existente.nombre}”?`,
      "Se borra del inventario para todos los que tienen acceso.",
      "Eliminar",
      () => {
        eliminarProducto(existente.id)
          .then(() => router.back())
          .catch((e: Error) => setError(e.message));
      },
    );
  }

  const textoHeader = (texto: string, onPress: () => void, fuerte?: boolean, apagado?: boolean) => (
    <Pressable onPress={onPress} disabled={apagado} hitSlop={10}>
      <Text
        style={[
          tipo.cuerpo,
          { color: apagado ? t.textoTer : t.tinte, fontWeight: fuerte ? "600" : "400" },
        ]}
      >
        {texto}
      </Text>
    </Pressable>
  );

  return (
    <>
      <Stack.Screen
        options={{
          title: existente ? "Producto" : "Nuevo producto",
          headerLeft: () => textoHeader("Cancelar", () => router.back()),
        }}
      />
      <Contenido
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={{ paddingTop: 16, paddingBottom: 48 }}
      >
        <Grupo pie={error ?? undefined} pieError>
          <CampoFila
            placeholder="Nombre"
            value={nombre}
            onChangeText={setNombre}
            editable={editable}
            autoFocus={!existente}
          />
          <Fila
            titulo="Categoría"
            derecha={
              <MenuCategoria
                categorias={categoriasActivas}
                valor={categoriaValida ? categoriaId : null}
                onCambio={setCategoriaId}
                onNueva={() => router.push("/categoria")}
                editable={editable}
              />
            }
          />
        </Grupo>

        <Grupo titulo="Stock" pie="Cuando baje del mínimo lo vas a ver en “Por reponer”.">
          <Fila
            titulo="Cantidad"
            derecha={
              editable ? (
                <Numero n={cantidad} onCambio={setCantidad} />
              ) : (
                <Text style={[tipo.cuerpo, { color: t.textoSec }]}>{cantidad}</Text>
              )
            }
          />
          <Fila
            titulo="Mínimo"
            derecha={
              editable ? (
                <Numero n={minimo} onCambio={setMinimo} />
              ) : (
                <Text style={[tipo.cuerpo, { color: t.textoSec }]}>{minimo}</Text>
              )
            }
          />
        </Grupo>

        <Grupo
          titulo="En la estantería"
          pie="La cámara busca el LED de este color para reconocer el hueco del producto."
        >
          <CampoFila
            etiqueta="Lugar"
            placeholder="A1"
            value={ubicacion}
            onChangeText={setUbicacion}
            autoCapitalize="characters"
            editable={editable}
          />
          <View style={s.leds}>
            {LEDS.map((c) => {
              const activo = c === led;
              const hex = colorLed(t, c);
              return (
                <Pressable
                  key={c}
                  accessibilityLabel={`LED ${c}`}
                  accessibilityState={{ selected: activo }}
                  disabled={!editable}
                  onPress={() => (tocar(), setLed(c))}
                  style={[s.anillo, { borderColor: activo ? hex : "transparent" }]}
                >
                  <View style={[s.circulo, { backgroundColor: hex }]}>
                    {activo ? (
                      <Icono sf="checkmark" ion="checkmark" size={16} color="#fff" weight="bold" />
                    ) : null}
                  </View>
                </Pressable>
              );
            })}
          </View>
        </Grupo>

        {/* En el contenido y no en el encabezado: en iOS 26 los botones del encabezado
            del modal perdían el primer toque con el teclado abierto. */}
        {editable ? (
          <BotonPrincipal onPress={guardar} deshabilitado={!valido} cargando={guardando}>
            {existente ? "Guardar cambios" : "Agregar al inventario"}
          </BotonPrincipal>
        ) : null}

        {existente && (existente.foto_path || editable) ? (
          <Grupo
            titulo="Foto"
            pie={
              fotoError ??
              "Ayuda a reconocerlo de un vistazo. Solo la ven quienes tienen acceso al inventario."
            }
            pieError={!!fotoError}
          >
            {existente.foto_path ? (
              <View style={s.foto}>
                <FotoProducto
                  ruta={existente.foto_path}
                  tam={220}
                  version={existente.actualizado_en}
                />
              </View>
            ) : null}
            {editable ? (
              <Fila
                titulo={existente.foto_path ? "Cambiar foto" : "Tomar foto"}
                tinte
                onPress={() => router.push({ pathname: "/foto", params: { id: existente.id } })}
              />
            ) : null}
            {editable && existente.foto_path ? (
              <Fila
                titulo="Quitar foto"
                destructiva
                onPress={() =>
                  confirmar(
                    "¿Quitar la foto?",
                    "Se borra para todos los que tienen acceso.",
                    "Quitar",
                    () => {
                      setFotoError(null);
                      quitarFotoProducto(existente).catch((e: Error) => setFotoError(e.message));
                    },
                  )
                }
              />
            ) : null}
          </Grupo>
        ) : null}

        {existente ? (
          <Grupo>
            <Fila titulo="Última actualización" valor={haceCuanto(existente.actualizado_en)} />
            <Fila titulo="Origen" valor={existente.fuente === "camara" ? "Cámara" : "Manual"} />
          </Grupo>
        ) : null}

        {existente && editable ? (
          <Grupo>
            <Fila titulo="Eliminar producto" destructiva onPress={eliminar} />
          </Grupo>
        ) : null}

        {!editable ? (
          <Text style={[tipo.nota, { color: t.textoSec, textAlign: "center" }]}>
            Tenés acceso de solo lectura a este inventario.
          </Text>
        ) : null}
      </Contenido>
    </>
  );
}

function Numero({ n, onCambio }: { n: number; onCambio: (n: number) => void }) {
  const t = useTema();
  return (
    <View style={s.numero}>
      <Text
        style={[
          tipo.cuerpo,
          { color: t.texto, fontVariant: ["tabular-nums"], minWidth: 28, textAlign: "right" },
        ]}
      >
        {n}
      </Text>
      <Stepper valor={n} onCambio={onCambio} />
    </View>
  );
}

const s = StyleSheet.create({
  foto: { alignItems: "center", paddingVertical: 16 },
  numero: { flexDirection: "row", alignItems: "center", gap: 12 },
  leds: {
    flexDirection: "row",
    justifyContent: "space-around",
    paddingVertical: 14,
    paddingHorizontal: 8,
  },
  anillo: {
    width: 46,
    height: 46,
    borderRadius: 23,
    borderWidth: 3,
    alignItems: "center",
    justifyContent: "center",
  },
  circulo: {
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
  },
});
