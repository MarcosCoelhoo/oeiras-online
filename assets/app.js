(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const catBy = (slug) => OO.categorias.find((c) => c.slug === slug) || { slug, nome: "Notícias", icon: "newspaper" };
  const page = document.body.dataset.page;

  const esc = (s) => String(s ?? "").replace(/[&<>"']/g, (ch) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[ch]);
  const tempo = (iso) => {
    const h = Math.floor((Date.now() - new Date(iso)) / 36e5);
    if (h < 1) return "agora";
    if (h < 24) return `há ${h}h`;
    if (h < 24 * 7) return `há ${Math.floor(h / 24)}d`;
    return new Date(iso).toLocaleDateString("pt-BR", { day: "2-digit", month: "short", year: "numeric" });
  };
  const dataLonga = (iso) => new Date(iso).toLocaleString("pt-BR", { day: "2-digit", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });
  const link = (n) => `noticia.html?id=${encodeURIComponent(n.slug)}`;
  const catIcon = (c) => (c.logo ? `<img class="cat-logo" src="${c.logo}" alt="">` : `<i data-lucide="${c.icon}"></i>`);

  // ---------- Layout comum ----------
  const header = `
    <div class="utility">
      <div class="wrap">
        <span class="u-item"><i data-lucide="calendar"></i>${hoje}</span>
        <span class="u-item hide-sm"><i data-lucide="map-pin"></i>Oeiras do Pará — PA</span>
        <span class="u-item hide-sm"><i data-lucide="cloud-sun"></i>31°</span>
        <div class="u-social">
          <a href="${OO.INSTAGRAM}" target="_blank" rel="noopener" aria-label="Instagram do Oeiras OnLine"><i data-lucide="instagram"></i></a>
          <a href="#" aria-label="Facebook"><i data-lucide="facebook"></i></a>
          <a href="#" aria-label="YouTube"><i data-lucide="youtube"></i></a>
          <a href="#" aria-label="WhatsApp"><i data-lucide="message-circle"></i></a>
        </div>
      </div>
    </div>
    <header class="topbar" id="topbar">
      <div class="wrap">
        <a href="index.html" class="brand" aria-label="Oeiras OnLine — página inicial"><img src="${OO.LOGO}" alt="Oeiras OnLine"></a>
        <div class="actions">
          <button class="icon-btn" data-open="search" aria-label="Buscar"><i data-lucide="search"></i></button>
          <button class="icon-btn" data-share aria-label="Compartilhar"><i data-lucide="share-2"></i></button>
          <button class="icon-btn" data-open="drawer" aria-label="Menu"><i data-lucide="menu"></i></button>
        </div>
      </div>
      <nav class="catnav" aria-label="Editorias"><div class="wrap" id="catnav">
        <a href="index.html" class="${page === "home" ? "active" : ""}">Início</a>
        ${OO.categorias.map((c) => `<a href="noticias.html?cat=${c.slug}" data-cat="${c.slug}">${c.nome}</a>`).join("")}
        <div class="more-menu" id="more-menu" hidden>
          <button type="button" class="more-btn" aria-expanded="false" aria-haspopup="true">Mais <i data-lucide="chevron-down"></i></button>
          <div class="more-list" id="more-list"></div>
        </div>
      </div></nav>
    </header>
    <div class="search-box" id="search">
      <form action="noticias.html" role="search">
        <input name="q" placeholder="Buscar notícias, bairros, assuntos..." autocomplete="off" aria-label="Buscar notícias">
        <button class="icon-btn" type="submit" aria-label="Buscar"><i data-lucide="search"></i></button>
        <button class="icon-btn" type="button" data-close aria-label="Fechar"><i data-lucide="x"></i></button>
      </form>
    </div>
    <div class="overlay" id="overlay" data-close></div>
    <aside class="drawer" id="drawer" aria-label="Menu">
      <div class="dh"><img src="${OO.LOGO}" alt="Oeiras OnLine"><button class="icon-btn" data-close aria-label="Fechar"><i data-lucide="x"></i></button></div>
      <nav>
        <a href="index.html" class="hl"><span class="sq"><i data-lucide="house"></i></span>Início</a>
        <a href="noticias.html" class="hl"><span class="sq"><i data-lucide="newspaper"></i></span>Todas as notícias</a>
        ${OO.categorias.map((c) => `<a href="noticias.html?cat=${c.slug}"><span class="sq${c.logo ? " sq-logo" : ""}">${catIcon(c)}</span>${c.nome}</a>`).join("")}
        <a href="index.html#envie"><span class="sq" style="background:#22c55e"><i data-lucide="message-circle"></i></span>Envie sua pauta</a>
      </nav>
    </aside>`;

  const footer = `
    <footer class="site">
      <div class="wrap">
        <div class="grid">
          <div>
            <img class="logo" src="${OO.LOGO_BRANCO}" alt="Oeiras OnLine">
            <p style="margin-top:12px;max-width:360px">A notícia da nossa terra. Portal de notícias de Oeiras do Pará — notícias locais, serviços e comunicados em tempo real.</p>
            <div class="social">
              <a class="icon-btn" href="${OO.INSTAGRAM}" target="_blank" rel="noopener" aria-label="Instagram do Oeiras OnLine"><i data-lucide="instagram"></i></a>
              <a class="icon-btn" href="#" aria-label="Facebook"><i data-lucide="facebook"></i></a>
              <a class="icon-btn" href="#" aria-label="YouTube"><i data-lucide="youtube"></i></a>
              <a class="icon-btn" href="#" aria-label="WhatsApp"><i data-lucide="message-circle"></i></a>
            </div>
          </div>
          <div><h4>Editorias</h4><ul class="two-cols">${OO.categorias.map((c) => `<li><a href="noticias.html?cat=${c.slug}">${c.nome}</a></li>`).join("")}</ul></div>
          <div><h4>Institucional</h4><ul>
            <li><a href="#">Quem somos</a></li><li><a href="#">Anuncie aqui</a></li>
            <li><a href="index.html#envie">Fale com a redação</a></li><li><a href="#">Política de privacidade</a></li>
          </ul></div>
        </div>
        <div class="copy"><span>© ${new Date().getFullYear()} Oeiras OnLine. Todos os direitos reservados.</span><span>www.oeirasonline.com.br · Oeiras do Pará — PA</span></div>
      </div>
    </footer>
    <nav class="bottom-nav" aria-label="Navegação rápida">
      <a href="index.html" class="${page === "home" ? "on" : ""}"><i data-lucide="house"></i>Início</a>
      <a href="noticias.html" class="${page === "lista" ? "on" : ""}"><i data-lucide="newspaper"></i>Notícias</a>
      <a href="#" data-open="search"><i data-lucide="search"></i>Buscar</a>
      <a href="#" data-open="drawer"><i data-lucide="menu"></i>Menu</a>
    </nav>
    <div class="toast" id="toast" role="status" aria-live="polite"></div>`;

  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer);

  const topbar = $("#topbar");
  const onScroll = () => topbar.classList.toggle("solid", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const toast = (msg) => { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); setTimeout(() => t.classList.remove("on"), 2600); };
  OO.toast = toast;

  const closeAll = () => {
    ["#search", "#drawer", "#overlay"].forEach((s) => $(s).classList.remove("on"));
    $("#more-menu").classList.remove("open"); $("#more-menu .more-btn").setAttribute("aria-expanded", "false");
  };
  document.addEventListener("click", (e) => {
    const open = e.target.closest("[data-open]");
    if (open) {
      e.preventDefault(); closeAll();
      $("#" + open.dataset.open).classList.add("on"); $("#overlay").classList.add("on");
      if (open.dataset.open === "search") setTimeout(() => $("#search input").focus(), 200);
    }
    const more = e.target.closest(".more-btn");
    if (more) {
      const m = $("#more-menu"), on = !m.classList.contains("open");
      m.classList.toggle("open", on); more.setAttribute("aria-expanded", String(on));
    } else if (!e.target.closest(".more-list")) $("#more-menu").classList.remove("open");
    if (e.target.closest("[data-close]")) closeAll();
    if (e.target.closest("[data-share]")) {
      if (navigator.share) navigator.share({ title: document.title, url: location.href }).catch(() => {});
      else navigator.clipboard?.writeText(location.href).then(() => toast("Link copiado!"));
    }
  });
  addEventListener("keydown", (e) => e.key === "Escape" && closeAll());

  // Menu de editorias: o que não cabe na linha vai para "Mais"
  const catnav = $("#catnav"), moreMenu = $("#more-menu"), moreList = $("#more-list");
  const ajustarMenu = () => {
    if (getComputedStyle(catnav.parentElement).display === "none") return;
    moreList.querySelectorAll("a").forEach((a) => catnav.insertBefore(a, moreMenu));
    moreMenu.hidden = false;
    const links = [...catnav.querySelectorAll(":scope > a[data-cat]")];
    const limite = catnav.getBoundingClientRect().right - parseFloat(getComputedStyle(catnav).paddingRight);
    while (links.length && moreMenu.getBoundingClientRect().right > limite + 1) moreList.prepend(links.pop());
    moreMenu.hidden = !moreList.children.length;
  };
  let tAjuste; addEventListener("resize", () => { clearTimeout(tAjuste); tAjuste = setTimeout(ajustarMenu, 120); });
  document.fonts?.ready.then(ajustarMenu); ajustarMenu();
  const catAtual = new URLSearchParams(location.search).get("cat");
  if (catAtual) document.querySelectorAll(`#catnav a[data-cat="${CSS.escape(catAtual)}"]`).forEach((a) => a.classList.add("active"));

  // ---------- Componentes ----------
  const chip = (c) => `<span class="cat-chip">${esc(c.nome)}</span>`;
  const imgTag = (n, cls = "") => n.img
    ? `<img loading="lazy" class="${cls}" src="${esc(n.img)}" alt="${esc(n.legenda || "")}">`
    : `<span class="no-img ${cls}"><img src="${OO.SIMBOLO_BRANCO}" alt=""></span>`;
  OO.card = (n) => `<a class="card" href="${link(n)}">
      <div class="thumb">${imgTag(n)}${n.video || n.cat === "videos" ? '<span class="play-ov"><i data-lucide="circle-play"></i></span>' : ""}</div>
      <div class="body">${chip(catBy(n.cat))}<h3>${esc(n.titulo)}</h3><p>${esc(n.resumo)}</p>
        <div class="foot"><span class="time"><i data-lucide="clock-3"></i>${tempo(n.data)}</span><span class="read">Ler mais →</span></div>
      </div></a>`;
  OO.lead = (n) => `<a class="lead-story" href="${link(n)}">
      <div class="media">${imgTag(n)}</div>
      <div class="ov">${chip(catBy(n.cat))}<h3>${esc(n.titulo)}</h3><p>${esc(n.resumo)}</p>
        <span class="meta"><i data-lucide="clock-3"></i>${tempo(n.data)}</span></div></a>`;
  OO.catBy = catBy; OO.tempo = tempo; OO.esc = esc;

  const refreshIcons = () => window.lucide && lucide.createIcons();
  OO.icons = refreshIcons;
  const falha = (el, e) => { console.error(e); if (el) el.innerHTML = `<p class="empty">Não foi possível carregar as notícias agora. Tente novamente em instantes.</p>`; };

  // ---------- Home ----------
  if (page === "home") {
    // Acesso rápido
    $("#quick").innerHTML = OO.categorias.map((c) =>
      `<a href="noticias.html?cat=${c.slug}"><span class="ic${c.logo ? " ic-logo" : ""}">${catIcon(c)}</span>${c.nome}</a>`).join("");

    // Diretrizes da capa: manchete = destaque mais recente (ou a mais recente); ao lado, as 3 seguintes.
    // Essas notícias não se repetem em "Atualizações" nem no carrossel.
    let naCapa = [];
    (async () => {
      try {
        const [{ itens: recentes }, destaques] = await Promise.all([OO.api.listar({ limit: 8 }), OO.api.destaques(6)]);
        const manchete = destaques[0] || recentes[0];
        const lado = recentes.filter((n) => n.id !== manchete?.id).slice(0, 3);
        naCapa = [manchete, ...lado].filter(Boolean).map((n) => n.id);

        // Última hora
        const tk = recentes.slice(0, 6).map((n) => `<a href="${link(n)}">${esc(n.titulo)}</a>`).join("");
        if (tk) $("#ticker").innerHTML = tk + tk; else $(".ticker").remove();

        // Manchete
        const hero = $("#manchete");
        if (manchete) {
          hero.href = link(manchete);
          hero.innerHTML = `<div class="media">${imgTag(manchete).replace('loading="lazy"', 'fetchpriority="high"')}</div>
            <div class="hero-in">${chip(catBy(manchete.cat))}
              <h2 id="manchete-titulo">${esc(manchete.titulo)}</h2>
              <p>${esc(manchete.resumo)}</p>
              <span class="hero-meta"><span class="time"><i data-lucide="clock-3"></i>${tempo(manchete.data)}</span><span class="hero-cta">Ler matéria <i data-lucide="arrow-right"></i></span></span>
            </div>`;
        } else {
          hero.removeAttribute("href");
          hero.classList.add("hero-vazio");
          hero.innerHTML = `<div class="hero-in"><img class="hero-logo" src="assets/IDENTIDADE/logos/logo-vertical-branco.png" alt="Oeiras OnLine"><p>As notícias publicadas aparecerão aqui.</p></div>`;
        }
        const side = $("#hero-side");
        side.innerHTML = lado.map((n) => `<a class="side-item" href="${link(n)}">${imgTag(n, "side-thumb")}
            <div>${chip(catBy(n.cat))}<h3>${esc(n.titulo)}</h3><span class="time"><i data-lucide="clock-3"></i>${tempo(n.data)}</span></div></a>`).join("");
        side.hidden = !lado.length;
        $(".hero-grid").classList.toggle("solo", !lado.length);

        // Destaques do Dia (carrossel)
        const extras = destaques.filter((n) => !naCapa.includes(n.id)).map((n) => ({ tag: catBy(n.cat).nome.toUpperCase(), titulo: n.titulo, sub: n.resumo, link: link(n) }));
        montarCarrossel([...extras, OO.slideParticipe]);
      } catch (e) { falha($("#manchete"), e); montarCarrossel([OO.slideParticipe]); }
      iniciarAtualizacoes();
      refreshIcons();
    })();

    function montarCarrossel(lista) {
      const slides = $("#slides"), dots = $("#dots");
      slides.innerHTML = lista.map((d, i) => `<a class="slide ${i ? "" : "on"}" href="${esc(d.link)}"><div><span class="tag">${esc(d.tag)}</span><h3>${esc(d.titulo)}</h3><p>${esc(d.sub)}</p></div><span class="go"><i data-lucide="arrow-right"></i></span></a>`).join("");
      dots.innerHTML = lista.length > 1 ? lista.map((_, i) => `<button class="${i ? "" : "on"}" data-i="${i}" aria-label="Destaque ${i + 1}"></button>`).join("") : "";
      $("#prev").hidden = $("#next").hidden = lista.length < 2;
      let cur = 0, timer;
      const go = (i) => {
        cur = (i + lista.length) % lista.length;
        slides.querySelectorAll(".slide").forEach((s, k) => s.classList.toggle("on", k === cur));
        dots.querySelectorAll("button").forEach((b, k) => b.classList.toggle("on", k === cur));
        clearInterval(timer); if (lista.length > 1) timer = setInterval(() => go(cur + 1), 5000);
      };
      dots.onclick = (e) => e.target.dataset.i && go(+e.target.dataset.i);
      $("#prev").onclick = () => go(cur - 1); $("#next").onclick = () => go(cur + 1);
      go(0); refreshIcons();
    }

    // Atualizações com filtro por editoria e paginação
    function iniciarAtualizacoes() {
      let filtro = "", offset = 0, carregadas = [];
      const POR_PAGINA = 7, filters = $("#filters"), more = $("#more");
      filters.innerHTML = `<button class="on" data-f="">Todas</button>` + OO.categorias.map((c) => `<button data-f="${c.slug}">${c.nome}</button>`).join("");
      const carregar = async (reset) => {
        if (reset) { offset = 0; carregadas = []; $("#lead").innerHTML = ""; $("#cards").innerHTML = `<div class="loading"><span class="spinner"></span>Carregando notícias…</div>`; }
        more.disabled = true;
        try {
          const { itens, total } = await OO.api.listar({ cat: filtro || undefined, limit: POR_PAGINA, offset, excluir: filtro ? [] : naCapa });
          carregadas = carregadas.concat(itens); offset += itens.length;
          const [primeira, ...resto] = carregadas;
          $("#lead").innerHTML = primeira ? OO.lead(primeira) : "";
          $("#cards").innerHTML = resto.map(OO.card).join("") ||
            (primeira ? "" : `<p class="empty">${filtro ? `Ainda não há notícias publicadas em ${esc(catBy(filtro).nome)}.` : "Nenhuma outra notícia publicada ainda."}</p>`);
          more.style.display = offset < total ? "" : "none";
        } catch (e) { falha($("#cards"), e); more.style.display = "none"; }
        more.disabled = false; refreshIcons();
      };
      filters.addEventListener("click", (e) => {
        const b = e.target.closest("button"); if (!b) return;
        filters.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
        filtro = b.dataset.f; carregar(true);
      });
      more.onclick = () => carregar(false);
      carregar(true);
    }

    // Sidebar
    OO.api.maisLidas(5).then((lista) => {
      $("#rank").innerHTML = lista.map((n) => `<a href="${link(n)}">${esc(n.titulo)}</a>`).join("") || `<p class="empty-sm">Sem notícias ainda.</p>`;
    }).catch((e) => falha($("#rank"), e));
    $("#phones").innerHTML = OO.telefones.map((t) => `<a href="tel:${t.numero}"><i data-lucide="${t.icon}"></i><div><span class="n">${t.numero}</span><small>${t.nome}</small></div></a>`).join("");

    // Guia e mural
    $("#guia").innerHTML = OO.guia.map((g) => `<div><i data-lucide="${g.icon}"></i><div><h4>${g.titulo}</h4><p>${g.texto}</p></div></div>`).join("");
    $("#mural").innerHTML = OO.mural.map((m) => `<div class="msg"><p>${m.texto}</p><div class="who"><i>${m.nome[0]}</i>${m.nome} · ${m.data}</div></div>`).join("");

    // Formulário de pauta
    $("#pauta").addEventListener("submit", (e) => { e.preventDefault(); e.target.reset(); toast("Obrigado! Sua pauta foi enviada para a redação."); });
  }

  // ---------- Listagem / categoria / busca ----------
  if (page === "lista") {
    const p = new URLSearchParams(location.search);
    const cat = p.get("cat") || "", q = (p.get("q") || "").trim();
    const c = cat ? OO.categorias.find((x) => x.slug === cat) : null;
    const head = $("#page-head");
    if (c) {
      head.classList.add("cat-hero");
      head.innerHTML = `${c.logo ? `<img class="cat-hero-logo" src="${c.logo}" alt="Logotipo ${esc(c.nome)}">` : `<span class="cat-hero-ic"><i data-lucide="${c.icon}"></i></span>`}
        <div><span class="kicker">Editoria</span><h1>${esc(c.nome)}</h1><p>${esc(c.descricao || "")}</p><p class="count" id="total"></p></div>`;
    } else {
      head.innerHTML = `<h1>${q ? `Busca: “${esc(q)}”` : "Todas as notícias"}</h1><p id="total"></p>`;
    }
    document.title = `${q ? "Busca" : c ? c.nome : "Notícias"} — Oeiras OnLine`;
    if (q) $("#search input").value = q;
    $("#filters").innerHTML = `<a href="noticias.html" class="f ${!cat ? "on" : ""}">Todas</a>` +
      OO.categorias.map((x) => `<a href="noticias.html?cat=${x.slug}" class="f ${x.slug === cat ? "on" : ""}">${x.nome}</a>`).join("");
    $("#filters .on")?.scrollIntoView({ block: "nearest", inline: "center" });

    let offset = 0; const POR_PAGINA = 12, more = $("#more");
    const carregar = async () => {
      more.disabled = true;
      if (!offset) $("#cards").innerHTML = `<div class="loading"><span class="spinner"></span>Carregando notícias…</div>`;
      try {
        const { itens, total } = await OO.api.listar({ cat: cat || undefined, q, limit: POR_PAGINA, offset });
        if (!offset) $("#cards").innerHTML = "";
        $("#cards").insertAdjacentHTML("beforeend", itens.map(OO.card).join(""));
        offset += itens.length;
        $("#total").textContent = `${total} ${total === 1 ? "notícia" : "notícias"}`;
        if (!total) $("#cards").innerHTML = `<div class="empty-state"><i data-lucide="newspaper"></i><h3>${q ? "Nenhuma notícia encontrada" : "Ainda não há notícias aqui"}</h3><p>${q ? "Tente buscar com outras palavras." : c ? `As notícias de ${esc(c.nome)} aparecerão aqui assim que forem publicadas.` : "As notícias publicadas aparecerão aqui."}</p><a class="btn ghost" href="index.html">Voltar para o início</a></div>`;
        more.style.display = offset < total ? "" : "none";
      } catch (e) { falha($("#cards"), e); more.style.display = "none"; }
      more.disabled = false; refreshIcons();
    };
    more.onclick = carregar;
    carregar();
  }

  // ---------- Notícia ----------
  if (page === "noticia") {
    const p = new URLSearchParams(location.search);
    const preview = p.has("preview");
    const limpar = (html) => (window.DOMPurify ? DOMPurify.sanitize(html || "", { ADD_ATTR: ["target"] }) : esc(html));
    const mostrar = (n) => {
      const c = catBy(n.cat);
      document.title = `${n.titulo} — Oeiras OnLine`;
      $("#crumbs").innerHTML = `<a href="index.html">Início</a><i data-lucide="chevron-right"></i><a href="noticias.html?cat=${c.slug}">${esc(c.nome)}</a>`;
      $("#chip").innerHTML = chip(c);
      $("#t").textContent = n.titulo;
      $("#sub").textContent = n.subtitulo || n.resumo;
      $("#autor").textContent = n.autor;
      const palavras = (n.conteudo || "").replace(/<[^>]+>/g, " ").split(/\s+/).filter(Boolean).length;
      $("#quando").innerHTML = `<time datetime="${esc(n.data)}">${dataLonga(n.data)}</time> · ${Math.max(1, Math.round(palavras / 200))} min de leitura`;
      const fig = $("#capa");
      if (n.img) { fig.hidden = false; $("#hero-img").src = n.img; $("#hero-img").alt = n.legenda || ""; $("#legenda").textContent = n.legenda || ""; $("#legenda").hidden = !n.legenda; }
      else fig.hidden = true;
      $("#corpo").innerHTML = limpar(n.conteudo);
      $("#corpo").querySelectorAll("a[href^='http']").forEach((a) => { a.target = "_blank"; a.rel = "noopener"; });
      refreshIcons();
    };
    (async () => {
      try {
        if (preview) {
          let n = null; try { n = JSON.parse(localStorage.getItem("oo-preview") || "null"); } catch {}
          document.body.insertAdjacentHTML("afterbegin", `<div class="preview-bar"><i data-lucide="eye"></i> PRÉVIA — esta notícia ainda não está publicada</div>`);
          if (!n) throw new Error("Prévia indisponível");
          mostrar(n); $("#related-block").hidden = true; return;
        }
        const n = await OO.api.obter(p.get("id") || "");
        if (!n) {
          document.title = "Notícia não encontrada — Oeiras OnLine";
          $("article.inner").innerHTML = `<div class="empty-state"><i data-lucide="file-x"></i><h3>Notícia não encontrada</h3><p>Ela pode ter sido removida ou ainda não foi publicada.</p><a class="btn ghost" href="index.html">Voltar para o início</a></div>`;
          $("#related-block").hidden = true; refreshIcons(); return;
        }
        mostrar(n);
        OO.api.registrarVisualizacao(n.id).catch(() => {});
        const [mesma, outras] = await Promise.all([
          OO.api.listar({ cat: n.cat, limit: 4, excluir: [n.id] }),
          OO.api.listar({ limit: 4, excluir: [n.id] }),
        ]);
        const vistos = new Set(); const rel = [...mesma.itens, ...outras.itens].filter((x) => !vistos.has(x.id) && vistos.add(x.id)).slice(0, 4);
        $("#related").innerHTML = rel.map(OO.card).join(""); $("#related-block").hidden = !rel.length;
        refreshIcons();
      } catch (e) { falha($("article.inner"), e); }
    })();
  }

  refreshIcons();
})();
