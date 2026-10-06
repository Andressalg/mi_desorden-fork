-- Una foto por producto, guardada en Supabase Storage.
--
-- Ruta del archivo: productos/<inventario_id>/<producto_id>.jpg
-- La primera carpeta es el inventario: con eso las políticas de Storage
-- reusan los mismos permisos que la tabla productos (ver los helpers).
--
-- Los roles NO necesitan tabla propia: siguen siendo el tipo public.rol
-- (dueño, editor, lector) en public.miembros.

-- ---------------------------------------------------------------------------
-- Columna
-- ---------------------------------------------------------------------------

alter table public.productos
  add column foto_path text check (foto_path is null or foto_path ~ '^[0-9a-f-]{36}/[0-9a-f-]{36}\.jpg$');

comment on column public.productos.foto_path is
  'Ruta en el bucket "productos": <inventario_id>/<producto_id>.jpg. Null si no tiene foto.';

-- ---------------------------------------------------------------------------
-- Bucket privado (las fotos se ven con URLs firmadas, nunca públicas)
-- ---------------------------------------------------------------------------

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('productos', 'productos', false, 5 * 1024 * 1024, array['image/jpeg'])
on conflict (id) do update
  set public = excluded.public,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- Helpers: permisos sobre la carpeta (= inventario) de un archivo
-- ---------------------------------------------------------------------------

create function public.puede_ver_carpeta(ruta text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.miembros
    where inventario_id::text = split_part(ruta, '/', 1) and usuario_id = auth.uid()
  )
$$;

create function public.puede_editar_carpeta(ruta text)
returns boolean
language sql stable security definer set search_path = ''
as $$
  select exists (
    select 1 from public.miembros
    where inventario_id::text = split_part(ruta, '/', 1)
      and usuario_id = auth.uid()
      and rol in ('dueño', 'editor')
  )
$$;

revoke execute on function public.puede_ver_carpeta(text) from public, anon;
revoke execute on function public.puede_editar_carpeta(text) from public, anon;
grant execute on function public.puede_ver_carpeta(text) to authenticated;
grant execute on function public.puede_editar_carpeta(text) to authenticated;

-- ---------------------------------------------------------------------------
-- Políticas de Storage: miembros ven, dueño y editores suben/cambian/borran
-- ---------------------------------------------------------------------------

create policy "productos: ver fotos de mis inventarios" on storage.objects for select to authenticated
  using (bucket_id = 'productos' and public.puede_ver_carpeta(name));

create policy "productos: subir fotos" on storage.objects for insert to authenticated
  with check (bucket_id = 'productos' and public.puede_editar_carpeta(name));

create policy "productos: reemplazar fotos" on storage.objects for update to authenticated
  using (bucket_id = 'productos' and public.puede_editar_carpeta(name))
  with check (bucket_id = 'productos' and public.puede_editar_carpeta(name));

create policy "productos: borrar fotos" on storage.objects for delete to authenticated
  using (bucket_id = 'productos' and public.puede_editar_carpeta(name));
