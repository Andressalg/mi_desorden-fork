import type { Usuario } from "@mi-desorden/core";
import type { Session } from "@supabase/supabase-js";
import * as Linking from "expo-linking";
import { mensajeError, siFalla } from "./errores";
import { supabase } from "./supabase";

const normalizar = (email: string) => email.trim().toLowerCase();

/**
 * A dónde vuelve el enlace del correo de confirmación. En el development build
 * es `midesorden://callback`; en Expo Go, `exp://<ip>:8081/--/callback`.
 * Tiene que estar en Supabase → Authentication → URL Configuration → Redirect URLs.
 */
export const urlRetorno = () => Linking.createURL("callback");

function aUsuario(s: Session | null): Usuario | null {
  if (!s) return null;
  const email = s.user.email ?? "";
  return {
    id: s.user.id,
    email,
    nombre: (s.user.user_metadata?.nombre as string | undefined) || email.split("@")[0] || "Yo",
    creado_en: s.user.created_at,
  };
}

export const auth = {
  async usuarioActual(): Promise<Usuario | null> {
    const { data } = await supabase.auth.getSession();
    return aUsuario(data.session);
  },

  /** Access token para la API de Nest (lo usa http.ts). */
  async token(): Promise<string | undefined> {
    const { data } = await supabase.auth.getSession();
    return data.session?.access_token;
  },

  /** Avisa cada vez que cambia la sesión. Devuelve la función para dejar de escuchar. */
  alCambiar(fn: (usuario: Usuario | null, cerro: boolean) => void) {
    const { data } = supabase.auth.onAuthStateChange((evento, s) =>
      fn(aUsuario(s), evento === "SIGNED_OUT"),
    );
    return () => data.subscription.unsubscribe();
  },

  /** Devuelve true si Supabase pide confirmar el correo antes de entrar. */
  async registrar(nombre: string, email: string, clave: string) {
    const { data, error } = await supabase.auth.signUp({
      email: normalizar(email),
      password: clave,
      options: { data: { nombre: nombre.trim() }, emailRedirectTo: urlRetorno() },
    });
    siFalla(error);
    return !data.session;
  },

  /** Vuelve a mandar el correo de confirmación (Supabase limita a uno por minuto). */
  async reenviarConfirmacion(email: string) {
    const { error } = await supabase.auth.resend({
      type: "signup",
      email: normalizar(email),
      options: { emailRedirectTo: urlRetorno() },
    });
    siFalla(error);
  },

  /** Confirma la cuenta con el código de 6 dígitos del correo e inicia la sesión. */
  async confirmarConCodigo(email: string, codigo: string) {
    const { error } = await supabase.auth.verifyOtp({
      email: normalizar(email),
      token: codigo.replace(/\D/g, ""),
      type: "email",
    });
    siFalla(error);
  },

  /**
   * El enlace del correo volvió a la app (midesorden://callback?code=…): canjea
   * el código PKCE por la sesión. Si Supabase mandó un error, lo tira.
   */
  async completarDesdeEnlace(params: { code?: string; error_description?: string }) {
    if (params.error_description) {
      throw new Error(mensajeError(params.error_description.replace(/\+/g, " ")));
    }
    if (!params.code) throw new Error("El enlace no trae el código de confirmación.");
    const { error } = await supabase.auth.exchangeCodeForSession(params.code);
    siFalla(error);
  },

  async iniciarSesion(email: string, clave: string) {
    const { error } = await supabase.auth.signInWithPassword({
      email: normalizar(email),
      password: clave,
    });
    siFalla(error);
  },

  async cerrarSesion() {
    await supabase.auth.signOut();
  },
};
