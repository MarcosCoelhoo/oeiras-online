// Testa supabase/schema.sql num Postgres real (PGlite), simulando os papéis do Supabase (anon/authenticated).
import { PGlite } from "@electric-sql/pglite";
import fs from "fs";

const db = new PGlite();
const ADMIN = "11111111-1111-1111-1111-111111111111";
const COMUM = "22222222-2222-2222-2222-222222222222";

// Ambiente mínimo equivalente ao do Supabase
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text);
  create function auth.uid() returns uuid language sql stable as
    $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated;
  grant execute on function auth.uid() to anon, authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text);
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated;
  grant all on storage.objects to anon, authenticated;
  grant usage on schema public to anon, authenticated;
  insert into auth.users values ('${ADMIN}', 'admin@teste.local'), ('${COMUM}', 'comum@teste.local');
`);

const schema = fs.readFileSync(new URL("../supabase/schema.sql", import.meta.url), "utf8");
await db.exec(schema);
await db.exec(schema); // idempotente: roda duas vezes sem erro
await db.exec(fs.readFileSync(new URL("../supabase/seed-exemplos.sql", import.meta.url), "utf8"));
await db.exec(`insert into public.admins (user_id, nome) values ('${ADMIN}', 'Admin de teste');`);

let ok = 0, falhas = 0;
const como = async (papel, uid, sql, params = []) => {
  await db.exec(`reset role; select set_config('request.jwt.claim.sub', '${uid || ""}', false);`);
  if (papel !== "postgres") await db.exec(`set role ${papel};`);
  try { return { rows: (await db.query(sql, params)).rows }; }
  catch (e) { return { error: e.message }; }
  finally { await db.exec("reset role;"); }
};
const espera = (nome, cond, detalhe) => {
  if (cond) { ok++; console.log("  ✔ " + nome); } else { falhas++; console.log("  ✘ " + nome, detalhe ?? ""); }
};
const CONTEUDO = "<p>" + "Texto completo da matéria de teste com mais de cem caracteres para passar na validação do banco. ".repeat(2) + "</p>";
const completa = (slug, extra = "") => `insert into public.noticias (slug, titulo, resumo, conteudo, categoria, autor, imagem_url, status${extra ? ", publicado_em" : ""})
  values ('${slug}', 'Notícia de teste completa', 'Resumo da notícia de teste com tamanho suficiente', '${CONTEUDO}', 'turismo', 'Redação', 'https://exemplo/img.webp', 'publicado'${extra ? ", " + extra : ""}) returning id`;

console.log("Visitante (anon)");
let r = await como("anon", null, "select count(*)::int n from public.noticias");
espera("não vê os 12 rascunhos importados", r.rows?.[0].n === 0, r);
r = await como("anon", null, completa("anon-tenta"));
espera("não consegue criar notícia", !!r.error, r);
r = await como("anon", null, "select public.is_admin() a");
espera("is_admin() = false", r.rows?.[0].a === false, r);
r = await como("anon", null, "insert into storage.objects (bucket_id, name) values ('noticias', 'capas/x.jpg')");
espera("não consegue enviar imagem", !!r.error, r);

console.log("Usuário autenticado que NÃO é administrador");
r = await como("authenticated", COMUM, completa("comum-tenta"));
espera("não consegue criar notícia", !!r.error, r);
r = await como("authenticated", COMUM, "select count(*)::int n from public.noticias");
espera("não vê rascunhos", r.rows?.[0].n === 0, r);
r = await como("authenticated", COMUM, `insert into public.admins (user_id) values ('${COMUM}')`);
espera("não consegue se promover a administrador", !!r.error, r);
r = await como("authenticated", COMUM, "update public.noticias set status = 'publicado'");
espera("update não afeta nenhuma linha", r.rows?.length === 0 || !!r.error, r);

console.log("Administrador");
r = await como("authenticated", ADMIN, "select public.is_admin() a");
espera("is_admin() = true", r.rows?.[0].a === true, r);
r = await como("authenticated", ADMIN, "select count(*)::int n from public.noticias");
espera("vê os 12 rascunhos importados", r.rows?.[0].n === 12, r);
r = await como("authenticated", ADMIN, `insert into public.noticias (slug, titulo, categoria, autor) values ('rascunho-teste', 'Rascunho só com título', 'gastronomia', 'Redação') returning id, status, criado_por`);
espera("salva rascunho incompleto", r.rows?.[0].status === "rascunho", r);
espera("criado_por = admin", r.rows?.[0].criado_por === ADMIN, r);
const idRasc = r.rows?.[0].id;
r = await como("authenticated", ADMIN, `update public.noticias set status = 'publicado' where id = $1`, [idRasc]);
espera("banco recusa publicar notícia incompleta", /noticias_publicacao_completa/.test(r.error || ""), r);
r = await como("authenticated", ADMIN, `insert into public.noticias (slug, titulo, categoria, autor) values ('cat-invalida', 'Categoria que não existe', 'opiniao', 'Redação')`);
espera("banco recusa categoria inexistente (ex.: opinião)", /noticias_categoria_valida/.test(r.error || ""), r);
r = await como("authenticated", ADMIN, `insert into public.noticias (slug, titulo, categoria, autor) values ('curto', 'Curto', 'cidade', 'Redação')`);
espera("banco recusa título curto demais", /noticias_titulo_valido/.test(r.error || ""), r);
r = await como("authenticated", ADMIN, completa("publicada-teste"));
espera("publica notícia completa", !!r.rows?.[0]?.id, r);
const idPub = r.rows?.[0]?.id;
r = await como("authenticated", ADMIN, completa("agendada-teste", "now() + interval '2 days'"));
espera("agenda notícia para o futuro", !!r.rows?.[0]?.id, r);
const idAg = r.rows?.[0]?.id;
for (const cat of ["festival-do-camarao", "assistencia-social", "gastronomia", "turismo"]) {
  r = await como("authenticated", ADMIN, `insert into public.noticias (slug, titulo, categoria, autor) values ('nova-${cat}', 'Teste da nova categoria', '${cat}', 'Redação') returning id`);
  espera(`aceita a nova categoria ${cat}`, !!r.rows?.[0]?.id, r);
}

console.log("Visitante depois das publicações");
r = await como("anon", null, "select slug from public.noticias order by slug");
espera("vê só a publicada (nem rascunhos, nem agendada)", JSON.stringify(r.rows?.map((x) => x.slug)) === '["publicada-teste"]', r);
r = await como("anon", null, "update public.noticias set titulo = 'Hackeado pelo visitante' where id = $1", [idPub]);
espera("não consegue editar", !!r.error || r.rows?.length === 0, r);
r = await como("postgres", null, "select titulo, atualizado_em from public.noticias where id = $1", [idPub]);
const antes = r.rows[0];
espera("título continua intacto", antes.titulo === "Notícia de teste completa", r);
await como("anon", null, "select public.registrar_visualizacao($1)", [idPub]);
await como("anon", null, "select public.registrar_visualizacao($1)", [idPub]);
await como("anon", null, "select public.registrar_visualizacao($1)", [idAg]);
r = await como("postgres", null, "select id, visualizacoes, atualizado_em from public.noticias where id in ($1, $2)", [idPub, idAg]);
const pub = r.rows.find((x) => x.id === idPub), ag = r.rows.find((x) => x.id === idAg);
espera("contador de visualizações soma 2 na publicada", pub.visualizacoes === 2, r);
espera("contador não altera notícia agendada", ag.visualizacoes === 0, r);
espera("visualização não muda atualizado_em", +pub.atualizado_em === +antes.atualizado_em, r);

console.log("Despublicar e excluir");
r = await como("authenticated", ADMIN, "update public.noticias set status = 'rascunho' where id = $1 returning status, atualizado_em", [idPub]);
espera("admin despublica", r.rows?.[0].status === "rascunho", r);
r = await como("anon", null, "select count(*)::int n from public.noticias");
espera("visitante deixa de ver a despublicada", r.rows?.[0].n === 0, r);
r = await como("anon", null, "delete from public.noticias where id = $1 returning id", [idRasc]);
espera("visitante não exclui", !!r.error || r.rows?.length === 0, r);
r = await como("authenticated", COMUM, "delete from public.noticias where id = $1 returning id", [idRasc]);
espera("usuário comum não exclui", !!r.error || r.rows?.length === 0, r);
r = await como("authenticated", ADMIN, "delete from public.noticias where id = $1 returning id", [idRasc]);
espera("admin exclui", r.rows?.length === 1, r);

console.log("Imagens (storage)");
r = await como("authenticated", COMUM, "insert into storage.objects (bucket_id, name) values ('noticias', 'capas/y.jpg')");
espera("usuário comum não envia", !!r.error, r);
r = await como("authenticated", ADMIN, "insert into storage.objects (bucket_id, name) values ('noticias', 'capas/z.jpg') returning name");
espera("admin envia", r.rows?.[0]?.name === "capas/z.jpg", r);
r = await como("authenticated", ADMIN, "insert into storage.objects (bucket_id, name) values ('outro-bucket', 'a.jpg')");
espera("admin não grava em outro bucket", !!r.error, r);
r = await como("postgres", null, "select public, file_size_limit, allowed_mime_types from storage.buckets where id = 'noticias'");
espera("bucket público com limite de 5 MB", r.rows?.[0].public === true && Number(r.rows[0].file_size_limit) === 5242880, r);

console.log("Pautas dos leitores");
r = await como("anon", null, "insert into public.pautas (nome, mensagem, contato) values ('Leitor', 'Buraco enorme na rua principal do bairro', '9199999-0000')");
espera("visitante envia pauta", !r.error, r);
r = await como("anon", null, "select count(*)::int n from public.pautas");
espera("visitante não lê pautas (nem a própria)", !!r.error || r.rows?.[0].n === 0, r);
r = await como("anon", null, "insert into public.pautas (nome, mensagem, lida) values ('Leitor', 'Tentando marcar como lida já na criação', true)");
espera("visitante não define campo 'lida'", !!r.error, r);
r = await como("anon", null, "insert into public.pautas (nome, mensagem, criado_em) values ('Leitor', 'Tentando forjar a data de envio da pauta', '2000-01-01')");
espera("visitante não forja a data", !!r.error, r);
r = await como("anon", null, "insert into public.pautas (nome, mensagem) values ('L', 'curta')");
espera("banco recusa pauta incompleta", /pautas_campos_validos/.test(r.error || ""), r);
r = await como("authenticated", COMUM, "select count(*)::int n from public.pautas");
espera("usuário comum não lê pautas", !!r.error || r.rows?.[0].n === 0, r);
r = await como("authenticated", ADMIN, "update public.pautas set lida = true returning lida");
espera("admin lê e marca como lida", r.rows?.length === 1 && r.rows[0].lida === true, r);
r = await como("anon", null, "delete from public.pautas returning id");
espera("visitante não exclui pautas", !!r.error || r.rows?.length === 0, r);
r = await como("authenticated", ADMIN, "delete from public.pautas returning id");
espera("admin exclui pauta", r.rows?.length === 1, r);

console.log(`\n${ok} testes passaram, ${falhas} falharam.`);
process.exit(falhas ? 1 : 0);
