alter table public.books
add column if not exists search_vector tsvector
generated always as (
  setweight(to_tsvector('spanish', coalesce(titulo, '')), 'A') ||
  setweight(to_tsvector('spanish', coalesce(autor, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(isbn, '')), 'C') ||
  setweight(to_tsvector('spanish', coalesce(sinopsis, '')), 'D')
) stored;

create index if not exists books_search_vector_gin
on public.books
using gin (search_vector);

create or replace function public.search_books(q text, limit_n int default 20, offset_n int default 0)
returns setof public.books
language sql
stable
as $$
  select *
  from public.books
  where search_vector @@ websearch_to_tsquery('spanish', q)
  order by ts_rank(search_vector, websearch_to_tsquery('spanish', q)) desc
  limit limit_n
  offset offset_n
$$;
