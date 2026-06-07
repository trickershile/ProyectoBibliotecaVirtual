create or replace function public.book_has_digital(book_id bigint)
returns boolean
language sql
stable
as $$
  select exists(
    select 1
    from public.books b
    where b.id = book_id
      and coalesce(b.url_libro_completo, '') <> ''
  )
$$;
