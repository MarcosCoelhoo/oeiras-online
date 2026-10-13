// Gera supabase/seed-exemplos.sql a partir das notícias de demonstração de assets/data.js
const fs = require("fs"), vm = require("vm"), path = require("path");
const raiz = path.join(__dirname, "..");
const ctx = { window: {} }; ctx.window = ctx; vm.createContext(ctx);
vm.runInContext(fs.readFileSync(path.join(raiz, "assets/data.js"), "utf8"), ctx);
const OO = ctx.OO;
const q = (s) => (s == null ? "null" : "'" + String(s).replace(/'/g, "''") + "'");
const slug = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70).replace(/-+$/, "");
let out = `-- Notícias de exemplo do esboço do portal (opcional).
-- São importadas como RASCUNHO: ficam guardadas no painel, mas NÃO aparecem no site até serem revisadas e publicadas.
-- As fotos são ilustrativas (picsum.photos) e devem ser trocadas por fotos reais antes de publicar.
-- Execute depois do schema.sql, no SQL Editor do Supabase.

insert into public.noticias (slug, titulo, resumo, conteudo, categoria, autor, imagem_url, imagem_legenda, status, destaque, publicado_em)
values
`;
out += OO.noticias.map((n) => `  (${q(slug(n.titulo) + "-exemplo-" + n.id)}, ${q(n.titulo)}, ${q(n.resumo)}, ${q(OO.CONTEUDO_EXEMPLO.trim())}, ${q(n.cat)}, ${q(n.autor)}, ${q(n.img)}, 'Foto ilustrativa', 'rascunho', ${!!n.destaque}, now() - interval '${n.horas} hours')`).join(",\n");
out += "\non conflict (slug) do nothing;\n";
fs.writeFileSync(path.join(raiz, "supabase/seed-exemplos.sql"), out);
console.log(`${OO.noticias.length} notícias gravadas em supabase/seed-exemplos.sql`);
