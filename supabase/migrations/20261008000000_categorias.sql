-- Categorías por inventario, con un nivel de subcategorías (como Blupadel):
-- primero se crea la categoría y después los productos adentro.
--
-- productos.categoria (texto) queda por compatibilidad pero la app ya no lo
-- usa: lo que manda es productos.categoria_id. Las categorías de texto que ya
-- había se convierten en categorías de verdad.

-- ---------------------------------------------------------------------------
-- Tabla
-- ---------------------------------------------------------------------------

create table public.categorias (
  id uuid primary key default gen_random_uuid(),
  inventario_id uuid not null references public.inventarios (id) on delete cascade,
  -- Null = categoría principal. Si tiene padre, es subcategoría (un solo nivel).
  padre_id uuid references public.categorias (id) on delete restrict,
  nombre text not null check (char_length(trim(nombre)) between 1 and 60),
  creado_en timestamptz not null default now()
);
create index categorias_inventario_idx on public.categorias (inventario_id);
-- Sin nombres repetidos en el mismo nivel (sin importar mayúsculas).
create unique index categorias_nombre_unico on public.categorias (
  inventario_id,
  coalesce(padre_id, '00000000-0000-0000-0000-000000000000'::uuid),
  lower(trim(nombre))
);

-- Un solo nivel y siempre dentro del mismo inventario.
create function public.validar_categoria()
returns trigger
language plpgsql set search_path = ''
as $$
declare
  padre public.categorias;
begin
  if new.padre_id is null then
    return new;
  end if;
  select * into padre from public.categorias where id = new.padre_id;
  if padre.inventario_id is distinct from new.inventario_id then
    raise exception 'La categoría padre es de otro inventario' using errcode = '22023';
  end if;
  if padre.padre_id is not null then
    raise exception 'Solo se puede crear un nivel de subcategorías' using errcode = '22023';
  end if;
  if new.id = new.padre_id then
    raise exception 'Una categoría no puede estar dentro de sí misma' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger al_guardar_categoria
  before insert or update on public.categorias
  for each row execute function public.validar_categoria();

alter table public.categorias enable row level security;
create policy "ver categorias" on public.categorias for select to authenticated
  using (public.es_miembro(inventario_id));
create policy "crear categorias" on public.categorias for insert to authenticated
  with check (public.rol_en(inventario_id) in ('dueño', 'editor'));
create policy "editar categorias" on public.categorias for update to authenticated
  using (public.rol_en(inventario_id) in ('dueño', 'editor'))
  with check (public.rol_en(inventario_id) in ('dueño', 'editor'));
create policy "borrar categorias" on public.categorias for delete to authenticated
  using (public.rol_en(inventario_id) in ('dueño', 'editor'));

-- ---------------------------------------------------------------------------
-- Productos → categoría
-- ---------------------------------------------------------------------------

-- restrict: no se puede borrar una categoría que todavía tiene productos.
alter table public.productos
  add column categoria_id uuid references public.categorias (id) on delete restrict;
create index productos_categoria_idx on public.productos (categoria_id);

-- La categoría tiene que ser del mismo inventario que el producto.
create function public.validar_categoria_producto()
returns trigger
language plpgsql set search_path = ''
as $$
begin
  if new.categoria_id is not null and not exists (
    select 1 from public.categorias
    where id = new.categoria_id and inventario_id = new.inventario_id
  ) then
    raise exception 'La categoría es de otro inventario' using errcode = '22023';
  end if;
  return new;
end;
$$;

create trigger al_guardar_producto_categoria
  before insert or update of categoria_id, inventario_id on public.productos
  for each row execute function public.validar_categoria_producto();

-- Las categorías de texto que ya había pasan a ser categorías principales.
insert into public.categorias (inventario_id, nombre)
select distinct on (inventario_id, lower(trim(categoria))) inventario_id, trim(categoria)
from public.productos
where trim(categoria) <> ''
order by inventario_id, lower(trim(categoria)), trim(categoria)
on conflict do nothing;

update public.productos p
set categoria_id = c.id
from public.categorias c
where c.inventario_id = p.inventario_id
  and c.padre_id is null
  and lower(trim(c.nombre)) = lower(trim(p.categoria));

-- ---------------------------------------------------------------------------
-- Realtime
-- ---------------------------------------------------------------------------

alter table public.categorias replica identity full;
alter publication supabase_realtime add table public.categorias;
