# Supabase

Proyecto: `mi_desorden` (https://eotdzgsisxfqyqbxwqna.supabase.co).

## Aplicar las migraciones

Sin CLI: abrí **SQL Editor** en el dashboard, pegá cada archivo de `migrations/` en orden y ejecutalo.

Con CLI:

```bash
brew install supabase/tap/supabase
supabase link --project-ref eotdzgsisxfqyqbxwqna
supabase db push
```

## Qué crea

| Tabla | Para qué |
|-------|----------|
| `perfiles` | Nombre y correo de cada cuenta. Se crea sola al registrarse |
| `inventarios` | Cada inventario. Quien lo crea queda como dueño |
| `miembros` | Quién tiene acceso a qué inventario y con qué rol (`dueño`, `editor`, `lector`) |
| `productos` | Stock, estante y color de LED de cada producto |

RLS: cada usuario ve solo los inventarios donde es miembro; editan dueño y editores; solo el dueño invita (`invitar_miembro`) y cambia roles. `productos` y `miembros` están en la publicación de Realtime.

## Auth

La app confirma el correo de dos formas (`apps/client/app/(auth)/confirmar.tsx` y `callback.tsx`):

1. **Enlace** → vuelve a la app en `midesorden://callback?code=…` (flujo PKCE) y se canjea por la sesión.
2. **Código de 6 dígitos** → se escribe en la app; sirve si el correo se abre en otro dispositivo.

Configuración en el dashboard:

- **Authentication → URL Configuration → Redirect URLs**: agregar `midesorden://**` (development build y app instalada) y `exp://**` (Expo Go). Sin esto, Supabase manda el enlace a la Site URL y no vuelve a la app.
- **Authentication → Emails → Confirm signup**: que la plantilla incluya el código, por ejemplo:

  ```html
  <h2>Confirmá tu cuenta en mi_desorden</h2>
  <p>Tu código: <strong>{{ .Token }}</strong></p>
  <p>O tocá el enlace desde el teléfono: <a href="{{ .ConfirmationURL }}">Confirmar cuenta</a></p>
  ```

- **Confirm email** puede quedar prendido: la app maneja el "revisá tu correo", el reenvío (1 por minuto) y el login de una cuenta sin confirmar.
