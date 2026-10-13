// Painel administrativo do Oeiras Online.
// Autenticação: Supabase Auth (e-mail e senha). Autorização: tabela public.admins + políticas RLS
// (supabase/schema.sql). Mesmo que alguém altere este arquivo no navegador, o banco recusa leitura
// de rascunhos, gravação, exclusão e envio de imagens para quem não é administrador.
(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const $$ = (s, el = document) => [...el.querySelectorAll(s)];
  const cfg = window.OO_CONFIG || {};
  const BUCKET = cfg.bucket || "noticias";
  const POR_PAGINA = 20;
  const MAX_UPLOAD = 5 * 1024 * 1024;
  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);
  const icons = () => window.lucide && lucide.createIcons();
  const catNome = (slug) => (OO.categorias.find((c) => c.slug === slug) || {}).nome || slug;
  const show = (id) => ["boot", "setup", "login", "reset", "app"].forEach((x) => ($("#" + x).hidden = x !== id));

  // ---------- Toasts, confirmação e erros ----------
  const toast = (msg, tipo = "ok") => {
    const t = document.createElement("div");
    t.className = `toast ${tipo}`;
    t.innerHTML = `<i data-lucide="${tipo === "ok" ? "circle-check" : tipo === "erro" ? "circle-alert" : "info"}"></i><span>${esc(msg)}</span>`;
    $("#toasts").appendChild(t); icons();
    setTimeout(() => t.classList.add("out"), tipo === "erro" ? 6000 : 3500);
    setTimeout(() => t.remove(), tipo === "erro" ? 6400 : 3900);
  };
  const confirmar = (titulo, texto, rotulo = "Confirmar") => new Promise((resolve) => {
    const m = $("#confirm");
    $("#confirm-title").textContent = titulo; $("#confirm-text").textContent = texto; $("#confirm-yes").textContent = rotulo;
    m.hidden = false; $("#confirm [data-confirm=no]").focus();
    const fim = (v) => { m.hidden = true; m.onclick = null; document.removeEventListener("keydown", esc_); resolve(v); };
    const esc_ = (e) => e.key === "Escape" && fim(false);
    document.addEventListener("keydown", esc_);
    m.onclick = (e) => { const b = e.target.closest("[data-confirm]"); if (b) fim(b.dataset.confirm === "yes"); else if (e.target === m) fim(false); };
  });
  const msgErro = (e) => {
    const m = (e && (e.message || e.error_description)) || String(e);
    if (/Invalid login credentials/i.test(m)) return "E-mail ou senha incorretos.";
    if (/Email not confirmed/i.test(m)) return "Este e-mail ainda não foi confirmado.";
    if (/JWT|session|token/i.test(m) && /expired|invalid/i.test(m)) return "Sua sessão expirou. Entre novamente.";
    if (e?.code === "42501" || /row-level security|permission denied/i.test(m)) return "Sem permissão para esta ação. Verifique se sua conta é de administrador.";
    if (e?.code === "23514") return "O banco recusou os dados: algum campo obrigatório está incompleto.";
    if (/Failed to fetch|NetworkError|network/i.test(m)) return "Sem conexão com o servidor. Verifique a internet e tente novamente.";
    if (/exceeded the maximum allowed size|Payload too large/i.test(m)) return "A imagem é grande demais (máximo 5 MB).";
    if (/rate limit/i.test(m)) return "Muitas tentativas. Aguarde alguns minutos e tente novamente.";
    return m;
  };
  const carregando = (btn, on, texto) => {
    if (!btn) return;
    if (on) { btn.dataset.html = btn.innerHTML; btn.disabled = true; btn.innerHTML = `<span class="spinner"></span>${texto || "Aguarde…"}`; }
    else { btn.disabled = false; if (btn.dataset.html) btn.innerHTML = btn.dataset.html; icons(); }
  };

  // ---------- Datas e status ----------
  const fmtData = (iso) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const paraLocal = (iso) => { const d = new Date(iso); d.setMinutes(d.getMinutes() - d.getTimezoneOffset()); return d.toISOString().slice(0, 16); };
  const situacao = (n) => (n.status === "rascunho" ? "rascunho" : new Date(n.publicado_em) > new Date() ? "agendada" : "publicada");
  const SIT = { rascunho: ["Rascunho", "gray"], agendada: ["Agendada", "amber"], publicada: ["Publicada", "green"] };
  const badge = (n) => { const [t, c] = SIT[situacao(n)]; return `<span class="badge ${c}">${t}</span>`; };
  const slugify = (t) => t.normalize("NFD").replace(/[̀-ͯ]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 70).replace(/-+$/, "");
  const sufixo = () => Math.random().toString(36).slice(2, 7);

  // ---------- Supabase ----------
  if (!cfg.supabaseUrl || !cfg.supabaseAnonKey) { show("setup"); icons(); return; }
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseAnonKey, {
    auth: { persistSession: true, autoRefreshToken: true, detectSessionInUrl: true, storageKey: "oo-admin-auth" },
  });
  const urlPublica = (path) => sb.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
  // link de "esqueci minha senha": o token chega no hash da URL (#access_token=...&type=recovery)
  let usuario = null, recuperando = /type=recovery/.test(location.hash);
  if (recuperando) { show("reset"); }

  const verificarAdmin = async () => {
    const { data, error } = await sb.rpc("is_admin");
    if (error) throw error;
    return data === true;
  };

  const entrarNoPainel = async (session) => {
    usuario = session.user;
    let ok = false;
    try { ok = await verificarAdmin(); } catch (e) { await sb.auth.signOut(); return telaLogin(msgErro(e)); }
    if (!ok) { await sb.auth.signOut(); return telaLogin("Esta conta não tem permissão de administrador."); }
    $("#who").textContent = usuario.email;
    show("app"); icons(); rotear();
  };
  const telaLogin = (erro) => {
    usuario = null; show("login");
    const m = $("#login-msg"); m.hidden = !erro; m.className = "alert erro"; m.textContent = erro || "";
    icons(); setTimeout(() => $("#login-form [name=email]").focus(), 50);
  };

  sb.auth.onAuthStateChange((evento, session) => {
    if (evento === "PASSWORD_RECOVERY") { recuperando = true; show("reset"); icons(); return; }
    if (evento === "SIGNED_OUT" && !$("#app").hidden) telaLogin("Você saiu do painel.");
  });

  (async () => {
    const { data: { session } } = await sb.auth.getSession();
    if (recuperando) return;
    if (session) entrarNoPainel(session); else telaLogin();
  })();

  // Login
  $("#login-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, email = f.email.value.trim(), senha = f.senha.value;
    if (!email || !senha) return telaLogin("Informe e-mail e senha.");
    const btn = $("#login-btn"); carregando(btn, true, "Entrando…");
    const { data, error } = await sb.auth.signInWithPassword({ email, password: senha });
    carregando(btn, false);
    if (error) return telaLogin(msgErro(error));
    f.senha.value = "";
    entrarNoPainel(data.session);
  });
  $("[data-eye]").addEventListener("click", (e) => {
    const i = $("#login-form [name=senha]"); i.type = i.type === "password" ? "text" : "password";
    e.currentTarget.innerHTML = `<i data-lucide="${i.type === "password" ? "eye" : "eye-off"}"></i>`; icons();
  });
  $("#forgot").addEventListener("click", async () => {
    const email = $("#login-form [name=email]").value.trim();
    const m = $("#login-msg"); m.hidden = false;
    if (!email) { m.className = "alert erro"; m.textContent = "Digite seu e-mail no campo acima e clique novamente em “Esqueci minha senha”."; return; }
    const { error } = await sb.auth.resetPasswordForEmail(email, { redirectTo: location.origin + location.pathname });
    m.className = error ? "alert erro" : "alert ok";
    m.textContent = error ? msgErro(error) : "Se este e-mail for de um administrador, você receberá um link para criar uma nova senha.";
  });
  $("#reset-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const f = e.target, m = $("#reset-msg"); m.hidden = false; m.className = "alert erro";
    if (f.senha.value.length < 8) return (m.textContent = "A senha precisa ter pelo menos 8 caracteres.");
    if (f.senha.value !== f.senha2.value) return (m.textContent = "As senhas não conferem.");
    const btn = f.querySelector("button"); carregando(btn, true, "Salvando…");
    const { data, error } = await sb.auth.updateUser({ password: f.senha.value });
    carregando(btn, false);
    if (error) return (m.textContent = msgErro(error));
    recuperando = false; history.replaceState(null, "", location.pathname);
    toast("Senha alterada com sucesso.");
    const { data: { session } } = await sb.auth.getSession();
    entrarNoPainel(session || { user: data.user });
  });
  $("#logout").addEventListener("click", async () => {
    if (sujo && !(await confirmar("Sair sem salvar?", "Há alterações não salvas nesta notícia.", "Sair"))) return;
    sujo = false;
    await sb.auth.signOut(); telaLogin();
  });

  // ---------- Rotas ----------
  let sujo = false, rotaAtual = location.hash, descartarBackup = null;
  addEventListener("beforeunload", (e) => { if (sujo) { e.preventDefault(); e.returnValue = ""; } });
  addEventListener("hashchange", async () => {
    if (sujo && location.hash !== rotaAtual) {
      if (!(await confirmar("Descartar alterações?", "Você tem alterações não salvas nesta notícia.", "Descartar"))) {
        history.replaceState(null, "", rotaAtual); return;
      }
      sujo = false; descartarBackup && descartarBackup();
    }
    rotear();
  });
  function rotear() {
    if (!usuario) return;
    rotaAtual = location.hash || "#/noticias";
    const [, rota, id] = rotaAtual.split("/");
    $$(".a-nav a").forEach((a) => a.classList.toggle("on", a.dataset.route === (rota === "editar" ? "" : rota || "noticias")));
    scrollTo(0, 0);
    if (rota === "nova") return editor(null);
    if (rota === "editar" && id) return editor(id);
    if (rota === "imagens") return galeria();
    return lista();
  }

  // ---------- Lista de notícias ----------
  const filtros = { q: "", cat: "", sit: "", de: "", ate: "", pagina: 0 };
  async function lista() {
    const v = $("#view");
    v.innerHTML = `
      <div class="v-head">
        <div><h1>Notícias</h1><p class="muted">Cadastre, edite, publique e organize as matérias do portal.</p></div>
        <a class="btn red" href="#/nova"><i data-lucide="plus"></i> Nova notícia</a>
      </div>
      <div class="stats" id="stats"></div>
      <form class="filters-bar" id="filtros">
        <label class="field grow"><span>Buscar pelo título</span><input name="q" type="search" placeholder="Digite parte do título…" value="${esc(filtros.q)}"></label>
        <label class="field"><span>Categoria</span><select name="cat"><option value="">Todas</option>${OO.categorias.map((c) => `<option value="${c.slug}" ${filtros.cat === c.slug ? "selected" : ""}>${c.nome}</option>`).join("")}</select></label>
        <label class="field"><span>Situação</span><select name="sit">
          <option value="">Todas</option>
          ${Object.entries(SIT).map(([k, [t]]) => `<option value="${k}" ${filtros.sit === k ? "selected" : ""}>${t}</option>`).join("")}
        </select></label>
        <label class="field"><span>De</span><input name="de" type="date" value="${filtros.de}"></label>
        <label class="field"><span>Até</span><input name="ate" type="date" value="${filtros.ate}"></label>
        <button class="btn ghost" type="button" id="limpar"><i data-lucide="rotate-ccw"></i> Limpar</button>
      </form>
      <div id="tabela"></div>`;
    icons();
    const form = $("#filtros"); let t;
    const aplicar = () => { Object.assign(filtros, { q: form.q.value.trim(), cat: form.cat.value, sit: form.sit.value, de: form.de.value, ate: form.ate.value, pagina: 0 }); carregar(); };
    form.addEventListener("input", (e) => { clearTimeout(t); t = setTimeout(aplicar, e.target.name === "q" ? 350 : 0); });
    form.addEventListener("submit", (e) => { e.preventDefault(); aplicar(); });
    $("#limpar").onclick = () => { form.reset(); form.q.value = ""; $$("select,input", form).forEach((i) => (i.value = "")); aplicar(); };
    carregarStats(); carregar();
  }

  async function carregarStats() {
    const agora = new Date().toISOString();
    const conta = (fn) => fn(sb.from("noticias").select("id", { count: "exact", head: true })).then((r) => { if (r.error) throw r.error; return r.count ?? 0; });
    try {
      const [total, pub, rasc, ag] = await Promise.all([
        conta((q) => q),
        conta((q) => q.eq("status", "publicado").lte("publicado_em", agora)),
        conta((q) => q.eq("status", "rascunho")),
        conta((q) => q.eq("status", "publicado").gt("publicado_em", agora)),
      ]);
      const el = $("#stats"); if (!el) return;
      el.innerHTML = [["Total", total, "newspaper"], ["Publicadas", pub, "circle-check"], ["Rascunhos", rasc, "file-pen"], ["Agendadas", ag, "calendar-clock"]]
        .map(([r, n, i]) => `<div class="stat"><i data-lucide="${i}"></i><div><b>${n}</b><span>${r}</span></div></div>`).join("");
      icons();
    } catch (e) { toast(msgErro(e), "erro"); }
  }

  async function carregar() {
    const box = $("#tabela"); if (!box) return;
    box.innerHTML = `<div class="loading"><span class="spinner"></span>Carregando notícias…</div>`;
    const agora = new Date().toISOString(), ini = filtros.pagina * POR_PAGINA;
    let q = sb.from("noticias").select("id,slug,titulo,categoria,autor,status,destaque,publicado_em,imagem_url,atualizado_em", { count: "exact" })
      .order("publicado_em", { ascending: false }).range(ini, ini + POR_PAGINA - 1);
    if (filtros.q) q = q.ilike("titulo", `%${filtros.q.replace(/[%_\\]/g, (c) => "\\" + c)}%`);
    if (filtros.cat) q = q.eq("categoria", filtros.cat);
    if (filtros.sit === "rascunho") q = q.eq("status", "rascunho");
    if (filtros.sit === "publicada") q = q.eq("status", "publicado").lte("publicado_em", agora);
    if (filtros.sit === "agendada") q = q.eq("status", "publicado").gt("publicado_em", agora);
    if (filtros.de) q = q.gte("publicado_em", new Date(filtros.de + "T00:00:00").toISOString());
    if (filtros.ate) q = q.lte("publicado_em", new Date(filtros.ate + "T23:59:59").toISOString());
    const { data, error, count } = await q;
    if (!$("#tabela")) return;
    if (error) { box.innerHTML = `<div class="alert erro">${esc(msgErro(error))}</div>`; return; }
    if (!data.length) {
      const filtrando = filtros.q || filtros.cat || filtros.sit || filtros.de || filtros.ate;
      box.innerHTML = `<div class="empty"><i data-lucide="newspaper"></i><h3>${filtrando ? "Nenhuma notícia encontrada com esses filtros" : "Nenhuma notícia cadastrada ainda"}</h3>
        ${filtrando ? "" : `<a class="btn red" href="#/nova"><i data-lucide="plus"></i> Cadastrar a primeira notícia</a>`}</div>`;
      icons(); return;
    }
    box.innerHTML = `
      <div class="table">
        <div class="tr th"><span>Notícia</span><span>Categoria</span><span>Situação</span><span>Publicação</span><span class="ac">Ações</span></div>
        ${data.map((n) => `
        <div class="tr" data-id="${n.id}">
          <a class="cell-main" href="#/editar/${n.id}">
            ${n.imagem_url ? `<img src="${esc(n.imagem_url)}" alt="" loading="lazy">` : `<span class="thumb-vazia"><i data-lucide="image-off"></i></span>`}
            <span><b>${esc(n.titulo)}</b><small>${n.destaque ? '<i data-lucide="star" class="star"></i> Destaque · ' : ""}${esc(n.autor)}</small></span>
          </a>
          <span class="cell" data-label="Categoria">${esc(catNome(n.categoria))}</span>
          <span class="cell" data-label="Situação">${badge(n)}</span>
          <span class="cell" data-label="Publicação">${fmtData(n.publicado_em)}</span>
          <span class="cell ac">
            <a class="icon-btn" href="#/editar/${n.id}" title="Editar" aria-label="Editar"><i data-lucide="pencil"></i></a>
            ${situacao(n) === "publicada" ? `<a class="icon-btn" href="../noticia.html?id=${encodeURIComponent(n.slug)}" target="_blank" rel="noopener" title="Ver no site" aria-label="Ver no site"><i data-lucide="external-link"></i></a>` : ""}
            <button class="icon-btn" data-acao="${n.status === "publicado" ? "despublicar" : "publicar"}" title="${n.status === "publicado" ? "Despublicar" : "Publicar"}" aria-label="${n.status === "publicado" ? "Despublicar" : "Publicar"}"><i data-lucide="${n.status === "publicado" ? "eye-off" : "send"}"></i></button>
            <button class="icon-btn danger" data-acao="excluir" title="Excluir" aria-label="Excluir"><i data-lucide="trash-2"></i></button>
          </span>
        </div>`).join("")}
      </div>
      <div class="pager">
        <span class="muted">Mostrando ${ini + 1}–${ini + data.length} de ${count}</span>
        <span><button class="btn ghost sm" id="ant" ${filtros.pagina ? "" : "disabled"}><i data-lucide="chevron-left"></i> Anterior</button>
        <button class="btn ghost sm" id="prox" ${ini + data.length < count ? "" : "disabled"}>Próxima <i data-lucide="chevron-right"></i></button></span>
      </div>`;
    icons();
    $("#ant").onclick = () => { filtros.pagina--; carregar(); };
    $("#prox").onclick = () => { filtros.pagina++; carregar(); };
    box.onclick = async (e) => {
      const b = e.target.closest("[data-acao]"); if (!b) return;
      const id = b.closest(".tr").dataset.id, n = data.find((x) => x.id === id);
      if (b.dataset.acao === "excluir") return excluir(n, () => { carregar(); carregarStats(); });
      if (b.dataset.acao === "despublicar") {
        if (!(await confirmar("Despublicar notícia?", `“${n.titulo}” deixará de aparecer no site e voltará a ser rascunho.`, "Despublicar"))) return;
        return mudarStatus(b, n.id, "rascunho");
      }
      // publicar direto da lista: só se a notícia estiver completa (o banco também valida)
      const { data: cheia, error } = await sb.from("noticias").select("*").eq("id", id).single();
      if (error) return toast(msgErro(error), "erro");
      const faltando = validar(cheia, true);
      if (faltando.length) { toast(`Complete antes de publicar: ${faltando.join(", ")}.`, "erro"); location.hash = "#/editar/" + id; return; }
      mudarStatus(b, n.id, "publicado");
    };
  }

  async function mudarStatus(btn, id, status) {
    carregando(btn, true, "");
    const { error } = await sb.from("noticias").update({ status }).eq("id", id);
    carregando(btn, false);
    if (error) return toast(msgErro(error), "erro");
    toast(status === "publicado" ? "Notícia publicada." : "Notícia despublicada. Ela voltou a ser rascunho.");
    carregar(); carregarStats();
  }

  async function excluir(n, depois) {
    if (!(await confirmar("Excluir notícia?", `“${n.titulo}” será excluída permanentemente. Esta ação não pode ser desfeita.`, "Excluir"))) return;
    const { data: antes } = await sb.from("noticias").select("imagem_path").eq("id", n.id).maybeSingle();
    const { error } = await sb.from("noticias").delete().eq("id", n.id);
    if (error) return toast(msgErro(error), "erro");
    // remove a imagem de capa se nenhuma outra notícia a utiliza
    const path = antes?.imagem_path;
    if (path) {
      const { count } = await sb.from("noticias").select("id", { count: "exact", head: true }).eq("imagem_path", path);
      if (!count) await sb.storage.from(BUCKET).remove([path]);
    }
    toast("Notícia excluída.");
    depois && depois();
  }

  // ---------- Validação ----------
  const textoDe = (html) => (html || "").replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  function validar(n, publicar) {
    const f = [];
    if (!n.titulo || n.titulo.trim().length < 10) f.push("título (mínimo 10 caracteres)");
    if (!n.categoria) f.push("categoria");
    if (!n.autor || !n.autor.trim()) f.push("autor");
    if (!n.publicado_em || isNaN(new Date(n.publicado_em))) f.push("data e hora de publicação");
    if (publicar) {
      if (!n.resumo || n.resumo.trim().length < 20) f.push("resumo (mínimo 20 caracteres)");
      if (textoDe(n.conteudo).length < 100) f.push("conteúdo (mínimo 100 caracteres)");
      if (!n.imagem_url) f.push("imagem de capa");
    }
    return f;
  }

  // ---------- Editor ----------
  async function editor(id) {
    const v = $("#view");
    v.innerHTML = `<div class="loading"><span class="spinner"></span>${id ? "Carregando notícia…" : "Preparando editor…"}</div>`;
    let n = {
      titulo: "", subtitulo: "", resumo: "", conteudo: "", categoria: "", autor: localStorage.getItem("oo-autor") || "Redação Oeiras Online",
      imagem_url: null, imagem_path: null, imagem_legenda: "", destaque: false, status: "rascunho", publicado_em: new Date().toISOString(),
    };
    if (id) {
      const { data, error } = await sb.from("noticias").select("*").eq("id", id).maybeSingle();
      if (error || !data) { v.innerHTML = `<div class="alert erro">${error ? esc(msgErro(error)) : "Notícia não encontrada. Ela pode ter sido excluída."}</div><a class="btn ghost" href="#/noticias">Voltar para a lista</a>`; return; }
      n = data;
    }
    const novo = !id;
    v.innerHTML = `
      <div class="v-head">
        <div>
          <a class="back" href="#/noticias"><i data-lucide="arrow-left"></i> Notícias</a>
          <h1>${novo ? "Nova notícia" : "Editar notícia"}</h1>
          <p class="muted" id="ed-status">${novo ? "Ainda não salva" : `${badge(n)} · última alteração em ${fmtData(n.atualizado_em)}`}</p>
        </div>
      </div>
      <form class="editor" id="ed" novalidate>
        <div class="ed-main">
          <label class="field"><span>Título <em>*</em></span>
            <input name="titulo" maxlength="200" required value="${esc(n.titulo)}" placeholder="Título da matéria"><small class="count" data-for="titulo"></small></label>
          <label class="field"><span>Subtítulo <small>(linha fina, opcional)</small></span>
            <input name="subtitulo" maxlength="300" value="${esc(n.subtitulo || "")}" placeholder="Complemento do título exibido na página da notícia"></label>
          <label class="field"><span>Resumo <em>*</em> <small>(aparece nos cards e na capa)</small></span>
            <textarea name="resumo" rows="3" maxlength="400" placeholder="Duas ou três linhas que resumem a notícia">${esc(n.resumo || "")}</textarea><small class="count" data-for="resumo"></small></label>
          <div class="field"><span>Conteúdo <em>*</em></span>
            <div id="quill"></div><small class="count" id="count-conteudo"></small></div>
        </div>
        <aside class="ed-side">
          <div class="panel">
            <h3>Publicação</h3>
            <label class="field"><span>Categoria <em>*</em></span>
              <select name="categoria" required><option value="">Selecione…</option>${OO.categorias.map((c) => `<option value="${c.slug}" ${n.categoria === c.slug ? "selected" : ""}>${c.nome}</option>`).join("")}</select></label>
            <label class="field"><span>Autor <em>*</em></span><input name="autor" required maxlength="120" value="${esc(n.autor)}"></label>
            <label class="field"><span>Data e hora de publicação <em>*</em></span><input name="publicado_em" type="datetime-local" required value="${paraLocal(n.publicado_em)}">
              <small>Se a data for futura, a notícia fica <b>agendada</b> e só aparece no site a partir desse horário.</small></label>
            <label class="check"><input type="checkbox" name="destaque" ${n.destaque ? "checked" : ""}> <span><b>Destaque na capa</b><small>Prioriza a notícia na manchete e em “Destaques do Dia”.</small></span></label>
          </div>
          <div class="panel">
            <h3>Imagem de capa <em>*</em></h3>
            <div class="cover" id="cover"></div>
            <input type="file" id="arquivo" accept="image/jpeg,image/png,image/webp,image/gif" hidden>
            <div class="cover-actions">
              <button type="button" class="btn ghost sm" id="enviar"><i data-lucide="upload"></i> Enviar imagem</button>
              <button type="button" class="btn ghost sm" id="escolher"><i data-lucide="images"></i> Galeria</button>
              <button type="button" class="btn ghost sm danger" id="remover"><i data-lucide="x"></i> Remover</button>
            </div>
            <label class="field"><span>Legenda / crédito da foto</span><input name="imagem_legenda" maxlength="200" value="${esc(n.imagem_legenda || "")}" placeholder="Ex.: Feira do açaí · Foto: Oeiras Online"></label>
            <small class="muted">JPG, PNG, WEBP ou GIF. Fotos grandes são reduzidas automaticamente para até 1600 px.</small>
          </div>
        </aside>
        <div class="ed-bar">
          <div class="alert erro" id="ed-erros" hidden></div>
          <div class="ed-buttons">
            ${novo ? "" : `<button type="button" class="btn ghost danger" id="b-excluir"><i data-lucide="trash-2"></i> Excluir</button>`}
            <span class="spacer"></span>
            <button type="button" class="btn ghost" id="b-previa"><i data-lucide="eye"></i> Prévia</button>
            ${n.status === "publicado" ? `<button type="button" class="btn ghost" id="b-despublicar"><i data-lucide="eye-off"></i> Despublicar</button>` : `<button type="button" class="btn ghost" id="b-rascunho"><i data-lucide="save"></i> Salvar rascunho</button>`}
            <button type="button" class="btn red" id="b-publicar"><i data-lucide="send"></i> ${n.status === "publicado" ? "Salvar alterações" : "Publicar"}</button>
          </div>
        </div>
      </form>`;
    icons();

    const form = $("#ed");
    const quill = new Quill("#quill", {
      theme: "snow",
      placeholder: "Escreva a matéria. Use os intertítulos (H2/H3), listas e links da barra acima.",
      modules: { toolbar: [[{ header: [2, 3, false] }], ["bold", "italic", "underline"], [{ list: "ordered" }, { list: "bullet" }], ["blockquote", "link"], ["clean"]] },
    });
    if (n.conteudo) quill.setContents(quill.clipboard.convert({ html: n.conteudo }), "silent");
    // traduz os rótulos do seletor de títulos
    $$(".ql-header .ql-picker-item, .ql-header .ql-picker-label").forEach((el) => el.setAttribute("title", "Estilo do parágrafo"));

    let capa = { url: n.imagem_url, path: n.imagem_path };
    const desenharCapa = () => {
      $("#cover").innerHTML = capa.url ? `<img src="${esc(capa.url)}" alt="Capa">` : `<div class="cover-empty"><i data-lucide="image-plus"></i><span>Nenhuma imagem selecionada</span></div>`;
      $("#remover").hidden = !capa.url; icons();
    };
    desenharCapa();

    const contadores = () => {
      $$(".count[data-for]", form).forEach((c) => { const i = form[c.dataset.for]; c.textContent = `${i.value.length}/${i.maxLength}`; });
      $("#count-conteudo").textContent = `${textoDe(quill.getSemanticHTML()).length} caracteres`;
    };
    contadores();

    // Cópia de segurança local do formulário: protege contra fechamento da aba, queda de energia ou
    // navegadores que abrem a prévia na mesma aba. É apagada quando a notícia é salva no banco.
    const chaveBackup = "oo-edicao:" + (id || "nova");
    let tBackup;
    const guardarBackup = () => {
      clearTimeout(tBackup);
      tBackup = setTimeout(() => { try { localStorage.setItem(chaveBackup, JSON.stringify({ dados: coletar(), salvoEm: new Date().toISOString() })); } catch {} }, 400);
    };
    const apagarBackup = () => { clearTimeout(tBackup); try { localStorage.removeItem(chaveBackup); } catch {} };
    descartarBackup = apagarBackup;
    const marcarSujo = () => { sujo = true; contadores(); guardarBackup(); };
    form.addEventListener("input", marcarSujo);
    quill.on("text-change", (_d, _o, fonte) => fonte !== "silent" && marcarSujo());
    sujo = false;

    let backup = null;
    try { backup = JSON.parse(localStorage.getItem(chaveBackup) || "null"); } catch {}
    if (backup && (novo || new Date(backup.salvoEm) > new Date(n.atualizado_em))) {
      $("#ed-status").insertAdjacentHTML("afterend", `<div class="alert aviso" id="restaurar">
        <span>Há alterações desta notícia não salvas no banco, feitas em ${fmtData(backup.salvoEm)}.</span>
        <span><button type="button" class="btn red sm" data-restaurar="sim">Restaurar</button> <button type="button" class="btn ghost sm" data-restaurar="nao">Descartar</button></span></div>`);
      $("#restaurar").onclick = (e) => {
        const b = e.target.closest("[data-restaurar]"); if (!b) return;
        if (b.dataset.restaurar === "sim") {
          const d = backup.dados;
          ["titulo", "subtitulo", "resumo", "autor", "imagem_legenda"].forEach((k) => (form[k].value = d[k] || ""));
          form.categoria.value = d.categoria || "";
          if (d.publicado_em) form.publicado_em.value = paraLocal(d.publicado_em);
          form.destaque.checked = !!d.destaque;
          quill.setContents(quill.clipboard.convert({ html: d.conteudo || "" }), "silent");
          capa = { url: d.imagem_url, path: d.imagem_path }; desenharCapa();
          sujo = true; contadores(); toast("Alterações restauradas. Lembre-se de salvar.", "info");
        } else apagarBackup();
        $("#restaurar").remove();
      };
    } else if (backup) apagarBackup();

    const coletar = () => ({
      titulo: form.titulo.value.trim(), subtitulo: form.subtitulo.value.trim() || null, resumo: form.resumo.value.trim(),
      conteudo: quill.getLength() > 1 ? quill.getSemanticHTML().replace(/&nbsp;/g, " ") : "",
      categoria: form.categoria.value, autor: form.autor.value.trim(),
      publicado_em: form.publicado_em.value ? new Date(form.publicado_em.value).toISOString() : null,
      destaque: form.destaque.checked, imagem_url: capa.url || null, imagem_path: capa.path || null,
      imagem_legenda: form.imagem_legenda.value.trim() || null,
    });

    const mostrarErros = (lista) => {
      const box = $("#ed-erros"); box.hidden = !lista.length;
      box.innerHTML = lista.length ? `<b>Antes de continuar, preencha:</b> ${lista.map(esc).join(", ")}.` : "";
      if (lista.length) box.scrollIntoView({ block: "nearest", behavior: "smooth" });
    };

    async function salvar(status, btn) {
      const dados = { ...coletar(), status };
      const faltando = validar(dados, status === "publicado");
      mostrarErros(faltando);
      if (faltando.length) return toast("Há campos obrigatórios pendentes.", "erro");
      carregando(btn, true, "Salvando…");
      localStorage.setItem("oo-autor", dados.autor);
      let r;
      if (novo) {
        for (let tentativa = 0; tentativa < 3; tentativa++) {
          r = await sb.from("noticias").insert({ ...dados, slug: `${slugify(dados.titulo) || "noticia"}-${sufixo()}` }).select("id").single();
          if (r.error?.code !== "23505") break; // slug repetido: tenta outro sufixo
        }
      } else {
        r = await sb.from("noticias").update(dados).eq("id", id).select("id").single();
      }
      carregando(btn, false);
      if (r.error) return toast(msgErro(r.error), "erro");
      sujo = false; apagarBackup();
      const agendada = status === "publicado" && new Date(dados.publicado_em) > new Date();
      const eraPublicada = n.status === "publicado";
      toast(status === "rascunho"
        ? (eraPublicada ? "Notícia despublicada. Ela voltou a ser rascunho." : "Rascunho salvo.")
        : agendada ? `Notícia agendada para ${fmtData(dados.publicado_em)}.`
        : eraPublicada ? "Alterações salvas. A notícia continua publicada." : "Notícia publicada no site.");
      if (novo) { rotaAtual = "#/editar/" + r.data.id; history.replaceState(null, "", rotaAtual); }
      editor(r.data.id);
    }

    $("#b-publicar").onclick = (e) => salvar("publicado", e.currentTarget);
    $("#b-rascunho") && ($("#b-rascunho").onclick = (e) => salvar("rascunho", e.currentTarget));
    $("#b-despublicar") && ($("#b-despublicar").onclick = async (e) => {
      if (!(await confirmar("Despublicar notícia?", "Ela deixará de aparecer no site e voltará a ser rascunho. As alterações do formulário também serão salvas.", "Despublicar"))) return;
      salvar("rascunho", e.currentTarget);
    });
    $("#b-excluir") && ($("#b-excluir").onclick = () => excluir(n, () => { sujo = false; apagarBackup(); location.hash = "#/noticias"; }));
    $("#b-previa").onclick = () => {
      const d = coletar();
      const previa = { cat: d.categoria, titulo: d.titulo || "(sem título)", subtitulo: d.subtitulo || "", resumo: d.resumo, conteudo: d.conteudo,
        img: d.imagem_url || "", legenda: d.imagem_legenda || "", autor: d.autor, data: d.publicado_em || new Date().toISOString() };
      try { localStorage.setItem("oo-preview", JSON.stringify(previa)); } catch { return toast("Não foi possível gerar a prévia neste navegador.", "erro"); }
      window.open("../noticia.html?preview=1", "_blank", "noopener");
    };

    // Imagem de capa
    $("#enviar").onclick = () => $("#arquivo").click();
    $("#arquivo").onchange = async (e) => {
      const file = e.target.files[0]; e.target.value = "";
      if (!file) return;
      const btn = $("#enviar"); carregando(btn, true, "Enviando…");
      try { capa = await enviarImagem(file); desenharCapa(); marcarSujo(); toast("Imagem enviada."); }
      catch (err) { toast(msgErro(err), "erro"); }
      carregando(btn, false);
    };
    $("#escolher").onclick = () => abrirGaleria((img) => { capa = img; desenharCapa(); marcarSujo(); });
    $("#remover").onclick = () => { capa = { url: null, path: null }; desenharCapa(); marcarSujo(); };
  }

  // reduz fotos grandes no navegador antes do envio
  async function prepararImagem(file) {
    if (!/^image\/(jpeg|png|webp|gif)$/.test(file.type)) throw new Error("Formato não suportado. Use JPG, PNG, WEBP ou GIF.");
    if (file.type === "image/gif") { if (file.size > MAX_UPLOAD) throw new Error("A imagem é grande demais (máximo 5 MB)."); return file; }
    const bmp = await createImageBitmap(file).catch(() => null);
    if (!bmp) throw new Error("Não foi possível ler esta imagem.");
    const MAX = 1600;
    if (bmp.width <= MAX && file.size <= 1.5 * 1024 * 1024) { bmp.close?.(); return file; }
    const k = Math.min(1, MAX / bmp.width);
    const c = document.createElement("canvas"); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
    c.getContext("2d").drawImage(bmp, 0, 0, c.width, c.height); bmp.close?.();
    const blob = await new Promise((r) => c.toBlob(r, "image/webp", 0.85)) || await new Promise((r) => c.toBlob(r, "image/jpeg", 0.85));
    if (blob.size > MAX_UPLOAD) throw new Error("A imagem continua grande demais mesmo após a redução.");
    return new File([blob], file.name.replace(/\.\w+$/, blob.type === "image/webp" ? ".webp" : ".jpg"), { type: blob.type });
  }
  async function enviarImagem(original) {
    const file = await prepararImagem(original);
    const ext = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" }[file.type];
    const path = `capas/${Date.now()}-${sufixo()}.${ext}`;
    const { error } = await sb.storage.from(BUCKET).upload(path, file, { cacheControl: "31536000", contentType: file.type, upsert: false });
    if (error) throw error;
    return { url: urlPublica(path), path };
  }

  // ---------- Galeria ----------
  async function listarImagens(offset) {
    const { data, error } = await sb.storage.from(BUCKET).list("capas", { limit: 40, offset, sortBy: { column: "created_at", order: "desc" } });
    if (error) throw error;
    const itens = data.filter((f) => f.id).map((f) => ({ nome: f.name, path: `capas/${f.name}`, url: urlPublica(`capas/${f.name}`), tamanho: f.metadata?.size || 0, data: f.created_at }));
    let uso = {};
    if (itens.length) {
      const r = await sb.from("noticias").select("imagem_path").in("imagem_path", itens.map((i) => i.path));
      if (r.error) throw r.error;
      r.data.forEach((x) => (uso[x.imagem_path] = (uso[x.imagem_path] || 0) + 1));
    }
    return { itens: itens.map((i) => ({ ...i, uso: uso[i.path] || 0 })), fim: data.length < 40 };
  }
  const cardImagem = (i, modo) => `
    <figure class="g-item" data-path="${esc(i.path)}">
      <img src="${esc(i.url)}" alt="" loading="lazy">
      <figcaption>
        <small>${i.uso ? `Em uso em ${i.uso} notícia${i.uso > 1 ? "s" : ""}` : "Não utilizada"} · ${(i.tamanho / 1024).toFixed(0)} KB</small>
        ${modo === "escolher"
          ? `<button type="button" class="btn red sm" data-usar>Usar esta</button>`
          : `<span><button type="button" class="icon-btn" data-copiar title="Copiar link" aria-label="Copiar link"><i data-lucide="link"></i></button>
             <button type="button" class="icon-btn danger" data-apagar ${i.uso ? "disabled title='Em uso — troque a capa das notícias antes de excluir'" : "title='Excluir imagem'"} aria-label="Excluir imagem"><i data-lucide="trash-2"></i></button></span>`}
      </figcaption>
    </figure>`;

  async function galeria() {
    const v = $("#view");
    v.innerHTML = `
      <div class="v-head">
        <div><h1>Imagens</h1><p class="muted">Imagens de capa enviadas para o portal. Imagens em uso não podem ser excluídas.</p></div>
        <span><input type="file" id="g-arquivo" accept="image/jpeg,image/png,image/webp,image/gif" hidden>
        <button class="btn red" id="g-enviar"><i data-lucide="upload"></i> Enviar imagem</button></span>
      </div>
      <div class="gallery" id="g-grid"><div class="loading"><span class="spinner"></span>Carregando imagens…</div></div>
      <div class="pager center"><button class="btn ghost" id="g-mais" hidden>Carregar mais</button></div>`;
    icons();
    let offset = 0, todos = [];
    const carregarG = async () => {
      try {
        const { itens, fim } = await listarImagens(offset);
        todos = todos.concat(itens); offset += 40;
        $("#g-grid").innerHTML = todos.map((i) => cardImagem(i, "gerenciar")).join("") ||
          `<div class="empty"><i data-lucide="images"></i><h3>Nenhuma imagem enviada ainda</h3></div>`;
        $("#g-mais").hidden = fim; icons();
      } catch (e) { $("#g-grid").innerHTML = `<div class="alert erro">${esc(msgErro(e))}</div>`; }
    };
    $("#g-mais").onclick = carregarG;
    $("#g-enviar").onclick = () => $("#g-arquivo").click();
    $("#g-arquivo").onchange = async (e) => {
      const file = e.target.files[0]; e.target.value = ""; if (!file) return;
      const b = $("#g-enviar"); carregando(b, true, "Enviando…");
      try { await enviarImagem(file); toast("Imagem enviada."); offset = 0; todos = []; await carregarG(); } catch (err) { toast(msgErro(err), "erro"); }
      carregando(b, false);
    };
    $("#g-grid").onclick = async (e) => {
      const fig = e.target.closest(".g-item"); if (!fig) return;
      const item = todos.find((i) => i.path === fig.dataset.path);
      if (e.target.closest("[data-copiar]")) { navigator.clipboard?.writeText(item.url); toast("Link copiado."); }
      if (e.target.closest("[data-apagar]")) {
        if (!(await confirmar("Excluir imagem?", "A imagem será apagada permanentemente do armazenamento.", "Excluir"))) return;
        const { count } = await sb.from("noticias").select("id", { count: "exact", head: true }).eq("imagem_path", item.path);
        if (count) return toast("Esta imagem passou a ser usada por uma notícia e não pode ser excluída.", "erro");
        const { error } = await sb.storage.from(BUCKET).remove([item.path]);
        if (error) return toast(msgErro(error), "erro");
        todos = todos.filter((i) => i !== item); fig.remove(); toast("Imagem excluída.");
      }
    };
    carregarG();
  }

  function abrirGaleria(aoEscolher) {
    const m = $("#picker"), grid = $("#picker-grid"), mais = $("#picker-more");
    m.hidden = false; grid.innerHTML = `<div class="loading"><span class="spinner"></span>Carregando imagens…</div>`;
    let offset = 0, todos = [];
    const fechar = () => { m.hidden = true; m.onclick = null; };
    const carregarP = async () => {
      try {
        const { itens, fim } = await listarImagens(offset);
        todos = todos.concat(itens); offset += 40;
        grid.innerHTML = todos.map((i) => cardImagem(i, "escolher")).join("") || `<div class="empty"><i data-lucide="images"></i><h3>Nenhuma imagem enviada ainda</h3><p>Use “Enviar imagem” no editor.</p></div>`;
        mais.hidden = fim; icons();
      } catch (e) { grid.innerHTML = `<div class="alert erro">${esc(msgErro(e))}</div>`; }
    };
    mais.onclick = carregarP;
    m.onclick = (e) => {
      if (e.target === m || e.target.closest("[data-close-picker]")) return fechar();
      const usar = e.target.closest("[data-usar]");
      if (usar) { const it = todos.find((i) => i.path === usar.closest(".g-item").dataset.path); aoEscolher({ url: it.url, path: it.path }); fechar(); }
    };
    carregarP();
  }
})();
