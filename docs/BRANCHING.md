# Arquitectura de ramas

**Documentación:** [Índice](README.md)

| Rama | Uso |
|------|-----|
| **develop** | Integración diaria. Rama por defecto del repo. |
| **staging** | Pre-producción / QA. Se valida antes de producción. |
| **production** | Producción. Solo código liberado. |

**Nota:** la rama de producción se llama `production` (no se usa `main`).

## Flujo

1. **Desarrollo:** ramas desde `develop` (`feature/xxx`, `fix/xxx`). Merge a `develop` vía PR.
2. **Pre-release:** cuando `develop` está estable, merge de `develop` → `staging`.
3. **Release:** validado staging, merge de `staging` → `production`.

```
develop ──(PR)──> staging ──(PR)──> production
   ^
   └── feature/*, fix/* (merge a develop)
```

## Configuración en GitHub

- **Rama por defecto:** `develop`.
- **Producción:** `production`.
- Cada rama principal dispara su workflow: `develop.yml`, `staging.yml`, `production.yml`.
