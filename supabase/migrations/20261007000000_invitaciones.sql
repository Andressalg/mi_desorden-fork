-- Invitaciones a gente que todavía no tiene cuenta.
--
-- invitar() reemplaza a invitar_miembro() en la app:
--   - si el correo ya tiene cuenta, lo agrega como miembro (igual que antes);
--   - si no, deja una invitación pendiente.
-- Cuando esa persona se registra y CONFIRMA el correo, las pendientes se
-- convierten en accesos. Se espera a la confirmación para que nadie pueda
-- quedarse con una invitación ajena registrándose con ese correo.

-- ---------------------------------------------------------------------------
-- Tabla
-- ---------------------------------------------------------------------------

create table public.invitaciones (
  inventario_id uuid not null references public.inventarios (id) on delete cascade,
  email text not null check (email = lower(trim(email)) and email ~ '^\S+@\S+\.\S+$'),
  rol public.rol not null check (rol <> 'dueño'),
  invitado_por uuid default auth.uid() references public.perfiles (id) on delete set null,
  creado_en timestamptz not null default now(),
  primary key (inventario_id, email)
);
create index invitaciones_email_idx on public.invitaciones (email);

comment on table public.invitaciones is
  'Invitaciones pendientes a correos sin cuenta. Se vuelven miembros al confirmar el correo.';

-- Solo el dueño las ve y las cancela. Se crean únicamente con invitar().
alter table public.invitaciones enable row level security;
create policy "dueño ve invitaciones" on public.invitaciones for select to authenticated
  using (public.rol_en(inventario_id) = 'dueño');
create policy "dueño cancela invitaciones" on public.invitaciones for delete to authenticated
  using (public.rol_en(inventario_id) = 'dueño');

-- ---------------------------------------------------------------------------
-- invitar(): miembro directo o invitación pendiente. Devuelve cuál fue.
-- ---------------------------------------------------------------------------

create function public.invitar(inv uuid, correo text, nuevo_rol public.rol)
returns text
language plpgsql security definer set search_path = ''
as $$
declare
  limpio text := lower(trim(correo));
  invitado uuid;
begin
  if public.rol_en(inv) is distinct from 'dueño' then
    raise exception 'Solo el dueño puede invitar' using errcode = '42501';
  end if;
  if nuevo_rol = 'dueño' then
    raise exception 'No se puede invitar como dueño' using errcode = '22023';
  end if;
  if limpio !~ '^\S+@\S+\.\S+$' then
    raise exception 'El correo no es válido' using errcode = '22023';
  end if;

  select id into invitado from public.perfiles where email = limpio;

  if invitado is not null then
    insert into public.miembros (inventario_id, usuario_id, rol)
    values (inv, invitado, nuevo_rol)
    on conflict (inventario_id, usuario_id) do update set rol = excluded.rol
      where public.miembros.rol <> 'dueño';
    delete from public.invitaciones where inventario_id = inv and email = limpio;
    return 'miembro';
  end if;

  insert into public.invitaciones (inventario_id, email, rol, invitado_por)
  values (inv, limpio, nuevo_rol, auth.uid())
  on conflict (inventario_id, email) do update set rol = excluded.rol, creado_en = now();
  return 'pendiente';
end;
$$;

revoke execute on function public.invitar(uuid, text, public.rol) from public, anon;
grant execute on function public.invitar(uuid, text, public.rol) to authenticated;

-- ---------------------------------------------------------------------------
-- Al confirmar el correo, las invitaciones pendientes pasan a ser accesos.
-- ---------------------------------------------------------------------------

create function public.aceptar_invitaciones()
returns trigger
language plpgsql security definer set search_path = ''
as $$
begin
  if new.email_confirmed_at is null then
    return new;
  end if;

  insert into public.miembros (inventario_id, usuario_id, rol)
  select i.inventario_id, new.id, i.rol
  from public.invitaciones i
  where i.email = lower(new.email)
  on conflict (inventario_id, usuario_id) do nothing;

  delete from public.invitaciones where email = lower(new.email);
  return new;
end;
$$;

-- Postgres dispara los triggers por orden alfabético: este nombre va después de
-- al_registrarse, así el perfil ya existe cuando se agrega como miembro.
create trigger al_registrarse_y_confirmar
  after insert or update of email_confirmed_at on auth.users
  for each row execute function public.aceptar_invitaciones();

-- ---------------------------------------------------------------------------
-- Realtime: la app escucha cuando a uno lo agregan a un inventario (ya estaba
-- miembros en la publicación) y las invitaciones del dueño.
-- ---------------------------------------------------------------------------

alter table public.invitaciones replica identity full;
alter publication supabase_realtime add table public.invitaciones;
