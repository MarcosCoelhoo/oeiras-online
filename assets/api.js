// Camada de dados do site público.
// - Supabase configurado (assets/config.js): lê somente notícias publicadas (a política RLS do banco
//   garante isso — rascunhos e agendamentos futuros nunca são enviados ao visitante).
// - Sem configuração: "modo demonstração" com as notícias de exemplo de assets/data.js.
(() => {
  const OO = (window.OO = window.OO || {});
  const cfg = window.OO_CONFIG || {};
  const ativo = !!(cfg.supabaseUrl && cfg.supabaseAnonKey);
  const SUPABASE_JS = "https://cdn.jsdelivr.net/npm/@supabase/supabase-js@2.45.4/dist/umd/supabase.js";
  const CAMPOS = "id,slug,titulo,subtitulo,resumo,categoria,autor,imagem_url,imagem_legenda,destaque,publicado_em,visualizacoes";

  let clientPromise;
  const client = () => {
    if (!clientPromise) {
      clientPromise = new Promise((resolve, reject) => {
        const criar = () => resolve(window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
          auth: { persistSession: false, autoRefreshToken: false }, // o site público sempre consulta como visitante
        }));
        if (window.supabase?.createClient) return criar();
        const s = document.createElement("script");
        s.src = SUPABASE_JS; s.onload = criar; s.onerror = () => reject(new Error("Falha ao carregar o Supabase"));
        document.head.appendChild(s);
      });
    }
    return clientPromise;
  };

  // Formato comum usado pelos componentes do site
  const doBanco = (r) => ({
    id: r.id, slug: r.slug, cat: r.categoria, titulo: r.titulo, subtitulo: r.subtitulo || "", resumo: r.resumo,
    conteudo: r.conteudo, img: r.imagem_url || "", legenda: r.imagem_legenda || "", autor: r.autor,
    data: r.publicado_em, views: r.visualizacoes || 0, destaque: !!r.destaque,
  });
  const agora = Date.now();
  const demo = (OO.noticias || []).map((n) => ({
    id: String(n.id), slug: String(n.id), cat: n.cat, titulo: n.titulo, subtitulo: "", resumo: n.resumo,
    conteudo: OO.CONTEUDO_EXEMPLO, img: n.img, legenda: "Foto ilustrativa", autor: n.autor,
    data: new Date(agora - n.horas * 36e5).toISOString(), views: n.views, destaque: !!n.destaque, video: !!n.video,
  }));

  // remove caracteres que quebram a sintaxe de filtros do PostgREST
  const termo = (q) => (q || "").replace(/[%*,()\\:."']/g, " ").trim().slice(0, 80);

  OO.api = {
    ativo,
    modo: ativo ? "supabase" : "demo",

    // { cat, q, limit, offset, excluir: [ids] } → { itens, total }
    async listar({ cat, q, limit = 12, offset = 0, excluir = [] } = {}) {
      if (!ativo) {
        const t = termo(q).toLowerCase();
        const lista = demo.filter((n) => (!cat || n.cat === cat) && !excluir.includes(n.id) &&
          (!t || (n.titulo + " " + n.resumo).toLowerCase().includes(t)));
        return { itens: lista.slice(offset, offset + limit), total: lista.length };
      }
      const sb = await client();
      let req = sb.from("noticias").select(CAMPOS, { count: "exact" })
        .eq("status", "publicado").lte("publicado_em", new Date().toISOString())
        .order("publicado_em", { ascending: false }).range(offset, offset + limit - 1);
      if (cat) req = req.eq("categoria", cat);
      const t = termo(q);
      if (t) req = req.or(`titulo.ilike.*${t}*,resumo.ilike.*${t}*,subtitulo.ilike.*${t}*`);
      if (excluir.length) req = req.not("id", "in", `(${excluir.join(",")})`);
      const { data, error, count } = await req;
      if (error) throw error;
      return { itens: data.map(doBanco), total: count ?? data.length };
    },

    async destaques(limit = 6) {
      if (!ativo) return demo.filter((n) => n.destaque).slice(0, limit);
      const sb = await client();
      const { data, error } = await sb.from("noticias").select(CAMPOS)
        .eq("status", "publicado").eq("destaque", true).lte("publicado_em", new Date().toISOString())
        .order("publicado_em", { ascending: false }).limit(limit);
      if (error) throw error;
      return data.map(doBanco);
    },

    async maisLidas(limit = 5) {
      if (!ativo) return [...demo].sort((a, b) => b.views - a.views).slice(0, limit);
      const sb = await client();
      const { data, error } = await sb.from("noticias").select(CAMPOS)
        .eq("status", "publicado").lte("publicado_em", new Date().toISOString())
        .order("visualizacoes", { ascending: false }).order("publicado_em", { ascending: false }).limit(limit);
      if (error) throw error;
      return data.map(doBanco);
    },

    // busca por slug (ou id, no modo demonstração)
    async obter(slug) {
      if (!ativo) return demo.find((n) => n.slug === String(slug)) || null;
      const sb = await client();
      const { data, error } = await sb.from("noticias").select(CAMPOS + ",conteudo").eq("slug", slug).maybeSingle();
      if (error) throw error;
      return data ? doBanco(data) : null;
    },

    // conta uma visualização por sessão do navegador
    async registrarVisualizacao(id) {
      if (!ativo) return;
      const chave = "oo-view-" + id;
      try { if (sessionStorage.getItem(chave)) return; sessionStorage.setItem(chave, "1"); } catch {}
      const sb = await client();
      await sb.rpc("registrar_visualizacao", { p_id: id });
    },
  };
})();
