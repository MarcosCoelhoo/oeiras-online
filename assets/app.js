(() => {
  const $ = (s, el = document) => el.querySelector(s);
  const catBy = (slug) => OO.categorias.find((c) => c.slug === slug) || OO.categorias[0];
  const page = document.body.dataset.page;

  const tempo = (h) => (h < 1 ? "agora" : h < 24 ? `há ${h}h` : `há ${Math.floor(h / 24)}d`);
  const hoje = new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "2-digit", month: "long" });

  // ---------- Layout comum ----------
  const header = `
    <div class="utility">
      <div class="wrap">
        <span class="u-item"><i data-lucide="calendar"></i>${hoje}</span>
        <span class="u-item hide-sm"><i data-lucide="map-pin"></i>Oeiras do Pará — PA</span>
        <span class="u-item hide-sm"><i data-lucide="cloud-sun"></i>31°</span>
        <div class="u-social">
          <a href="#" aria-label="Instagram"><i data-lucide="instagram"></i></a>
          <a href="#" aria-label="Facebook"><i data-lucide="facebook"></i></a>
          <a href="#" aria-label="YouTube"><i data-lucide="youtube"></i></a>
          <a href="#" aria-label="WhatsApp"><i data-lucide="message-circle"></i></a>
        </div>
      </div>
    </div>
    <header class="topbar" id="topbar">
      <div class="wrap">
        <a href="index.html" class="brand" aria-label="Oeiras OnLine"><img src="${OO.LOGO}" alt="Oeiras OnLine"></a>
        <div class="actions">
          <button class="icon-btn" data-open="search" aria-label="Buscar"><i data-lucide="search"></i></button>
          <button class="icon-btn" data-share aria-label="Compartilhar"><i data-lucide="share-2"></i></button>
          <button class="icon-btn" data-open="drawer" aria-label="Menu"><i data-lucide="menu"></i></button>
        </div>
      </div>
      <nav class="catnav"><div class="wrap">
        <a href="index.html" class="${page === "home" ? "active" : ""}">Início</a>
        ${OO.categorias.map((c) => `<a href="noticias.html?cat=${c.slug}">${c.nome}</a>`).join("")}
        <a href="index.html#aovivo" class="live-link"><i data-lucide="radio"></i>Ao vivo</a>
      </div></nav>
    </header>
    <div class="search-box" id="search">
      <form action="noticias.html">
        <input name="q" placeholder="Buscar notícias, bairros, assuntos..." autocomplete="off">
        <button class="icon-btn" type="submit" aria-label="Buscar"><i data-lucide="search"></i></button>
        <button class="icon-btn" type="button" data-close aria-label="Fechar"><i data-lucide="x"></i></button>
      </form>
    </div>
    <div class="overlay" id="overlay" data-close></div>
    <aside class="drawer" id="drawer">
      <div class="dh"><img src="${OO.LOGO}" alt="Oeiras OnLine"><button class="icon-btn" data-close aria-label="Fechar"><i data-lucide="x"></i></button></div>
      <nav>
        <a href="index.html" class="hl"><span class="sq"><i data-lucide="house"></i></span>Início</a>
        <a href="noticias.html" class="hl"><span class="sq"><i data-lucide="newspaper"></i></span>Todas as notícias</a>
        ${OO.categorias.map((c) => `<a href="noticias.html?cat=${c.slug}"><span class="sq"><i data-lucide="${c.icon}"></i></span>${c.nome}</a>`).join("")}
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
              <a class="icon-btn" href="#" aria-label="Instagram"><i data-lucide="instagram"></i></a>
              <a class="icon-btn" href="#" aria-label="Facebook"><i data-lucide="facebook"></i></a>
              <a class="icon-btn" href="#" aria-label="YouTube"><i data-lucide="youtube"></i></a>
              <a class="icon-btn" href="#" aria-label="WhatsApp"><i data-lucide="message-circle"></i></a>
            </div>
          </div>
          <div><h4>Editorias</h4><ul>${OO.categorias.slice(0, 6).map((c) => `<li><a href="noticias.html?cat=${c.slug}">${c.nome}</a></li>`).join("")}</ul></div>
          <div><h4>Institucional</h4><ul>
            <li><a href="#">Quem somos</a></li><li><a href="#">Anuncie aqui</a></li>
            <li><a href="index.html#envie">Fale com a redação</a></li><li><a href="#">Política de privacidade</a></li>
          </ul></div>
        </div>
        <div class="copy"><span>© ${new Date().getFullYear()} Oeiras OnLine. Todos os direitos reservados.</span><span>Oeiras do Pará — PA</span></div>
      </div>
    </footer>
    <nav class="bottom-nav">
      <a href="index.html" class="${page === "home" ? "on" : ""}"><i data-lucide="house"></i>Início</a>
      <a href="noticias.html" class="${page === "lista" ? "on" : ""}"><i data-lucide="newspaper"></i>Notícias</a>
      <a href="index.html#aovivo" class="live"><span class="bubble"><i data-lucide="radio"></i></span>Ao vivo</a>
      <a href="#" data-open="search"><i data-lucide="search"></i>Buscar</a>
      <a href="#" data-open="drawer"><i data-lucide="menu"></i>Menu</a>
    </nav>
    <div class="toast" id="toast"></div>`;

  document.body.insertAdjacentHTML("afterbegin", header);
  document.body.insertAdjacentHTML("beforeend", footer);

  const topbar = $("#topbar");
  const onScroll = () => topbar.classList.toggle("solid", scrollY > 40);
  addEventListener("scroll", onScroll, { passive: true }); onScroll();

  const toast = (msg) => { const t = $("#toast"); t.textContent = msg; t.classList.add("on"); setTimeout(() => t.classList.remove("on"), 2600); };
  OO.toast = toast;

  const closeAll = () => ["#search", "#drawer", "#overlay"].forEach((s) => $(s).classList.remove("on"));
  document.addEventListener("click", (e) => {
    const open = e.target.closest("[data-open]");
    if (open) {
      e.preventDefault(); closeAll();
      $("#" + open.dataset.open).classList.add("on"); $("#overlay").classList.add("on");
      if (open.dataset.open === "search") setTimeout(() => $("#search input").focus(), 200);
    }
    if (e.target.closest("[data-close]")) closeAll();
    if (e.target.closest("[data-share]")) {
      if (navigator.share) navigator.share({ title: document.title, url: location.href }).catch(() => {});
      else navigator.clipboard?.writeText(location.href).then(() => toast("Link copiado!"));
    }
  });
  addEventListener("keydown", (e) => e.key === "Escape" && closeAll());

  // ---------- Componentes ----------
  const chip = (c) => `<span class="cat-chip">${c.nome}</span>`;
  OO.card = (n) => {
    const c = catBy(n.cat);
    return `<a class="card" href="noticia.html?id=${n.id}">
      <div class="thumb"><img loading="lazy" src="${n.img}" alt="">${n.video ? '<span class="play-ov"><i data-lucide="circle-play"></i></span>' : ""}</div>
      <div class="body">${chip(c)}<h3>${n.titulo}</h3><p>${n.resumo}</p>
        <div class="foot"><span class="time"><i data-lucide="clock-3"></i>${tempo(n.horas)}</span><span class="read">Ler mais →</span></div>
      </div></a>`;
  };
  OO.lead = (n) => `<a class="lead-story" href="noticia.html?id=${n.id}"><img src="${n.img.replace("900/560", "1400/800")}" alt="">
      <div class="ov">${chip(catBy(n.cat))}<h3 style="margin-top:10px">${n.titulo}</h3><p>${n.resumo}</p></div></a>`;
  OO.catBy = catBy; OO.tempo = tempo;

  const refreshIcons = () => window.lucide && lucide.createIcons();
  OO.icons = refreshIcons;

  // ---------- Home ----------
  if (page === "home") {
    // Ticker
    const items = OO.urgentes.map((t) => `<span>${t}</span>`).join("");
    $("#ticker").innerHTML = items + items;

    // Acesso rápido
    $("#quick").innerHTML = OO.categorias.map((c) =>
      `<a href="noticias.html?cat=${c.slug}"><span class="ic"><i data-lucide="${c.icon}"></i></span>${c.nome}</a>`).join("");

    // Destaques (carrossel)
    const slides = $("#slides"), dots = $("#dots");
    slides.innerHTML = OO.destaques.map((d, i) => `<a class="slide ${i ? "" : "on"}" href="${d.link}"><div><span class="tag">${d.tag}</span><h3>${d.titulo}</h3><p>${d.sub}</p></div><span class="go"><i data-lucide="arrow-right"></i></span></a>`).join("");
    dots.innerHTML = OO.destaques.map((_, i) => `<button class="${i ? "" : "on"}" data-i="${i}" aria-label="Destaque ${i + 1}"></button>`).join("");
    let cur = 0, timer;
    const go = (i) => {
      cur = (i + OO.destaques.length) % OO.destaques.length;
      slides.querySelectorAll(".slide").forEach((s, k) => s.classList.toggle("on", k === cur));
      dots.querySelectorAll("button").forEach((b, k) => b.classList.toggle("on", k === cur));
      clearInterval(timer); timer = setInterval(() => go(cur + 1), 5000);
    };
    dots.addEventListener("click", (e) => e.target.dataset.i && go(+e.target.dataset.i));
    $("#prev").onclick = () => go(cur - 1); $("#next").onclick = () => go(cur + 1);
    go(0);

    // Notícias com filtro
    let filtro = "todas", qtd = 7;
    const filters = $("#filters");
    filters.innerHTML = `<button class="on" data-f="todas">Todas</button>` + OO.categorias.map((c) => `<button data-f="${c.slug}">${c.nome}</button>`).join("");
    const render = () => {
      const lista = OO.noticias.filter((n) => filtro === "todas" || n.cat === filtro);
      const [primeira, ...resto] = lista;
      $("#lead").innerHTML = primeira ? OO.lead(primeira) : "";
      $("#cards").innerHTML = resto.slice(0, qtd - 1).map(OO.card).join("") || (primeira ? "" : `<p class="empty">Nenhuma notícia nesta editoria ainda.</p>`);
      $("#more").style.display = lista.length > qtd ? "" : "none";
      refreshIcons();
    };
    filters.addEventListener("click", (e) => {
      const b = e.target.closest("button"); if (!b) return;
      filters.querySelectorAll("button").forEach((x) => x.classList.toggle("on", x === b));
      filtro = b.dataset.f; qtd = 7; render();
    });
    $("#more").onclick = () => { qtd += 6; render(); };
    render();

    // Sidebar
    $("#rank").innerHTML = [...OO.noticias].sort((a, b) => b.views - a.views).slice(0, 5).map((n) => `<a href="noticia.html?id=${n.id}">${n.titulo}</a>`).join("");
    $("#phones").innerHTML = OO.telefones.map((t) => `<a href="tel:${t.numero}"><i data-lucide="${t.icon}"></i><div><span class="n">${t.numero}</span><small>${t.nome}</small></div></a>`).join("");

    // Instagram
    $("#insta").innerHTML = Array.from({ length: 6 }, (_, i) => `<img loading="lazy" src="https://picsum.photos/seed/oeiras-ig${i}/400/400" alt="">`).join("");

    // Colunistas, guia, mural
    $("#cols").innerHTML = OO.colunistas.map((c) => `<div class="col-card"><img src="${c.img}" alt=""><h3>${c.nome}</h3><small>${c.area}</small><p>“${c.frase}”</p></div>`).join("");
    $("#guia").innerHTML = OO.guia.map((g) => `<div><i data-lucide="${g.icon}"></i><div><h4>${g.titulo}</h4><p>${g.texto}</p></div></div>`).join("");
    $("#mural").innerHTML = OO.mural.map((m) => `<div class="msg"><p>${m.texto}</p><div class="who"><i>${m.nome[0]}</i>${m.nome} · ${m.data}</div></div>`).join("");

    // Player ao vivo (demonstrativo)
    const live = $("#aovivo");
    live.querySelector(".play").onclick = () => {
      const on = live.classList.toggle("playing");
      live.querySelector(".play").innerHTML = `<i data-lucide="${on ? "pause" : "play"}"></i>`;
      refreshIcons();
      toast(on ? "Transmissão ao vivo (demonstração)" : "Transmissão pausada");
    };

    // Formulário de pauta (sem login)
    $("#pauta").addEventListener("submit", (e) => { e.preventDefault(); e.target.reset(); toast("Obrigado! Sua pauta foi enviada para a redação."); });
  }

  // ---------- Listagem ----------
  if (page === "lista") {
    const p = new URLSearchParams(location.search);
    const cat = p.get("cat"), q = (p.get("q") || "").trim().toLowerCase();
    const c = cat && catBy(cat);
    $("#titulo").innerHTML = q ? `Busca: “${p.get("q")}”` : c ? `<span class="text-grad">${c.nome}</span>` : "Todas as notícias";
    document.title = `${q ? "Busca" : c ? c.nome : "Notícias"} — Oeiras OnLine`;
    const lista = OO.noticias.filter((n) => (!cat || n.cat === cat) && (!q || (n.titulo + n.resumo).toLowerCase().includes(q)));
    $("#total").textContent = `${lista.length} ${lista.length === 1 ? "notícia" : "notícias"}`;
    $("#filters").innerHTML = `<a href="noticias.html" class="f ${!cat ? "on" : ""}">Todas</a>` +
      OO.categorias.map((x) => `<a href="noticias.html?cat=${x.slug}" class="f ${x.slug === cat ? "on" : ""}">${x.nome}</a>`).join("");
    $("#cards").innerHTML = lista.map(OO.card).join("") || `<p class="empty">Nenhuma notícia encontrada.</p>`;
  }

  // ---------- Notícia ----------
  if (page === "noticia") {
    const id = +new URLSearchParams(location.search).get("id") || 1;
    const n = OO.noticias.find((x) => x.id === id) || OO.noticias[0];
    const c = catBy(n.cat);
    document.title = `${n.titulo} — Oeiras OnLine`;
    $("#hero-img").src = n.img.replace("900/560", "1600/900");
    $("#crumbs").innerHTML = `<a href="index.html">Início</a><i data-lucide="chevron-right"></i><a href="noticias.html?cat=${c.slug}">${c.nome}</a>`;
    $("#chip").outerHTML = chip(c);
    $("#t").textContent = n.titulo;
    $("#sub").textContent = n.resumo;
    $("#autor").textContent = n.autor;
    $("#quando").textContent = `Publicado ${tempo(n.horas)} · ${Math.max(2, Math.round(n.titulo.length / 25))} min de leitura`;
    $("#related").innerHTML = OO.noticias.filter((x) => x.id !== n.id).sort((a, b) => (b.cat === n.cat) - (a.cat === n.cat)).slice(0, 4).map(OO.card).join("");
  }

  refreshIcons();
})();
