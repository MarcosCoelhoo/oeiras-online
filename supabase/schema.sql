-- =====================================================================
-- Oeiras Online — banco de dados do portal (Supabase / PostgreSQL)
-- Execute este arquivo inteiro no Supabase: SQL Editor → New query → Run.
-- Pode ser executado mais de uma vez (é idempotente).
-- =====================================================================

-- ---------- Administradores ----------
-- Somente usuários listados aqui podem usar o painel /admin.
-- Para cadastrar um administrador, veja ADMIN-SETUP.md (passo 4).
create table if not exists public.admins (
  user_id    uuid primary key references auth.users (id) on delete cascade,
  nome       text,
  criado_em  timestamptz not null default now()
);
alter table public.admins enable row level security;

drop policy if exists "admin vê o próprio cadastro" on public.admins;
create policy "admin vê o próprio cadastro" on public.admins
  for select to authenticated using (user_id = auth.uid());
-- Sem políticas de insert/update/delete: administradores só são criados pelo SQL Editor.

create or replace function public.is_admin()
returns boolean
language sql stable security definer
set search_path = public
as $$
  select exists (select 1 from public.admins where user_id = auth.uid());
$$;
revoke all on function public.is_admin() from public;
grant execute on function public.is_admin() to anon, authenticated;

-- ---------- Notícias ----------
create table if not exists public.noticias (
  id              uuid primary key default gen_random_uuid(),
  slug            text not null unique,
  titulo          text not null,
  subtitulo       text,
  resumo          text not null default '',
  conteudo        text not null default '',
  categoria       text not null,
  autor           text not null,
  imagem_url      text,
  imagem_path     text,
  imagem_legenda  text,
  status          text not null default 'rascunho',
  destaque        boolean not null default false,
  publicado_em    timestamptz not null default now(),
  visualizacoes   integer not null default 0,
  criado_em       timestamptz not null default now(),
  atualizado_em   timestamptz not null default now(),
  criado_por      uuid references auth.users (id) on delete set null default auth.uid()
);

-- Regras de integridade (valem para o painel e para qualquer acesso direto à API)
alter table public.noticias drop constraint if exists noticias_status_valido;
alter table public.noticias add constraint noticias_status_valido check (status in ('rascunho', 'publicado'));

alter table public.noticias drop constraint if exists noticias_titulo_valido;
alter table public.noticias add constraint noticias_titulo_valido check (char_length(btrim(titulo)) between 10 and 200);

alter table public.noticias drop constraint if exists noticias_slug_valido;
alter table public.noticias add constraint noticias_slug_valido check (slug ~ '^[a-z0-9]+(-[a-z0-9]+)*$');

-- Mesma lista de assets/data.js (OO.categorias). Ao criar uma categoria nova, atualize os dois.
alter table public.noticias drop constraint if exists noticias_categoria_valida;
alter table public.noticias add constraint noticias_categoria_valida check (categoria in (
  'cidade', 'politica', 'policia', 'saude', 'educacao', 'assistencia-social', 'esportes', 'cultura',
  'festival-do-camarao', 'gastronomia', 'turismo', 'interior', 'videos', 'servicos'
));

-- Uma notícia só pode ser publicada se estiver completa
alter table public.noticias drop constraint if exists noticias_publicacao_completa;
alter table public.noticias add constraint noticias_publicacao_completa check (
  status <> 'publicado' or (
    char_length(btrim(resumo)) >= 20
    and char_length(btrim(regexp_replace(conteudo, '<[^>]*>', '', 'g'))) >= 100
    and imagem_url is not null
    and char_length(btrim(autor)) > 0
  )
);

create index if not exists noticias_publicadas_idx on public.noticias (status, publicado_em desc);
create index if not exists noticias_categoria_idx on public.noticias (categoria, publicado_em desc);
create index if not exists noticias_imagem_idx on public.noticias (imagem_path);

-- atualizado_em automático (não muda quando só a contagem de visualizações aumenta)
create or replace function public.noticias_atualizado_em()
returns trigger language plpgsql as $$
begin
  if (to_jsonb(new) - 'visualizacoes' - 'atualizado_em') is distinct from (to_jsonb(old) - 'visualizacoes' - 'atualizado_em') then
    new.atualizado_em := now();
  end if;
  return new;
end $$;
drop trigger if exists noticias_atualizado_em on public.noticias;
create trigger noticias_atualizado_em before update on public.noticias
  for each row execute function public.noticias_atualizado_em();

-- ---------- Segurança (RLS) ----------
alter table public.noticias enable row level security;

-- Visitantes (e qualquer usuário) só enxergam notícias publicadas cuja data já chegou
drop policy if exists "público lê notícias publicadas" on public.noticias;
create policy "público lê notícias publicadas" on public.noticias
  for select to anon, authenticated
  using (status = 'publicado' and publicado_em <= now());

-- Administradores enxergam e gerenciam tudo (inclusive rascunhos e agendadas)
drop policy if exists "admin lê tudo" on public.noticias;
create policy "admin lê tudo" on public.noticias
  for select to authenticated using (public.is_admin());

drop policy if exists "admin cria" on public.noticias;
create policy "admin cria" on public.noticias
  for insert to authenticated with check (public.is_admin());

drop policy if exists "admin edita" on public.noticias;
create policy "admin edita" on public.noticias
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admin exclui" on public.noticias;
create policy "admin exclui" on public.noticias
  for delete to authenticated using (public.is_admin());

-- Permissões explícitas da API (o RLS acima continua decidindo quais linhas cada um acessa)
revoke all on public.noticias from anon, authenticated;
grant select on public.noticias to anon, authenticated;
grant insert, update, delete on public.noticias to authenticated;
revoke all on public.admins from anon, authenticated;
grant select on public.admins to authenticated;

-- ---------- Contador de visualizações ("Mais lidas") ----------
-- Visitantes não podem editar notícias; esta função incrementa somente o contador de uma notícia publicada.
create or replace function public.registrar_visualizacao(p_id uuid)
returns void
language sql security definer
set search_path = public
as $$
  update public.noticias
     set visualizacoes = visualizacoes + 1
   where id = p_id and status = 'publicado' and publicado_em <= now();
$$;
revoke all on function public.registrar_visualizacao(uuid) from public;
grant execute on function public.registrar_visualizacao(uuid) to anon, authenticated;

-- ---------- Imagens (Supabase Storage) ----------
-- Bucket público para leitura (as imagens aparecem no site); envio e exclusão só para administradores.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('noticias', 'noticias', true, 5242880, array['image/jpeg', 'image/png', 'image/webp', 'image/gif'])
on conflict (id) do update
  set public = excluded.public, file_size_limit = excluded.file_size_limit, allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists "admin lista imagens" on storage.objects;
create policy "admin lista imagens" on storage.objects
  for select to authenticated using (bucket_id = 'noticias' and public.is_admin());

drop policy if exists "admin envia imagens" on storage.objects;
create policy "admin envia imagens" on storage.objects
  for insert to authenticated with check (bucket_id = 'noticias' and public.is_admin());

drop policy if exists "admin atualiza imagens" on storage.objects;
create policy "admin atualiza imagens" on storage.objects
  for update to authenticated using (bucket_id = 'noticias' and public.is_admin()) with check (bucket_id = 'noticias' and public.is_admin());

drop policy if exists "admin exclui imagens" on storage.objects;
create policy "admin exclui imagens" on storage.objects
  for delete to authenticated using (bucket_id = 'noticias' and public.is_admin());
