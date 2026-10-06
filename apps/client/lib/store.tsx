import AsyncStorage from "@react-native-async-storage/async-storage";
import type { Inventario, Miembro, Producto, ProductoInput, Rol, Usuario } from "@mi-desorden/core";
import type { Session } from "@supabase/supabase-js";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { supabase } from "@/lib/supabase";

/**
 * Estado de la app sobre Supabase:
 * - Auth con email + contraseña (la sesión queda en AsyncStorage).
 * - Inventarios y productos con React Query.
 * - Realtime: cambios de productos/miembros del inventario activo y presence
 *   para saber quién lo está mirando. Se apaga con "Actualización en vivo".
 */

const CLAVE_ACTIVO = "mi_desorden:activo";
const CLAVE_VIVO = "mi_desorden:en-vivo";

type FilaInventario = {
  id: string;
  nombre: string;
  lugar: string;
  creado_en: string;
  miembros: { usuario_id: string; rol: Rol; perfiles: { nombre: string; email: string } | null }[];
  productos: { count: number }[];
};

/** Pasa los errores de Supabase a algo que se pueda mostrar. */
export function mensajeError(e: unknown): string {
  const msg = (e as { message?: string })?.message ?? String(e);
  if (/invalid login credentials/i.test(msg)) return "Correo o contraseña incorrectos.";
  if (/email not confirmed/i.test(msg)) return "Confirmá tu correo antes de entrar.";
  if (/user already registered/i.test(msg)) return "Ya hay una cuenta con ese correo.";
  if (/password should be at least/i.test(msg)) return "La contraseña es muy corta.";
  if (/rate limit/i.test(msg)) return "Demasiados intentos. Esperá un minuto.";
  if (/network|fetch/i.test(msg)) return "Sin conexión. Revisá tu internet.";
  return msg;
}

function usuarioDeSesion(s: Session | null): Usuario | null {
  if (!s) return null;
  const email = s.user.email ?? "";
  return {
    id: s.user.id,
    email,
    nombre: (s.user.user_metadata?.nombre as string | undefined) || email.split("@")[0] || "Yo",
    creado_en: s.user.created_at,
  };
}

function useEstado() {
  const qc = useQueryClient();
  const [sesion, setSesion] = useState<Session | null>(null);
  const [listo, setListo] = useState(false);
  const [activoId, setActivoId] = useState<string | null>(null);
  const [enVivo, setEnVivoState] = useState(true);
  const [presentes, setPresentes] = useState<Set<string>>(new Set());

  // Sesión + preferencias guardadas.
  useEffect(() => {
    Promise.all([
      supabase.auth.getSession().then(({ data }) => setSesion(data.session)),
      AsyncStorage.multiGet([CLAVE_ACTIVO, CLAVE_VIVO])
        .then(([[, activo], [, vivo]]) => {
          if (activo) setActivoId(activo);
          if (vivo) setEnVivoState(vivo === "1");
        })
        .catch(() => {}),
    ]).finally(() => setListo(true));

    const { data } = supabase.auth.onAuthStateChange((evento, s) => {
      setSesion(s);
      if (evento === "SIGNED_OUT") qc.clear();
    });
    return () => data.subscription.unsubscribe();
  }, [qc]);

  const usuario = useMemo(() => usuarioDeSesion(sesion), [sesion]);
  const uid = usuario?.id;

  const inventariosQ = useQuery({
    queryKey: ["inventarios", uid],
    enabled: !!uid,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("inventarios")
        .select(
          "id, nombre, lugar, creado_en, miembros(usuario_id, rol, perfiles(nombre, email)), productos(count)",
        )
        .order("creado_en");
      if (error) throw error;
      return data as unknown as FilaInventario[];
    },
  });

  const inventarios: Inventario[] = useMemo(
    () =>
      (inventariosQ.data ?? []).map((inv) => ({
        id: inv.id,
        nombre: inv.nombre,
        lugar: inv.lugar,
        creado_en: inv.creado_en,
        total_productos: inv.productos[0]?.count ?? 0,
        miembros: inv.miembros
          .map<Miembro>((m) => ({
            usuario_id: m.usuario_id,
            rol: m.rol,
            nombre: m.perfiles?.nombre ?? "—",
            email: m.perfiles?.email ?? "",
            en_linea: m.usuario_id === uid || presentes.has(m.usuario_id),
          }))
          .sort((a, b) => ORDEN_ROL[a.rol] - ORDEN_ROL[b.rol] || a.nombre.localeCompare(b.nombre)),
      })),
    [inventariosQ.data, presentes, uid],
  );

  const activo = inventarios.find((i) => i.id === activoId) ?? inventarios[0] ?? null;
  const miRol: Rol = activo?.miembros.find((m) => m.usuario_id === uid)?.rol ?? "lector";

  const productosQ = useQuery({
    queryKey: ["productos", activo?.id],
    enabled: !!activo,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("productos")
        .select("*")
        .eq("inventario_id", activo!.id);
      if (error) throw error;
      return data as Producto[];
    },
  });

  // Realtime del inventario activo.
  useEffect(() => {
    if (!activo || !uid || !enVivo) return;
    const invId = activo.id;
    const clave = ["productos", invId];
    const aplicar = (fn: (lista: Producto[]) => Producto[]) =>
      qc.setQueryData<Producto[]>(clave, (lista) => (lista ? fn(lista) : lista));
    const refrescarInventarios = () => qc.invalidateQueries({ queryKey: ["inventarios", uid] });

    const canal = supabase
      .channel(`inventario:${invId}`, { config: { presence: { key: uid } } })
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "productos",
          filter: `inventario_id=eq.${invId}`,
        },
        (p) => {
          const nuevo = p.new as Producto;
          aplicar((l) => (l.some((x) => x.id === nuevo.id) ? l : [...l, nuevo]));
          refrescarInventarios();
        },
      )
      .on(
        "postgres_changes",
        {
          event: "UPDATE",
          schema: "public",
          table: "productos",
          filter: `inventario_id=eq.${invId}`,
        },
        (p) => {
          const nuevo = p.new as Producto;
          aplicar((l) => l.map((x) => (x.id === nuevo.id ? nuevo : x)));
        },
      )
      // Los DELETE no se pueden filtrar en Realtime: se descarta lo que no sea de esta lista.
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "productos" }, (p) => {
        const id = (p.old as { id?: string }).id;
        aplicar((l) => l.filter((x) => x.id !== id));
        refrescarInventarios();
      })
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "miembros" },
        refrescarInventarios,
      )
      .on("presence", { event: "sync" }, () =>
        setPresentes(new Set(Object.keys(canal.presenceState()))),
      )
      .subscribe((estado) => {
        if (estado === "SUBSCRIBED")
          canal.track({ desde: new Date().toISOString() }).catch(() => {});
      });

    return () => {
      supabase.removeChannel(canal);
      setPresentes(new Set());
    };
  }, [activo?.id, uid, enVivo, qc]);

  const productosKey = ["productos", activo?.id];
  const reemplazarProducto = useCallback(
    (p: Producto) =>
      qc.setQueryData<Producto[]>(["productos", p.inventario_id], (l) =>
        l
          ? l.some((x) => x.id === p.id)
            ? l.map((x) => (x.id === p.id ? p : x))
            : [...l, p]
          : [p],
      ),
    [qc],
  );

  const acciones = {
    /** Devuelve true si Supabase pide confirmar el correo antes de entrar. */
    async registrar(nombre: string, email: string, clave: string) {
      const { data, error } = await supabase.auth.signUp({
        email: email.trim().toLowerCase(),
        password: clave,
        options: { data: { nombre: nombre.trim() } },
      });
      if (error) throw new Error(mensajeError(error));
      return !data.session;
    },

    async iniciarSesion(email: string, clave: string) {
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim().toLowerCase(),
        password: clave,
      });
      if (error) throw new Error(mensajeError(error));
    },

    async cerrarSesion() {
      await supabase.auth.signOut();
    },

    seleccionarInventario(invId: string) {
      setActivoId(invId);
      AsyncStorage.setItem(CLAVE_ACTIVO, invId).catch(() => {});
    },

    async crearInventario(nombre: string, lugar: string) {
      const { data, error } = await supabase
        .from("inventarios")
        .insert({ nombre: nombre.trim(), lugar: lugar.trim() })
        .select("id")
        .single();
      if (error) throw new Error(mensajeError(error));
      await qc.invalidateQueries({ queryKey: ["inventarios", uid] });
      acciones.seleccionarInventario(data.id);
    },

    async guardarProducto(productoId: string | null, input: ProductoInput) {
      const consulta = productoId
        ? supabase
            .from("productos")
            .update({ ...input, fuente: "manual" })
            .eq("id", productoId)
        : supabase
            .from("productos")
            .insert({ ...input, inventario_id: activo!.id, fuente: "manual" });
      const { data, error } = await consulta.select().single();
      if (error) throw new Error(mensajeError(error));
      reemplazarProducto(data as Producto);
      if (!productoId) qc.invalidateQueries({ queryKey: ["inventarios", uid] });
    },

    async eliminarProducto(productoId: string) {
      const { error } = await supabase.from("productos").delete().eq("id", productoId);
      if (error) throw new Error(mensajeError(error));
      qc.setQueryData<Producto[]>(productosKey, (l) => l?.filter((x) => x.id !== productoId));
      qc.invalidateQueries({ queryKey: ["inventarios", uid] });
    },

    /** Lo que hace la cámara al reconocer un producto: lo marca como visto. */
    async confirmarDeteccion(productoId: string) {
      const { data, error } = await supabase
        .from("productos")
        .update({ fuente: "camara" })
        .eq("id", productoId)
        .select()
        .single();
      if (error) throw new Error(mensajeError(error));
      reemplazarProducto(data as Producto);
    },

    async invitar(invId: string, email: string, rol: Exclude<Rol, "dueño">) {
      const { error } = await supabase.rpc("invitar_miembro", {
        inv: invId,
        correo: email,
        nuevo_rol: rol,
      });
      if (error) throw new Error(mensajeError(error));
      await qc.invalidateQueries({ queryKey: ["inventarios", uid] });
    },

    async cambiarRol(invId: string, usuarioId: string, rol: Rol) {
      const { error } = await supabase
        .from("miembros")
        .update({ rol })
        .match({ inventario_id: invId, usuario_id: usuarioId });
      if (error) throw new Error(mensajeError(error));
      await qc.invalidateQueries({ queryKey: ["inventarios", uid] });
    },

    async quitarMiembro(invId: string, usuarioId: string) {
      const { error } = await supabase
        .from("miembros")
        .delete()
        .match({ inventario_id: invId, usuario_id: usuarioId });
      if (error) throw new Error(mensajeError(error));
      await qc.invalidateQueries({ queryKey: ["inventarios", uid] });
    },

    setEnVivo(valor: boolean) {
      setEnVivoState(valor);
      AsyncStorage.setItem(CLAVE_VIVO, valor ? "1" : "0").catch(() => {});
    },

    async refrescar() {
      await Promise.all([inventariosQ.refetch(), productosQ.refetch()]);
    },
  };

  return {
    listo,
    usuario,
    inventarios,
    activo,
    miRol,
    enVivo,
    productosActivos: productosQ.data ?? [],
    cargando: inventariosQ.isLoading || (!!activo && productosQ.isLoading),
    errorCarga: inventariosQ.error ?? productosQ.error,
    refrescando: inventariosQ.isRefetching || productosQ.isRefetching,
    ...acciones,
  };
}

const ORDEN_ROL: Record<Rol, number> = { dueño: 0, editor: 1, lector: 2 };

type Store = ReturnType<typeof useEstado>;
const Contexto = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: React.ReactNode }) {
  const store = useEstado();
  return <Contexto.Provider value={store}>{children}</Contexto.Provider>;
}

export function useStore() {
  const store = useContext(Contexto);
  if (!store) throw new Error("useStore fuera de <StoreProvider>");
  return store;
}

export const puedeEditar = (rol: Rol) => rol !== "lector";
