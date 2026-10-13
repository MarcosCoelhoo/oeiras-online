// Emulador LOCAL do Supabase, somente para testes (não vai para o site).
// Implementa o subconjunto da API usado pelo portal e pelo painel (Auth, PostgREST e Storage),
// executando as consultas num Postgres real (PGlite) com o MESMO supabase/schema.sql e as mesmas políticas RLS.
//   API:   http://localhost:54321
//   Site:  http://localhost:5510  (o projeto, com assets/config.js apontando para o emulador)
import { PGlite } from "@electric-sql/pglite";
import http from "http";
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const AQUI = path.dirname(fileURLToPath(import.meta.url));
const RAIZ = path.join(AQUI, "..");
const ANON_KEY = "anon-chave-local-de-teste";
const API = "http://localhost:54321";

// ---------- Banco ----------
const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key, email text unique);
  create function auth.uid() returns uuid language sql stable as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  grant usage on schema auth to anon, authenticated; grant execute on function auth.uid() to anon, authenticated;
  create schema storage;
  create table storage.buckets (id text primary key, name text, public boolean, file_size_limit bigint, allowed_mime_types text[]);
  create table storage.objects (id uuid primary key default gen_random_uuid(), bucket_id text, name text, created_at timestamptz default now(), metadata jsonb, unique (bucket_id, name));
  alter table storage.objects enable row level security;
  grant usage on schema storage to anon, authenticated; grant all on storage.objects to anon, authenticated;
  grant usage on schema public to anon, authenticated;
`);
await db.exec(fs.readFileSync(path.join(RAIZ, "supabase/schema.sql"), "utf8"));

// usuários de teste (senhas aleatórias gravadas em tests/credenciais-teste.json, fora do git)
const credPath = path.join(AQUI, "credenciais-teste.json");
const cred = fs.existsSync(credPath) ? JSON.parse(fs.readFileSync(credPath, "utf8")) : {
  admin: { email: "admin@teste.localhost", senha: crypto.randomBytes(9).toString("base64url") },
  comum: { email: "leitor@teste.localhost", senha: crypto.randomBytes(9).toString("base64url") },
};
fs.writeFileSync(credPath, JSON.stringify(cred, null, 2));
const usuarios = {};
for (const [k, u] of Object.entries(cred)) {
  const id = crypto.randomUUID();
  usuarios[u.email] = { id, email: u.email, senha: u.senha };
  await db.query("insert into auth.users (id, email) values ($1, $2)", [id, u.email]);
  if (k === "admin") await db.query("insert into public.admins (user_id, nome) values ($1, 'Admin de teste')", [id]);
}
const tokens = new Map(); // access_token -> user
const arquivos = new Map(); // bucket/path -> { bytes, type }

// ---------- Utilidades ----------
let fila = Promise.resolve();
const serial = (fn) => (fila = fila.then(fn, fn));
const ident = (s) => { if (!/^[a-z_][a-z0-9_]*$/.test(s)) throw httpErr(400, "PGRST100", `coluna inválida: ${s}`); return `"${s}"`; };
const httpErr = (status, code, message) => Object.assign(new Error(message), { status, code });
const b64 = (o) => Buffer.from(JSON.stringify(o)).toString("base64url");
const jwt = (u) => `${b64({ alg: "HS256", typ: "JWT" })}.${b64({ sub: u.id, email: u.email, role: "authenticated", aud: "authenticated", exp: Math.floor(Date.now() / 1000) + 3600 })}.teste`;
const userJson = (u) => ({ id: u.id, aud: "authenticated", role: "authenticated", email: u.email, email_confirmed_at: new Date().toISOString(), app_metadata: { provider: "email" }, user_metadata: {}, created_at: new Date().toISOString() });
const sessao = (u) => { const t = jwt(u); tokens.set(t, u); const r = crypto.randomBytes(12).toString("hex"); tokens.set("r:" + r, u); return { access_token: t, token_type: "bearer", expires_in: 3600, expires_at: Math.floor(Date.now() / 1000) + 3600, refresh_token: r, user: userJson(u) }; };
const quem = (req) => { const t = (req.headers.authorization || "").replace(/^Bearer /i, ""); return tokens.get(t) || null; };

async function comoPapel(req, fn) {
  const u = quem(req);
  return serial(async () => {
    await db.exec("begin");
    try {
      await db.query("select set_config('request.jwt.claim.sub', $1, true)", [u ? u.id : ""]);
      await db.exec(`set local role ${u ? "authenticated" : "anon"}`);
      const r = await fn();
      await db.exec("commit");
      return r;
    } catch (e) { await db.exec("rollback"); throw e; }
  });
}

// ---------- PostgREST (subconjunto) ----------
const OPS = { eq: "=", neq: "<>", gt: ">", gte: ">=", lt: "<", lte: "<=", like: "like", ilike: "ilike" };
const lista = (s) => s.replace(/^\(|\)$/g, "").split(",").map((v) => v.trim().replace(/^"(.*)"$/, "$1"));
function condicao(col, expr, params) {
  let neg = false;
  if (expr.startsWith("not.")) { neg = true; expr = expr.slice(4); }
  const i = expr.indexOf("."); const op = expr.slice(0, i), val = expr.slice(i + 1);
  let sql;
  if (op === "in") { const vs = lista(val); sql = `${ident(col)} in (${vs.map((v) => (params.push(v), "$" + params.length)).join(",")})`; }
  else if (op === "is") sql = `${ident(col)} is ${({ null: "null", true: "true", false: "false" })[val]}`;
  else if (OPS[op]) { params.push(op.endsWith("like") ? val.replace(/\*/g, "%") : val === "true" ? true : val === "false" ? false : val); sql = `${ident(col)} ${OPS[op]} $${params.length}`; }
  else throw httpErr(400, "PGRST100", `operador não suportado: ${op}`);
  return neg ? `not (${sql})` : sql;
}
function where(sp, params) {
  const conds = [];
  for (const [k, v] of sp) {
    if (["select", "order", "limit", "offset", "columns"].includes(k)) continue;
    if (k === "or") {
      const partes = v.replace(/^\(|\)$/g, "").split(",").map((p) => { const [c, ...resto] = p.split("."); return condicao(c, resto.join("."), params); });
      conds.push(`(${partes.join(" or ")})`);
    } else conds.push(condicao(k, v, params));
  }
  return conds.length ? " where " + conds.join(" and ") : "";
}
const colunas = (sp) => { const s = sp.get("select") || "*"; return s === "*" ? "*" : s.split(",").map((c) => ident(c.trim())).join(","); };
const ordem = (sp) => { const o = sp.get("order"); if (!o) return ""; return " order by " + o.split(",").map((p) => { const [c, dir, nulls] = p.split("."); return `${ident(c)} ${dir === "desc" ? "desc" : "asc"}${nulls ? " " + (nulls === "nullsfirst" ? "nulls first" : "nulls last") : ""}`; }).join(", "); };

async function rest(req, res, url, corpo) {
  const sp = url.searchParams, tabela = url.pathname.split("/")[3];
  const prefer = req.headers.prefer || "", objeto = (req.headers.accept || "").includes("vnd.pgrst.object");
  if (tabela === "rpc") {
    const fn = url.pathname.split("/")[4];
    if (!["is_admin", "registrar_visualizacao"].includes(fn)) throw httpErr(404, "PGRST202", "função não encontrada");
    const args = corpo ? JSON.parse(corpo) : {};
    const r = await comoPapel(req, () => fn === "is_admin" ? db.query("select public.is_admin() as r") : db.query("select public.registrar_visualizacao($1) as r", [args.p_id]));
    return enviar(res, 200, r.rows[0].r ?? null);
  }
  if (!["noticias", "admins"].includes(tabela)) throw httpErr(404, "42P01", "tabela não encontrada");
  const T = `public.${ident(tabela)}`;
  const params = [];
  let rows, total = null;
  await comoPapel(req, async () => {
    if (req.method === "GET" || req.method === "HEAD") {
      const w = where(sp, params);
      if (prefer.includes("count=exact")) total = (await db.query(`select count(*)::int n from ${T}${w}`, params)).rows[0].n;
      const lim = sp.get("limit") ? ` limit ${parseInt(sp.get("limit"), 10)}` : "", off = sp.get("offset") ? ` offset ${parseInt(sp.get("offset"), 10)}` : "";
      rows = req.method === "HEAD" ? [] : (await db.query(`select ${colunas(sp)} from ${T}${w}${ordem(sp)}${lim}${off}`, params)).rows;
    } else if (req.method === "POST") {
      const dados = [].concat(JSON.parse(corpo)); rows = [];
      for (const d of dados) {
        const ks = Object.keys(d), ps = ks.map((k) => d[k]);
        rows.push(...(await db.query(`insert into ${T} (${ks.map(ident).join(",")}) values (${ks.map((_, i) => "$" + (i + 1)).join(",")}) returning ${colunas(sp)}`, ps)).rows);
      }
    } else if (req.method === "PATCH") {
      const d = JSON.parse(corpo), ks = Object.keys(d);
      ks.forEach((k) => params.push(d[k]));
      const set = ks.map((k, i) => `${ident(k)} = $${i + 1}`).join(", ");
      rows = (await db.query(`update ${T} set ${set}${where(sp, params)} returning ${colunas(sp)}`, params)).rows;
    } else if (req.method === "DELETE") {
      rows = (await db.query(`delete from ${T}${where(sp, params)} returning ${colunas(sp)}`, params)).rows;
    }
  });
  const h = {};
  if (total !== null) h["Content-Range"] = `${rows.length ? `${sp.get("offset") || 0}-${(+sp.get("offset") || 0) + rows.length - 1}` : "*"}/${total}`;
  if (req.method === "HEAD") return enviar(res, 200, null, h, true);
  if (objeto) {
    if (rows.length !== 1) return enviar(res, 406, { code: "PGRST116", message: "JSON object requested, multiple (or no) rows returned", details: `The result contains ${rows.length} rows`, hint: null });
    return enviar(res, req.method === "POST" ? 201 : 200, rows[0], h);
  }
  if (req.method !== "GET" && !prefer.includes("return=representation")) return enviar(res, req.method === "POST" ? 201 : 204, null, h, true);
  return enviar(res, req.method === "POST" ? 201 : 200, rows, h);
}

// ---------- Auth ----------
async function auth(req, res, url, corpo) {
  const rota = url.pathname.replace("/auth/v1/", "");
  const body = corpo ? JSON.parse(corpo) : {};
  if (rota === "token" && url.searchParams.get("grant_type") === "password") {
    const u = usuarios[(body.email || "").toLowerCase()];
    if (!u || u.senha !== body.password) return enviar(res, 400, { code: 400, error_code: "invalid_credentials", msg: "Invalid login credentials", error: "invalid_grant", error_description: "Invalid login credentials" });
    return enviar(res, 200, sessao(u));
  }
  if (rota === "token" && url.searchParams.get("grant_type") === "refresh_token") {
    const u = tokens.get("r:" + body.refresh_token);
    if (!u) return enviar(res, 400, { code: 400, error_code: "refresh_token_not_found", msg: "Invalid Refresh Token" });
    return enviar(res, 200, sessao(u));
  }
  if (rota === "user" && req.method === "GET") { const u = quem(req); return u ? enviar(res, 200, userJson(u)) : enviar(res, 401, { code: 401, msg: "invalid JWT" }); }
  if (rota === "user" && req.method === "PUT") { const u = quem(req); if (!u) return enviar(res, 401, { msg: "invalid JWT" }); if (body.password) u.senha = body.password; return enviar(res, 200, userJson(u)); }
  if (rota === "logout") { tokens.delete((req.headers.authorization || "").replace(/^Bearer /i, "")); return enviar(res, 204, null, {}, true); }
  if (rota === "recover") return enviar(res, 200, {});
  return enviar(res, 404, { msg: "rota de auth não emulada: " + rota });
}

// ---------- Storage ----------
function multipart(buf, tipo) {
  const b = "--" + /boundary=(?:"([^"]+)"|([^;]+))/.exec(tipo).slice(1).find(Boolean);
  const partes = []; let i = buf.indexOf(b);
  while (i !== -1) {
    const ini = i + b.length + 2, fim = buf.indexOf(b, ini); if (fim === -1) break;
    const parte = buf.subarray(ini, fim - 2), sep = parte.indexOf("\r\n\r\n");
    if (sep > 0) partes.push({ cab: parte.subarray(0, sep).toString(), dados: parte.subarray(sep + 4) });
    i = fim;
  }
  return partes;
}
async function storage(req, res, url, corpoBuf) {
  const p = decodeURIComponent(url.pathname.replace("/storage/v1/", ""));
  if (req.method === "GET" && p.startsWith("object/public/")) {
    const f = arquivos.get(p.replace("object/public/", ""));
    if (!f) return enviar(res, 404, { message: "Object not found" });
    res.writeHead(200, { "Content-Type": f.type, "Access-Control-Allow-Origin": "*", "Cache-Control": "no-store" }); return res.end(f.bytes);
  }
  if (req.method === "POST" && p.startsWith("object/list/")) {
    const bucket = p.split("/")[2], body = JSON.parse(corpoBuf.toString() || "{}");
    const prefixo = (body.prefix || "").replace(/\/?$/, "/");
    const r = await comoPapel(req, () => db.query(
      `select id, name, created_at, metadata from storage.objects where bucket_id = $1 and name like $2 order by created_at desc limit $3 offset $4`,
      [bucket, prefixo + "%", body.limit || 100, body.offset || 0]));
    return enviar(res, 200, r.rows.map((o) => ({ name: o.name.slice(prefixo.length), id: o.id, created_at: o.created_at, updated_at: o.created_at, metadata: o.metadata })));
  }
  if (req.method === "POST" && p.startsWith("object/")) {
    const [, bucket, ...resto] = p.split("/"), nome = resto.join("/");
    let bytes = corpoBuf, type = req.headers["content-type"];
    if (/multipart\/form-data/.test(type)) {
      const arq = multipart(corpoBuf, type).find((x) => /filename=/.test(x.cab) || /name=""/.test(x.cab));
      bytes = arq.dados; type = (/content-type:\s*([^\r\n]+)/i.exec(arq.cab) || [])[1] || "application/octet-stream";
    }
    const bk = (await db.query("select * from storage.buckets where id = $1", [bucket])).rows[0];
    if (!bk) return enviar(res, 400, { statusCode: "404", error: "Bucket not found", message: "Bucket not found" });
    if (bytes.length > Number(bk.file_size_limit)) return enviar(res, 413, { statusCode: "413", error: "Payload too large", message: "The object exceeded the maximum allowed size" });
    if (bk.allowed_mime_types && !bk.allowed_mime_types.includes(type)) return enviar(res, 415, { statusCode: "415", error: "invalid_mime_type", message: `mime type ${type} is not supported` });
    try {
      const r = await comoPapel(req, () => db.query(`insert into storage.objects (bucket_id, name, metadata) values ($1, $2, $3) returning id`, [bucket, nome, JSON.stringify({ size: bytes.length, mimetype: type })]));
      arquivos.set(`${bucket}/${nome}`, { bytes: Buffer.from(bytes), type });
      return enviar(res, 200, { Id: r.rows[0].id, Key: `${bucket}/${nome}` });
    } catch (e) { return enviar(res, 403, { statusCode: "403", error: "Unauthorized", message: "new row violates row-level security policy" }); }
  }
  if (req.method === "DELETE" && p.startsWith("object/")) {
    const bucket = p.split("/")[1], { prefixes = [] } = JSON.parse(corpoBuf.toString() || "{}");
    const r = await comoPapel(req, () => db.query(`delete from storage.objects where bucket_id = $1 and name in (${prefixes.map((_, i) => "$" + (i + 2)).join(",") || "null"}) returning name`, [bucket, ...prefixes]));
    r.rows.forEach((o) => arquivos.delete(`${bucket}/${o.name}`));
    return enviar(res, 200, r.rows.map((o) => ({ name: o.name, bucket_id: bucket })));
  }
  return enviar(res, 404, { message: "rota de storage não emulada: " + p });
}

// ---------- Servidores ----------
const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET,POST,PATCH,PUT,DELETE,HEAD,OPTIONS",
  "Access-Control-Allow-Headers": "authorization,apikey,content-type,prefer,accept,accept-profile,content-profile,x-client-info,x-upsert,range,x-supabase-api-version,cache-control",
  "Access-Control-Expose-Headers": "Content-Range,X-Total-Count",
};
function enviar(res, status, corpo, extra = {}, vazio = false) {
  res.writeHead(status, { ...CORS, ...(vazio ? {} : { "Content-Type": "application/json" }), ...extra });
  res.end(vazio || corpo === undefined ? undefined : JSON.stringify(corpo));
}
const log = [];
http.createServer((req, res) => {
  if (req.method === "OPTIONS") { res.writeHead(204, CORS); return res.end(); }
  const partes = []; req.on("data", (c) => partes.push(c));
  req.on("end", async () => {
    const buf = Buffer.concat(partes), url = new URL(req.url, API);
    log.push(`${req.method} ${url.pathname}${url.search}`.slice(0, 200));
    try {
      if (url.pathname.startsWith("/rest/v1/")) await rest(req, res, url, buf.toString());
      else if (url.pathname.startsWith("/auth/v1/")) await auth(req, res, url, buf.toString());
      else if (url.pathname.startsWith("/storage/v1/")) await storage(req, res, url, buf);
      else if (url.pathname === "/_log") enviar(res, 200, log.slice(-80));
      else enviar(res, 404, { message: "não encontrado" });
    } catch (e) {
      const status = e.status || (e.code === "42501" ? 403 : e.code === "23505" ? 409 : 400);
      enviar(res, status, { code: e.code || "500", message: e.message, details: e.detail || null, hint: e.hint || null });
    }
  });
}).listen(54321, () => console.log("Emulador Supabase em " + API));

const MIME = { ".html": "text/html; charset=utf-8", ".js": "text/javascript; charset=utf-8", ".css": "text/css; charset=utf-8", ".png": "image/png", ".svg": "image/svg+xml", ".jpeg": "image/jpeg", ".jpg": "image/jpeg", ".json": "application/json" };
http.createServer((req, res) => {
  let p = decodeURIComponent(new URL(req.url, "http://x").pathname);
  if (p === "/assets/config.js") {
    res.writeHead(200, { "Content-Type": MIME[".js"], "Cache-Control": "no-store" });
    return res.end(`window.OO_CONFIG = { supabaseUrl: "${API}", supabaseAnonKey: "${ANON_KEY}", bucket: "noticias" };`);
  }
  if (p.endsWith("/")) p += "index.html";
  const arq = path.join(RAIZ, p);
  if (!arq.startsWith(RAIZ) || arq.startsWith(path.join(RAIZ, "tests")) || !fs.existsSync(arq) || fs.statSync(arq).isDirectory()) {
    if (fs.existsSync(arq) && fs.statSync(arq).isDirectory()) { res.writeHead(301, { Location: p + "/" }); return res.end(); }
    res.writeHead(404); return res.end("404");
  }
  res.writeHead(200, { "Content-Type": MIME[path.extname(arq)] || "application/octet-stream", "Cache-Control": "no-store" });
  fs.createReadStream(arq).pipe(res);
}).listen(5510, () => console.log("Site de teste em http://localhost:5510 (config apontando para o emulador)"));
