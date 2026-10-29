/* ==========================================================================
   APP.JS — o "motor" do site. Lê o config.js e desenha as páginas.
   Normalmente NÃO precisas de editar este ficheiro: o conteúdo está em
   config.js e o aspeto em style.css.
   ========================================================================== */

(() => {
  "use strict";

  /* ======================================================================
     1. TEMA CLARO/ESCURO (aplicado já, para não piscar ao carregar)
     ====================================================================== */

  const CHAVE_TEMA = "portfolio-tema";

  const lerTema = () => {
    try { return localStorage.getItem(CHAVE_TEMA); } catch { return null; }
  };
  const guardarTema = (tema) => {
    try { localStorage.setItem(CHAVE_TEMA, tema); } catch { /* sem armazenamento: ignora */ }
  };

  document.documentElement.dataset.theme =
    lerTema() || (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");

  /* Com suporte do navegador, o tema novo "abre" em círculo a partir do botão. */
  function alternarTema(evento) {
    const raiz = document.documentElement;
    const novo = raiz.dataset.theme === "dark" ? "light" : "dark";
    const aplicar = () => { raiz.dataset.theme = novo; guardarTema(novo); };

    const semMovimento = matchMedia("(prefers-reduced-motion: reduce)").matches || OPCOES.animacoes === false;
    const botao = evento && evento.currentTarget;
    if (!document.startViewTransition || semMovimento || !botao) return aplicar();

    const r = botao.getBoundingClientRect();
    const x = r.left + r.width / 2;
    const y = r.top + r.height / 2;
    const raio = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));

    raiz.classList.add("tema-vt");
    const transicao = document.startViewTransition(aplicar);
    transicao.ready
      .then(() => raiz.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${raio}px at ${x}px ${y}px)`] },
        { duration: 550, easing: "ease-in-out", pseudoElement: "::view-transition-new(root)" }))
      .catch(() => {});
    transicao.finished.finally(() => raiz.classList.remove("tema-vt"));
  }


  /* ======================================================================
     2. UTILITÁRIOS
     ====================================================================== */

  const $ = (seletor, raiz = document) => raiz.querySelector(seletor);

  const limitar = (n, min, max) => Math.min(max, Math.max(min, Number(n) || 0));

  const ehVideo = (ficheiro) => /\.(mp4|webm|mov|m4v|ogv)$/i.test(ficheiro || "");
  const ehPdf   = (ficheiro) => /\.pdf$/i.test(ficheiro || "");

  PASTAS.documentos ??= "Documentos/";      // pasta dos PDFs (se o config.js não a definir)

  /* Constrói o caminho: pasta + nome (ou devolve links completos tal como estão). */
  const caminho = (pasta, ficheiro) =>
    /^(https?:)?\/\//.test(ficheiro) ? ficheiro : PASTAS[pasta] + encodeURI(ficheiro);

  /* Cria um elemento: h("div", {class: "x", text: "olá"}, filho1, filho2) */
  function h(tag, props = {}, ...filhos) {
    const no = document.createElement(tag);
    for (const [chave, valor] of Object.entries(props)) {
      if (valor == null || valor === false) continue;
      if (chave === "class") no.className = valor;
      else if (chave === "text") no.textContent = valor;
      else if (chave.startsWith("on")) no.addEventListener(chave.slice(2), valor);
      else no.setAttribute(chave, valor === true ? "" : valor);
    }
    for (const filho of filhos.flat()) {
      if (filho != null && filho !== false) no.append(filho);
    }
    return no;
  }

  /* Ícones (SVG fixo, sem dados do utilizador) */
  const ICONES = {
    fechar: '<path d="M6 6l12 12M18 6L6 18"/>',
    esq:    '<path d="M15 5l-7 7 7 7"/>',
    dir:    '<path d="M9 5l7 7-7 7"/>',
    play:   '<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>',
    pdf:    '<path d="M14 3H7a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2V8z"/><path d="M14 3v5h5M9 13h6M9 17h4"/>',
    tema:   '<circle cx="12" cy="12" r="9"/><path d="M12 3a9 9 0 0 1 0 18z" fill="currentColor"/>',
  };

  function icone(nome, tamanho = 22) {
    const no = h("span", { class: "icone", "aria-hidden": "true" });
    no.innerHTML =
      `<svg viewBox="0 0 24 24" width="${tamanho}" height="${tamanho}" fill="none" ` +
      `stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">${ICONES[nome]}</svg>`;
    return no;
  }


  /* ======================================================================
     3. COMPONENTES REUTILIZÁVEIS
     ====================================================================== */

  /* Aviso para ficheiros que ainda não estão na pasta */
  function placeholder(pasta, ficheiro) {
    return h("div", { class: "ph", role: "img", "aria-label": "Ficheiro em falta" },
      h("span", { text: "Ficheiro não encontrado" }),
      h("code", { text: PASTAS[pasta] + ficheiro }));
  }

  function imagem(ficheiro, alt = "", pasta = "imagens") {
    if (!ficheiro) return placeholder(pasta, "(sem ficheiro definido)");
    const img = h("img", { src: caminho(pasta, ficheiro), alt, loading: "lazy", decoding: "async" });
    img.addEventListener("error", () => img.replaceWith(placeholder(pasta, ficheiro)), { once: true });
    return img;
  }

  /* Imagem ou vídeo, conforme a extensão */
  /* PDF: visualizador do navegador + botões para abrir e descarregar
     (em telemóveis o visualizador embutido é limitado, por isso os botões estão sempre visíveis) */
  function visualizadorPdf(ficheiro, titulo) {
    const url = caminho("documentos", ficheiro);
    const quadro = h("iframe", { class: "pdf-quadro", src: `${url}#view=FitH`, title: titulo || ficheiro, loading: "lazy" });
    /* Num servidor (ex.: GitHub Pages) dá para saber se o ficheiro existe */
    if (/^https?:/.test(location.protocol)) {
      fetch(url, { method: "HEAD" })
        .then((r) => { if (!r.ok) quadro.replaceWith(placeholder("documentos", ficheiro)); })
        .catch(() => {});
    }
    return h("div", { class: "pdf" }, quadro,
      h("div", { class: "pdf-acoes" },
        h("a", { class: "btn btn-principal", href: url, target: "_blank", rel: "noopener", text: "Abrir PDF" }),
        h("a", { class: "btn", href: url, download: "", text: "Descarregar" })));
  }

  function midia(ficheiro, alt = "") {
    if (ehPdf(ficheiro)) return visualizadorPdf(ficheiro, alt);
    if (!ehVideo(ficheiro)) return imagem(ficheiro, alt, "imagens");
    const video = h("video", { src: caminho("videos", ficheiro), controls: true, playsinline: true, preload: "metadata" });
    video.addEventListener("error", () => video.replaceWith(placeholder("videos", ficheiro)), { once: true });
    return video;
  }

  /* Nível 0-5 em studs */
  function studs(nivel) {
    const max = OPCOES.nivelMaximo;
    const n = Math.round(limitar(nivel, 0, max));
    return h("span", { class: "studs", role: "img", "aria-label": `Nível ${n} de ${max}` },
      Array.from({ length: max }, (_, i) => h("span", { class: "stud" + (i < n ? " on" : "") })));
  }

  function barra(percentagem, rotulo) {
    return h("div", {
      class: "barra", role: "progressbar", "aria-label": rotulo,
      "aria-valuemin": 0, "aria-valuemax": 100, "aria-valuenow": percentagem,
    }, h("span", { "data-p": `${percentagem}%` }));
  }

  function estadoBadge(info) {
    return h("span", { class: "estado", style: `--cor:${info.cor}`, text: info.texto });
  }

  /* Barra de filtros. opcoes: [{valor, texto, n}], o primeiro é o ativo. */
  function barraFiltros(opcoes, aoMudar, rotulo = "Filtros") {
    let atual = opcoes[0].valor;
    const botoes = opcoes.map((o) => h("button", {
      class: "filtro", type: "button", "data-valor": o.valor, "aria-pressed": String(o.valor === atual),
      onclick: () => {
        atual = o.valor;
        botoes.forEach((b) => b.setAttribute("aria-pressed", String(b.dataset.valor === atual)));
        aoMudar(atual);
      },
    }, o.texto, o.n != null ? h("span", { class: "contagem", text: o.n }) : null));
    return h("div", { class: "filtros", role: "group", "aria-label": rotulo }, botoes);
  }

  function cabecalhoPagina(conf) {
    return h("header", { class: "pagina-topo" },
      h("div", { class: "container" },
        h("h1", { text: conf.titulo }),
        conf.intro ? h("p", { class: "intro", text: conf.intro }) : null));
  }

  function mensagemVazia(texto) {
    return h("p", { class: "vazio", text: texto });
  }

  /* Diálogo modal nativo (fecha com Esc ou clicando fora) */
  function criarDialogo(classe, filhos) {
    const d = h("dialog", { class: classe }, filhos);
    d.addEventListener("click", (e) => { if (e.target === d) d.close(); });
    d.addEventListener("close", () => d.remove());
    document.body.append(d);
    d.showModal();
    return d;
  }

  function botaoFechar(dialogo, classeExtra = "") {
    return h("button", {
      class: `dlg-fechar ${classeExtra}`.trim(), type: "button", "aria-label": "Fechar",
      onclick: () => dialogo.close(),
    }, icone("fechar"));
  }


  /* ======================================================================
     4. TOPO, RODAPÉ E EFEITOS GERAIS
     ====================================================================== */

  function desenharTopo(paginaAtual) {
    const logo = h("img", { src: caminho("media", SITE.logo), alt: "", height: 32 });
    logo.addEventListener("error", () => logo.remove(), { once: true });

    const nav = h("nav", { class: "nav", "aria-label": "Principal" },
      PAGINAS.map((p) => h("a", {
        href: p.ficheiro, text: p.nome, "aria-current": p.id === paginaAtual ? "page" : null,
      })));

    const tema = h("button", {
      class: "btn-tema", type: "button", "aria-label": "Alternar entre tema claro e escuro",
      onclick: alternarTema,
    }, icone("tema", 20));

    const topo = $("#topo");
    topo.className = "topo";
    topo.append(h("div", { class: "container" },
      h("a", { class: "marca", href: PAGINAS[0].ficheiro }, logo, h("span", { text: SITE.nome })),
      nav, tema));
  }

  function desenharRodape() {
    const rodape = $("#rodape");
    rodape.className = "rodape";
    rodape.append(h("div", { class: "container",
      text: SITE.rodape.replace("{ano}", new Date().getFullYear()) }));
  }

  function definirMeta(tituloPagina) {
    document.title = `${tituloPagina} | ${SITE.nome}`;
    let desc = $('meta[name="description"]');
    if (!desc) { desc = h("meta", { name: "description" }); document.head.append(desc); }
    desc.setAttribute("content", SITE.descricao);

    let fav = $('link[rel~="icon"]');
    if (!fav) { fav = h("link", { rel: "icon" }); document.head.append(fav); }
    fav.setAttribute("href", caminho("media", SITE.favicon));
  }

  /* As barras de progresso enchem uma vez, ao abrir a página. */
  function animarBarras() {
    requestAnimationFrame(() => requestAnimationFrame(() => {
      document.querySelectorAll(".barra > span[data-p]").forEach((s) => s.style.setProperty("--p", s.dataset.p));
    }));
  }

  /* Studs do topo acendem à volta do rato */
  function campoStuds(el) {
    el.addEventListener("pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
    el.addEventListener("pointerleave", () => {
      el.style.removeProperty("--mx");
      el.style.removeProperty("--my");
    });
  }


  /* ======================================================================
     5. PÁGINA INICIAL
     ====================================================================== */

  /* Cada secção é uma função que devolve o seu conteúdo.
     Para criar uma secção nova: acrescenta aqui e em INICIO.secoes (config.js). */
  const BLOCOS_INICIO = {
    sobre: () => h("div", { class: "sobre" },
      h("div", {}, INICIO.sobre.map((t) => h("p", { text: t }))),
      INICIO.foto ? imagem(INICIO.foto, `Fotografia de ${SITE.nome}`, "media") : null),

    idiomas: () => h("ul", { class: "linhas" },
      INICIO.idiomas.map((i) => h("li", {},
        h("span", { text: i.nome }),
        h("span", { class: "nivel-texto", text: i.nivel })))),

    competencias: () => h("dl", { class: "grupos" },
      INICIO.competencias.map((g) => h("div", { class: "grupo" },
        h("dt", { text: g.grupo }),
        h("dd", {}, h("ul", { class: "etiquetas" },
          g.itens.map((item) => h("li", { class: "etiqueta", text: item }))))))),

    ferramentas: () => h("div", {},
      INICIO.legendaNiveis ? h("p", { class: "legenda", text: INICIO.legendaNiveis }) : null,
      h("ul", { class: "linhas duas" },
        INICIO.ferramentas.map((f) => h("li", {}, h("span", { text: f.nome }), studs(f.nivel))))),

    contacto: () => h("ul", { class: "contactos" },
      INICIO.contactos.map((c) => {
        const conteudo = [h("span", { class: "rotulo", text: c.nome }), h("span", { class: "valor", text: c.valor })];
        const link = /^[^\s@:\/]+@[^\s@]+\.[^\s@]+$/.test(c.link || "") ? "mailto:" + c.link : c.link;
        const externo = /^https?:/.test(link || "");
        return h("li", {}, link
          ? h("a", { class: "contacto-item", href: link, target: externo ? "_blank" : null, rel: externo ? "noopener" : null }, conteudo)
          : h("div", { class: "contacto-item" }, conteudo));
      })),
  };

  function renderInicio(main) {
    const hero = h("section", { class: "hero" },
      h("div", { class: "container" },
        h("p", { class: "hero-saudacao", text: INICIO.saudacao }),
        h("h1", { class: "hero-nome", text: SITE.nome }),
        h("p", { class: "hero-funcao", text: SITE.funcao }),
        h("p", { class: "hero-resumo", text: INICIO.resumo }),
        h("div", { class: "hero-acoes" },
          INICIO.botoes.map((b) => h("a", { class: "btn" + (b.principal ? " btn-principal" : ""), href: b.link, text: b.texto })))));
    campoStuds(hero);
    main.append(hero);

    for (const s of INICIO.secoes) {
      const bloco = BLOCOS_INICIO[s.id];
      if (!bloco) continue;
      main.append(h("section", { class: "secao", id: s.id },
        h("div", { class: "container secao-grelha" },
          h("h2", { text: s.titulo }),
          h("div", {}, bloco()))));
    }
  }


  /* ======================================================================
     6. CURSOS
     ====================================================================== */

  function progressoCurso(c) {
    if (Array.isArray(c.modulos) && c.modulos.length) {
      return Math.round((100 * c.modulos.filter((m) => m.feito).length) / c.modulos.length);
    }
    return Math.round(limitar(c.progresso, 0, 100));
  }

  function estadoCurso(c, p) {
    if (c.estado && ESTADOS_CURSO[c.estado]) return c.estado;
    if (p >= 100) return "concluido";
    return p <= 0 ? "planeado" : "em-curso";
  }

  function cartaoCurso(c) {
    const info = ESTADOS_CURSO[c._estado] || { texto: c._estado, cor: "#7B879B" };
    const feitos = (c.modulos || []).filter((m) => m.feito).length;

    return h("article", { class: "curso" },
      h("div", { class: "curso-topo" },
        h("div", {},
          h("h3", { text: c.titulo }),
          h("p", { class: "meta" },
            h("span", { text: c.instituicao }),
            c.inicio ? h("span", { text: `Início: ${c.inicio}` }) : null,
            c.fim ? h("span", { text: `Fim: ${c.fim}` }) : null)),
        estadoBadge(info)),
      h("div", { class: "progresso" },
        barra(c._p, `Progresso em ${c.titulo}`),
        h("span", { class: "pct", text: `${c._p}%` })),
      c.notas ? h("div", { class: "notas" }, [].concat(c.notas).map((t) => h("p", { text: t }))) : null,
      c.modulos && c.modulos.length
        ? h("details", {},
            h("summary", { text: `Módulos (${feitos} de ${c.modulos.length})` }),
            h("ul", { class: "modulos" },
              c.modulos.map((m) => h("li", { class: m.feito ? "feito" : "", text: m.nome }))))
        : null,
      c.certificado
        ? h("a", { class: "certificado", href: c.certificado, target: "_blank", rel: "noopener", text: "Ver certificado" })
        : null);
  }

  function renderCursos(main) {
    const lista = CURSOS.lista.map((c) => {
      const p = progressoCurso(c);
      return { ...c, _p: p, _estado: estadoCurso(c, p) };
    });

    if (!lista.length) {
      main.append(cabecalhoPagina(CURSOS),
        h("div", { class: "container" }, mensagemVazia("Ainda não há cursos. Acrescenta o primeiro na lista CURSOS, em config.js.")));
      return;
    }

    const media = Math.round(lista.reduce((soma, c) => soma + c._p, 0) / lista.length);
    const geral = h("div", { class: "geral" },
      h("div", { class: "geral-topo" }, h("span", { text: "Progresso geral" }), h("span", { text: `${media}%` })),
      barra(media, "Progresso geral em todos os cursos"));

    const opcoes = [
      { valor: "*", texto: "Todos", n: lista.length },
      ...Object.entries(ESTADOS_CURSO)
        .map(([chave, info]) => ({ valor: chave, texto: info.texto, n: lista.filter((c) => c._estado === chave).length }))
        .filter((o) => o.n > 0),
    ];

    const cartoes = lista.map(cartaoCurso);
    const filtros = barraFiltros(opcoes, (valor) => {
      cartoes.forEach((el, i) => { el.hidden = !(valor === "*" || lista[i]._estado === valor); });
    }, "Filtrar cursos por estado");

    main.append(cabecalhoPagina(CURSOS),
      h("div", { class: "container conteudo" }, geral, filtros, h("div", { class: "lista-cursos" }, cartoes)));
  }


  /* ======================================================================
     7. PROJETOS
     ====================================================================== */

  function cartaoProjeto(p) {
    const info = ESTADOS_PROJETO[p.estado];
    return h("article", { class: "cartao" },
      h("div", { class: "cartao-img" }, imagem(p.capa, "")),
      h("div", { class: "cartao-corpo" },
        h("h3", {}, h("button", { class: "cartao-abrir", type: "button", onclick: () => abrirProjeto(p), text: p.titulo })),
        info ? h("div", {}, estadoBadge(info)) : null,
        h("p", { text: p.resumo }),
        (p.etiquetas || []).length
          ? h("ul", { class: "etiquetas" }, p.etiquetas.map((t) => h("li", { class: "etiqueta", text: t })))
          : null));
  }

  function abrirProjeto(p) {
    const info = ESTADOS_PROJETO[p.estado];
    const itens = [p.video, p.capa, ...(p.imagens || [])].filter(Boolean);
    const palco = h("div", { class: "palco" });
    const miniaturas = h("div", { class: "miniaturas", role: "group", "aria-label": "Imagens do projeto" });

    function mostrar(i) {
      palco.replaceChildren(midia(itens[i], p.titulo));
      [...miniaturas.children].forEach((b, j) => b.setAttribute("aria-current", String(j === i)));
    }

    itens.forEach((f, i) => miniaturas.append(h("button", {
      class: "miniatura", type: "button", "aria-label": `Ver ${ehVideo(f) ? "vídeo" : ehPdf(f) ? "documento" : "imagem"} ${i + 1}`,
      onclick: () => mostrar(i),
    }, ehVideo(f) ? icone("play", 22) : ehPdf(f) ? icone("pdf", 22) : imagem(f, ""))));

    const dialogo = criarDialogo("projeto", h("div", { class: "proj-corpo" },
      h("div", { class: "proj-cab" },
        h("div", {}, h("h2", { text: p.titulo }), info ? estadoBadge(info) : null),
        botaoFechar({ close: () => dialogo.close() })),
      itens.length ? palco : null,
      itens.length > 1 ? miniaturas : null,
      p.descricao ? h("p", { text: p.descricao }) : null,
      (p.etiquetas || []).length
        ? h("ul", { class: "etiquetas" }, p.etiquetas.map((t) => h("li", { class: "etiqueta", text: t })))
        : null,
      (p.links || []).length
        ? h("div", { class: "proj-links" },
            p.links.map((l, i) => h("a", { class: "btn" + (i === 0 ? " btn-principal" : ""), href: l.url, target: "_blank", rel: "noopener", text: l.nome })))
        : null));

    if (itens.length) mostrar(0);
  }

  function renderProjetos(main) {
    const lista = PROJETOS.lista;

    if (!lista.length) {
      main.append(cabecalhoPagina(PROJETOS),
        h("div", { class: "container" }, mensagemVazia("Ainda não há projetos. Acrescenta o primeiro na lista PROJETOS, em config.js.")));
      return;
    }

    const etiquetas = [...new Set(lista.flatMap((p) => p.etiquetas || []))];
    const cartoes = lista.map(cartaoProjeto);
    const vazio = h("p", { class: "vazio", hidden: true, text: "Nenhum projeto corresponde à pesquisa." });
    let etiqueta = "*";
    let termo = "";

    function aplicar() {
      let visiveis = 0;
      lista.forEach((p, i) => {
        const texto = [p.titulo, p.resumo, ...(p.etiquetas || [])].join(" ").toLowerCase();
        const ok = (etiqueta === "*" || (p.etiquetas || []).includes(etiqueta)) && texto.includes(termo);
        cartoes[i].hidden = !ok;
        if (ok) visiveis++;
      });
      vazio.hidden = visiveis > 0;
    }

    const filtros = etiquetas.length > 1
      ? barraFiltros([{ valor: "*", texto: "Todos", n: lista.length },
          ...etiquetas.map((t) => ({ valor: t, texto: t, n: lista.filter((p) => (p.etiquetas || []).includes(t)).length }))],
          (v) => { etiqueta = v; aplicar(); }, "Filtrar projetos por etiqueta")
      : null;

    const pesquisa = h("input", {
      class: "pesquisa", type: "search", placeholder: "Pesquisar projetos", "aria-label": "Pesquisar projetos",
      oninput: (e) => { termo = e.target.value.trim().toLowerCase(); aplicar(); },
    });

    main.append(cabecalhoPagina(PROJETOS),
      h("div", { class: "container conteudo" },
        h("div", { class: "barra-ferramentas" }, filtros, pesquisa),
        h("div", { class: "grelha-cartoes" }, cartoes),
        vazio));
  }


  /* ======================================================================
     8. IMAGENS DE TRABALHO (galeria + lightbox)
     ====================================================================== */

  function miniaturaGaleria(item, aoAbrir) {
    const video = ehVideo(item.ficheiro);
    const pdf = ehPdf(item.ficheiro);

    let conteudo;
    if (pdf) {
      /* com "miniatura" mostra essa imagem; sem ela, mostra um cartão com o ícone e o título */
      conteudo = item.miniatura
        ? imagem(item.miniatura, "")
        : h("div", { class: "pdf-capa" }, icone("pdf", 56), h("span", { text: item.titulo || item.ficheiro }));
    } else if (video) {
      conteudo = h("video", { src: caminho("videos", item.ficheiro) + "#t=0.5", preload: "metadata", muted: true, playsinline: true, "aria-hidden": "true", tabindex: "-1" });
      conteudo.addEventListener("error", () => conteudo.replaceWith(placeholder("videos", item.ficheiro)), { once: true });
    } else {
      conteudo = imagem(item.ficheiro, "");
    }

    const tipo = pdf ? " (PDF)" : video ? " (vídeo)" : "";
    return h("button", {
      class: "mosaico-item", type: "button", onclick: aoAbrir,
      "aria-label": `${item.titulo || item.ficheiro}${tipo}: abrir em ponto grande`,
    },
      conteudo,
      pdf ? h("span", { class: "selo-video" }, icone("pdf", 14), "PDF") : null,
      video ? h("span", { class: "selo-video" }, icone("play", 14), "Vídeo") : null,
      item.titulo ? h("span", { class: "mosaico-legenda", text: item.titulo }) : null);
  }

  function abrirLightbox(lista, inicio) {
    let atual = inicio;
    const palco = h("div", { class: "lb-palco" });
    const titulo = h("strong");
    const legenda = h("span");
    const contador = h("span", { class: "lb-contador" });

    /* Carrega já as imagens vizinhas, para a navegação ser instantânea. */
    function precarregar(i) {
      const item = lista[(i + lista.length) % lista.length];
      if (item && !ehVideo(item.ficheiro) && !ehPdf(item.ficheiro)) new Image().src = caminho("imagens", item.ficheiro);
    }

    function ir(n) {
      atual = (n + lista.length) % lista.length;
      const item = lista[atual];
      palco.replaceChildren(midia(item.ficheiro, item.titulo || ""));
      titulo.textContent = item.titulo || "";
      legenda.textContent = item.legenda || "";
      contador.textContent = `${atual + 1} / ${lista.length}`;
      precarregar(atual + 1);
      precarregar(atual - 1);
      /* Aviso para o extras.js (slideshow, direção da animação, ecrã inteiro...) */
      document.dispatchEvent(new CustomEvent("lightbox:mudou", {
        detail: { dialogo, atual, total: lista.length },
      }));
    }

    const varios = lista.length > 1;
    const anterior = h("button", { class: "lb-nav lb-ant", type: "button", "aria-label": "Anterior", hidden: !varios, onclick: () => ir(atual - 1) }, icone("esq"));
    const seguinte = h("button", { class: "lb-nav lb-seg", type: "button", "aria-label": "Seguinte", hidden: !varios, onclick: () => ir(atual + 1) }, icone("dir"));

    const dialogo = criarDialogo("lightbox", [
      botaoFechar({ close: () => dialogo.close() }, "lb-fechar"),
      anterior,
      h("figure", { class: "lb-fig" }, palco, h("figcaption", {}, titulo, legenda, contador)),
      seguinte,
    ]);

    dialogo.addEventListener("keydown", (e) => {
      if (e.target.tagName === "VIDEO") return;     // não rouba as setas ao leitor de vídeo
      if (e.key === "ArrowLeft") ir(atual - 1);
      if (e.key === "ArrowRight") ir(atual + 1);
    });

    ir(atual);
  }

  function renderImagens(main) {
    const lista = GALERIA.lista;

    if (!lista.length) {
      main.append(cabecalhoPagina(GALERIA),
        h("div", { class: "container" }, mensagemVazia("Ainda não há imagens. Acrescenta a primeira na lista GALERIA, em config.js.")));
      return;
    }

    let visiveis = lista;
    const botoes = lista.map((item) => miniaturaGaleria(item, () => abrirLightbox(visiveis, visiveis.indexOf(item))));
    const categorias = [...new Set(lista.map((i) => i.categoria).filter(Boolean))];

    const filtros = categorias.length > 1
      ? barraFiltros([{ valor: "*", texto: "Todas", n: lista.length },
          ...categorias.map((c) => ({ valor: c, texto: c, n: lista.filter((i) => i.categoria === c).length }))],
          (v) => {
            visiveis = lista.filter((i) => v === "*" || i.categoria === v);
            botoes.forEach((b, i) => { b.hidden = !visiveis.includes(lista[i]); });
          }, "Filtrar por categoria")
      : null;

    main.append(cabecalhoPagina(GALERIA),
      h("div", { class: "container conteudo" }, filtros, h("div", { class: "mosaico" }, botoes)));
  }


  /* ======================================================================
     9. ARRANQUE
     ====================================================================== */

  /* Cada página do menu (id em PAGINAS) liga-se à função que a desenha. */
  const PAGINAS_RENDER = {
    inicio:   renderInicio,
    cursos:   renderCursos,
    projetos: renderProjetos,
    imagens:  renderImagens,
  };

  function iniciar() {
    const id = document.body.dataset.page;
    const pagina = PAGINAS.find((p) => p.id === id);
    const render = PAGINAS_RENDER[id];
    const main = $("#main");

    definirMeta(pagina ? pagina.nome : SITE.nome);
    desenharTopo(id);

    if (render) render(main);
    else main.append(h("div", { class: "container" }, mensagemVazia(`Página desconhecida: "${id}".`)));

    desenharRodape();
    animarBarras();
  }

  document.addEventListener("DOMContentLoaded", iniciar);
})();