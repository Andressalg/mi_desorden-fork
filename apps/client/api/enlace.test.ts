/// <reference types="bun" />
import { describe, expect, it } from "bun:test";
import { leerEnlace } from "./enlace";

describe("leerEnlace", () => {
  it("lee la sesión del fragmento (flujo implícito)", () => {
    const d = leerEnlace(
      "midesorden://callback#access_token=abc&refresh_token=def&type=signup&expires_in=3600",
    );
    expect(d).toMatchObject({ access_token: "abc", refresh_token: "def", type: "signup" });
  });

  it("lee el code de la query (PKCE)", () => {
    expect(leerEnlace("midesorden://callback?code=123-456").code).toBe("123-456");
  });

  it("lee el error y decodifica espacios", () => {
    const d = leerEnlace(
      "midesorden://callback#error=access_denied&error_code=otp_expired&error_description=Email+link+is+invalid+or+has+expired",
    );
    expect(d.error_code).toBe("otp_expired");
    expect(d.error_description).toBe("Email link is invalid or has expired");
  });

  it("junta query y fragmento", () => {
    expect(leerEnlace("exp://192.168.1.5:8081/--/callback?x=1#access_token=a")).toMatchObject({
      x: "1",
      access_token: "a",
    });
  });

  it("sin datos devuelve vacío", () => {
    expect(leerEnlace("midesorden://callback")).toEqual({});
  });
});
