create or replace function public.current_role()
returns text
language sql
stable
as $$
  select coalesce((select role from public.profiles where id = auth.uid()), 'socio')
$$;

create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select public.current_role() = 'admin'
$$;

alter table public.profiles enable row level security;
alter table public.categories enable row level security;
alter table public.books enable row level security;
alter table public.cart_items enable row level security;
alter table public.ordenes enable row level security;
alter table public.orden_detalles enable row level security;
alter table public.pagos enable row level security;
alter table public.logs_inventario enable row level security;
alter table public.sucursales_biblioteca enable row level security;
alter table public.despachos enable row level security;
alter table public.contact_messages enable row level security;
alter table public.notifications enable row level security;
alter table public.reviews enable row level security;

create policy "profiles_select_own"
on public.profiles for select
to authenticated
using (id = auth.uid());

create policy "profiles_update_own"
on public.profiles for update
to authenticated
using (id = auth.uid())
with check (id = auth.uid());

create policy "categories_select_public"
on public.categories for select
to anon, authenticated
using (true);

create policy "categories_write_admin"
on public.categories for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "books_select_public"
on public.books for select
to anon, authenticated
using (true);

create policy "books_write_admin"
on public.books for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "cart_select_own"
on public.cart_items for select
to authenticated
using (usuario_id = auth.uid());

create policy "cart_insert_own"
on public.cart_items for insert
to authenticated
with check (usuario_id = auth.uid());

create policy "cart_update_own"
on public.cart_items for update
to authenticated
using (usuario_id = auth.uid())
with check (usuario_id = auth.uid());

create policy "cart_delete_own"
on public.cart_items for delete
to authenticated
using (usuario_id = auth.uid());

create policy "ordenes_select_owner_or_admin"
on public.ordenes for select
to authenticated
using (usuario_id = auth.uid() or public.is_admin());

create policy "ordenes_insert_own"
on public.ordenes for insert
to authenticated
with check (usuario_id = auth.uid());

create policy "ordenes_update_admin"
on public.ordenes for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "orden_detalles_select_owner_or_admin"
on public.orden_detalles for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.ordenes o
    where o.id = orden_detalles.orden_id and o.usuario_id = auth.uid()
  )
);

create policy "orden_detalles_insert_owner"
on public.orden_detalles for insert
to authenticated
with check (
  exists (
    select 1 from public.ordenes o
    where o.id = orden_detalles.orden_id and o.usuario_id = auth.uid()
  )
);

create policy "pagos_select_owner_or_admin"
on public.pagos for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.ordenes o
    where o.id = pagos.orden_id and o.usuario_id = auth.uid()
  )
);

create policy "pagos_insert_owner"
on public.pagos for insert
to authenticated
with check (
  exists (
    select 1 from public.ordenes o
    where o.id = pagos.orden_id and o.usuario_id = auth.uid()
  )
);

create policy "pagos_update_admin"
on public.pagos for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "logs_inventario_admin_only"
on public.logs_inventario for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "sucursales_select_public"
on public.sucursales_biblioteca for select
to anon, authenticated
using (true);

create policy "sucursales_write_admin"
on public.sucursales_biblioteca for all
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "despachos_select_owner_or_admin"
on public.despachos for select
to authenticated
using (
  public.is_admin()
  or exists (
    select 1 from public.ordenes o
    where o.id = despachos.orden_id and o.usuario_id = auth.uid()
  )
);

create policy "despachos_insert_admin"
on public.despachos for insert
to authenticated
with check (public.is_admin());

create policy "despachos_update_admin"
on public.despachos for update
to authenticated
using (public.is_admin())
with check (public.is_admin());

create policy "contact_messages_admin_select"
on public.contact_messages for select
to authenticated
using (public.is_admin());

create policy "contact_messages_insert_public"
on public.contact_messages for insert
to anon, authenticated
with check (true);

create policy "notifications_admin_select"
on public.notifications for select
to authenticated
using (public.is_admin());

create policy "reviews_select_public_approved"
on public.reviews for select
to anon, authenticated
using (estado = 'approved');

create policy "reviews_insert_own"
on public.reviews for insert
to authenticated
with check (usuario_id = auth.uid());

create policy "reviews_update_own"
on public.reviews for update
to authenticated
using (usuario_id = auth.uid() or public.is_admin())
with check (usuario_id = auth.uid() or public.is_admin());

create policy "reviews_delete_own"
on public.reviews for delete
to authenticated
using (usuario_id = auth.uid() or public.is_admin());
