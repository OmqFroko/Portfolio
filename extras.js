/* ==========================================================================
   EXTRAS.JS — efeitos e interatividade extra. Corre depois do app.js.

   Cada efeito é uma função independente e tem uma linha na tabela EFEITOS,
   no fim do ficheiro. Liga/desliga-os em OPCOES.efeitos (config.js).
   Os números para afinar (velocidades, tamanhos, tempos) estão em AJUSTES.
   ========================================================================== */

(() => {
  "use strict";

  /* ======================================================================
     AJUSTES — números para afinar
     ====================================================================== */

  const AJUSTES = {
    avisoMs: 2200,                  // quanto tempo o aviso ("Copiado") fica visível

    scrollTopoApos: 600,            // px de scroll para aparecer o botão ↑

    revelarAtrasoMs: 60,            // atraso entre itens que aparecem juntos
    revelarLimpezaMs: 1000,         // tira as classes de animação depois disto
    contagemMs: 900,                // duração da contagem das percentagens

    /* Texto que se escreve sozinho (tempos em ms) */
    escrever: { letra: 70, apagar: 35, pausaCheio: 1700, pausaVazio: 350 },

    /* Campo de studs do topo da página inicial */
    studs: {
      raio: 5.5,                    // tamanho base de cada stud (px)
      aumentoMax: 3.2,              // quanto cresce um stud iluminado (px)
      raioLuz: 220,                 // alcance da luz do rato (px)
      suavizar: 0.16,               // 0 a 1: quanto mais baixo, mais "arrasta" a luz
      repousoX: 0.74,               // onde a luz fica quando o rato sai (fração da largura)
      repousoY: 0.4,                // ... e da altura
      ondaVelocidade: 460,          // px por segundo
      ondaDuracaoS: 1.7,            // segundos até a onda desaparecer
      ondaLargura: 46,              // espessura da onda (px)
      ondaInicialMs: 350,           // atraso da onda de boas-vindas (0 = sem onda)
    },

    /* Títulos: a letra onde o rato passa ganha uma cor e volta ao normal passado algum tempo */
    titulos: {
      paleta: ["#3B82F6", "#D97706", "#059669", "#E11D48", "#9333EA", "#0891B2", "#DB2777"],
      voltaAposMs: 2500,            // passado este tempo, a letra volta à cor normal
      transicaoMs: 300,             // duração da mudança de cor
    },

    cartoes: { inclinacaoMax: 5 },  // graus de inclinação dos cartões de projeto
    filtroCascataMax: 12,           // máx. de itens com atraso crescente ao filtrar
    slideshowMs: 4000,              // tempo de cada imagem no slideshow
    flipMs: 450,                    // duração da troca de ordem das ferramentas
  };

  const SELETORES = {
    revelar: ".secao, .curso, .cartao, .geral, .mosaico-item",
    cascata: ".lista-cursos, .grelha-cartoes, .mosaico",
    titulos: ".hero-nome, .marca span, .pagina-topo h1, .secao h2",   // títulos com o efeito das cores
  };


  /* ======================================================================
     UTILITÁRIOS
     ====================================================================== */

  const $  = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];

  const el = (tag, classe, texto) => {
    const n = document.createElement(tag);
    if (classe) n.className = classe;
    if (texto) n.textContent = texto;
    return n;
  };

  const esperar = (ms) => new Promise((ok) => setTimeout(ok, ms));

  const reduzido = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const comRato  = matchMedia("(hover: hover) and (pointer: fine)").matches;

  /* "animar" é falso se o utilizador pediu menos movimento ou se desligaste as animações. */
  const animar = OPCOES.animacoes !== false && !reduzido;

  const SVG = (caminhos) =>
    `<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" ` +
    `stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${caminhos}</svg>`;

  const ICONES = {
    play:   SVG('<path d="M8 5v14l11-7z" fill="currentColor" stroke="none"/>'),
    pausa:  SVG('<path d="M8 5v14M16 5v14"/>'),
    ecra:   SVG('<path d="M4 9V4h5M20 9V4h-5M4 15v5h5M20 15v5h-5"/>'),
    sair:   SVG('<path d="M9 4v5H4M15 4v5h5M9 20v-5H4M15 20v-5h5"/>'),
  };

  /* Aviso curto no fundo do ecrã */
  let temporizadorAviso;
  function aviso(texto) {
    let t = $(".toast");
    if (!t) { t = el("div", "toast"); t.setAttribute("role", "status"); document.body.append(t); }
    t.textContent = texto;
    t.classList.add("on");
    clearTimeout(temporizadorAviso);
    temporizadorAviso = setTimeout(() => t.classList.remove("on"), AJUSTES.avisoMs);
  }

  /* Corre uma função (no máximo uma vez por frame) quando a página rola */
  function aoRolar(fn) {
    let espera = false;
    addEventListener("scroll", () => {
      if (espera) return;
      espera = true;
      requestAnimationFrame(() => { espera = false; fn(); });
    }, { passive: true });
    fn();
  }


  /* ======================================================================
     1. SCROLL: barra de progresso e botão "voltar ao topo"
     ====================================================================== */

  function barraScroll() {
    const barra = el("div", "scroll-barra");
    barra.setAttribute("aria-hidden", "true");
    document.body.append(barra);
    aoRolar(() => {
      const max = document.documentElement.scrollHeight - innerHeight;
      barra.style.transform = `scaleX(${max > 0 ? scrollY / max : 0})`;
    });
  }

  function botaoTopo() {
    const b = el("button", "btn-topo", "↑");
    b.type = "button";
    b.setAttribute("aria-label", "Voltar ao topo");
    b.addEventListener("click", () => scrollTo({ top: 0, behavior: reduzido ? "auto" : "smooth" }));
    document.body.append(b);
    aoRolar(() => b.classList.toggle("on", scrollY > AJUSTES.scrollTopoApos));
  }


  /* ======================================================================
     2. ENTRADA: revelar ao rolar, contar percentagens, studs a acender
     ====================================================================== */

  /* Secções e cartões aparecem ao rolar (a classe sai depois, para não estragar os :hover) */
  function revelarAoRolar() {
    if (!animar || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entradas) => entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      const n = e.target;
      n.classList.add("rv-in");
      io.unobserve(n);
      setTimeout(() => { n.classList.remove("rv", "rv-in"); n.style.removeProperty("--atraso"); }, AJUSTES.revelarLimpezaMs);
    }), { threshold: 0.1 });

    $$(SELETORES.revelar).forEach((n, i) => {
      n.classList.add("rv");
      n.style.setProperty("--atraso", `${(i % 6) * AJUSTES.revelarAtrasoMs}ms`);
      io.observe(n);
    });
  }

  /* Percentagens dos cursos contam de 0 até ao valor */
  function contarPercentagens() {
    if (!animar || !("IntersectionObserver" in window)) return;
    $$(".pct, .geral-topo span:last-child").forEach((n) => {
      const alvo = parseInt(n.textContent, 10);
      if (isNaN(alvo)) return;
      n.textContent = "0%";
      const io = new IntersectionObserver(([e], obs) => {
        if (!e.isIntersecting) return;
        obs.disconnect();
        const t0 = performance.now();
        const passo = (t) => {
          const k = Math.min(1, (t - t0) / AJUSTES.contagemMs);
          n.textContent = `${Math.round(alvo * (1 - Math.pow(1 - k, 3)))}%`;
          if (k < 1) requestAnimationFrame(passo);
        };
        requestAnimationFrame(passo);
      });
      io.observe(n);
    });
  }

  /* Os níveis das ferramentas acendem um a um quando a lista aparece */
  function studsAnimados() {
    if (!animar || !("IntersectionObserver" in window)) return;
    const grupos = $$(".studs");
    if (!grupos.length) return;
    const io = new IntersectionObserver((entradas) => entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      e.target.classList.add("studs-in");
      io.unobserve(e.target);
    }), { threshold: 0.6 });
    grupos.forEach((g, gi) => {
      g.classList.add("studs-anim");
      g.style.setProperty("--g", gi);
      $$(".stud", g).forEach((s, i) => s.style.setProperty("--i", i));
      io.observe(g);
    });
  }


  /* ======================================================================
     3. TOPO DA PÁGINA INICIAL: studs em canvas, função que se escreve, letras
     ====================================================================== */

  /* Os studs do fundo reagem ao rato; clicar (ou tocar) cria uma onda. */
  function campoStuds() {
    const hero = $(".hero");
    if (!hero) return;
    const S = AJUSTES.studs;

    const canvas = el("canvas", "hero-canvas");
    canvas.setAttribute("aria-hidden", "true");
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    Object.assign(canvas.style, {                 // posição no próprio elemento: não depende do extras.css
      position: "absolute", inset: "0", width: "100%", height: "100%", zIndex: "-1", display: "block",
    });
    hero.prepend(canvas);
    hero.classList.add("tem-canvas");

    const raiz = document.documentElement;
    const passo = parseFloat(getComputedStyle(raiz).getPropertyValue("--grelha-studs")) || 28;
    const cores = { base: "#dde3eb", luz: "#2457f0" };
    const luz = { x: 0, y: 0, alvoX: 0, alvoY: 0 };
    const ondas = [];
    let largura = 0, altura = 0;
    let visivel = true, aCorrer = false;

    function lerCores() {
      const cs = getComputedStyle(raiz);
      cores.base = cs.getPropertyValue("--stud-fundo").trim() || cores.base;
      cores.luz  = cs.getPropertyValue("--destaque").trim() || cores.luz;
    }

    function medir() {
      const r = hero.getBoundingClientRect();
      const dpr = Math.min(devicePixelRatio || 1, 2);
      largura = r.width;
      altura = r.height;
      canvas.width = Math.round(largura * dpr);
      canvas.height = Math.round(altura * dpr);
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      if (!luz.alvoX && !luz.alvoY) {
        luz.x = luz.alvoX = largura * S.repousoX;
        luz.y = luz.alvoY = altura * S.repousoY;
      }
      desenhar(performance.now());
    }

    function desenhar(agora) {
      ctx.clearRect(0, 0, largura, altura);
      for (let i = ondas.length - 1; i >= 0; i--) {
        if ((agora - ondas[i].t0) / 1000 > S.ondaDuracaoS) ondas.splice(i, 1);
      }
      const colunas = Math.ceil(largura / passo) + 1;
      const linhas = Math.ceil(altura / passo) + 1;
      const x0 = (largura - (colunas - 1) * passo) / 2;

      for (let j = 0; j < linhas; j++) {
        for (let i = 0; i < colunas; i++) {
          const x = x0 + i * passo;
          const y = passo / 2 + j * passo;

          let forca = 0;
          const d = Math.hypot(x - luz.x, y - luz.y);
          if (d < S.raioLuz) forca = Math.pow(1 - d / S.raioLuz, 1.6);

          for (const o of ondas) {
            const e = (agora - o.t0) / 1000;
            const k = (Math.hypot(x - o.x, y - o.y) - e * S.ondaVelocidade) / S.ondaLargura;
            forca = Math.max(forca, Math.exp(-k * k) * (1 - e / S.ondaDuracaoS));
          }

          ctx.beginPath();
          ctx.arc(x, y, S.raio + forca * S.aumentoMax, 0, Math.PI * 2);
          ctx.fillStyle = cores.base;
          ctx.fill();
          if (forca > 0.03) {
            ctx.globalAlpha = Math.min(0.9, forca * 1.1);
            ctx.fillStyle = cores.luz;
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
      }
    }

    function quadro(agora) {
      aCorrer = false;
      luz.x += (luz.alvoX - luz.x) * S.suavizar;
      luz.y += (luz.alvoY - luz.y) * S.suavizar;
      const mexe = Math.abs(luz.alvoX - luz.x) > 0.4 || Math.abs(luz.alvoY - luz.y) > 0.4;
      if (!mexe) { luz.x = luz.alvoX; luz.y = luz.alvoY; }
      desenhar(agora);
      if (mexe || ondas.length) pedir();
    }

    function pedir() {
      if (aCorrer || !visivel) return;
      aCorrer = true;
      requestAnimationFrame(quadro);
    }

    const local = (e) => {
      const r = hero.getBoundingClientRect();
      return { x: e.clientX - r.left, y: e.clientY - r.top };
    };

    lerCores();
    medir();
    new ResizeObserver(medir).observe(hero);
    new MutationObserver(() => { lerCores(); desenhar(performance.now()); })
      .observe(raiz, { attributes: true, attributeFilter: ["data-theme"] });

    if (!animar) return;   // sem movimento: fica desenhado, parado, no ponto de repouso

    new IntersectionObserver(([e]) => { visivel = e.isIntersecting; if (visivel) pedir(); }).observe(hero);

    hero.addEventListener("pointermove", (e) => {
      const p = local(e);
      luz.alvoX = p.x; luz.alvoY = p.y;
      pedir();
    }, { passive: true });

    hero.addEventListener("pointerleave", () => {
      luz.alvoX = largura * S.repousoX;
      luz.alvoY = altura * S.repousoY;
      pedir();
    });

    hero.addEventListener("pointerdown", (e) => {
      if (e.target.closest("a, button")) return;
      const p = local(e);
      ondas.push({ x: p.x, y: p.y, t0: performance.now() });
      pedir();
    });

    if (S.ondaInicialMs > 0) {
      setTimeout(() => {
        ondas.push({ x: largura * 0.18, y: altura * 0.45, t0: performance.now() });
        pedir();
      }, S.ondaInicialMs);
    }
  }

  /* A função por baixo do nome escreve-se e apaga-se, passando pela lista INICIO.funcoes */
  function funcoesAlternadas() {
    const alvo = $(".hero-funcao");
    const lista = (INICIO.funcoes || []).filter(Boolean);
    if (!alvo || lista.length < 2 || !animar) return;   // sem animação, fica o texto normal

    const fixo = alvo.textContent;
    alvo.textContent = "";
    const leitor = el("span", "so-leitor", fixo);          // leitores de ecrã leem o texto completo
    const visual = el("span", "tipo");
    visual.setAttribute("aria-hidden", "true");
    const texto = el("span", "tipo-texto");
    visual.append(texto, el("span", "tipo-cursor"));
    alvo.append(leitor, visual);

    const T = AJUSTES.escrever;
    (async () => {
      for (let i = 0; alvo.isConnected; i = (i + 1) % lista.length) {
        const frase = lista[i];
        for (let c = 1; c <= frase.length; c++) { texto.textContent = frase.slice(0, c); await esperar(T.letra); }
        await esperar(T.pausaCheio);
        for (let c = frase.length - 1; c >= 0; c--) { texto.textContent = frase.slice(0, c); await esperar(T.apagar); }
        await esperar(T.pausaVazio);
      }
    })();
  }

  /* Cada letra do nome é um elemento: entram em cascata e saltam ao passar o rato */
  function letrasNome() {
    const titulo = $(".hero-nome");
    if (!titulo) return;
    const nome = titulo.textContent;
    titulo.setAttribute("aria-label", nome);
    titulo.textContent = "";

    let n = 0;
    nome.split(" ").forEach((palavra, i, todas) => {
      const p = el("span", "palavra");        // a palavra não parte a meio em ecrãs pequenos
      p.setAttribute("aria-hidden", "true");
      for (const c of palavra) {
        const l = el("span", "letra", c);
        l.style.setProperty("--i", n++);
        p.append(l);
      }
      titulo.append(p);
      if (i < todas.length - 1) titulo.append(" ");
    });
  }


  /* Ao passar o rato por um título, só a letra onde o rato está ganha uma cor; passados uns segundos, volta ao normal. */
  function titulosColoridos() {
    if (OPCOES.animacoes === false) return;     // mudar de cor não é movimento: só o interruptor geral a desliga
    const T = AJUSTES.titulos;
    let ultima = -1;
    const escolherCor = () => {                                  // ao acaso, mas nunca a mesma duas vezes seguidas
      let i;
      do { i = Math.floor(Math.random() * T.paleta.length); } while (i === ultima && T.paleta.length > 1);
      ultima = i;
      return T.paleta[i];
    };

    /* Entrada em cascata dos títulos quando aparecem no ecrã (o nome do topo tem a sua própria) */
    const io = animar && "IntersectionObserver" in window
      ? new IntersectionObserver((entradas) => entradas.forEach((e) => {
          if (!e.isIntersecting) return;
          e.target.classList.add("titulo-in");
          io.unobserve(e.target);
        }), { threshold: 0.4 })
      : null;

    $$(SELETORES.titulos).forEach((titulo) => {
      let letras = $$(".letra, .letra-t", titulo);      // o nome do topo já vem dividido em letras

      if (!letras.length) {
        const texto = titulo.textContent;
        titulo.textContent = "";
        titulo.append(el("span", "so-leitor", texto));     // leitores de ecrã leem o texto inteiro
        texto.split(" ").forEach((palavra, i, todas) => {
          const p = el("span", "palavra");
          p.setAttribute("aria-hidden", "true");
          for (const c of palavra) p.append(el("span", "letra-t", c));
          titulo.append(p);
          if (i < todas.length - 1) titulo.append(" ");
        });
        letras = $$(".letra-t", titulo);
        letras.forEach((l, i) => l.style.setProperty("--i", Math.min(i, 24)));   // atraso da entrada em cascata
        if (io && !titulo.closest(".marca")) { titulo.classList.add("titulo-anim"); io.observe(titulo); }
      }

      /* Cada letra tem o seu próprio temporizador. As cores vão direto no elemento (estilo
         inline), por isso o efeito funciona só com o extras.js. */
      const temporizadores = new WeakMap();

      const colorir = (letra) => {
        if (!letra.style.color) {                                   // ainda sem cor: escolhe a seguinte da paleta
          letra.style.transition = reduzido
            ? "none"
            : `color ${T.transicaoMs}ms ease, transform .4s cubic-bezier(.3,1.7,.5,1)`;
          letra.style.color = escolherCor();
        }
        clearTimeout(temporizadores.get(letra));                    // se voltares a passar, o tempo recomeça
        temporizadores.set(letra, setTimeout(() => { letra.style.color = ""; }, T.voltaAposMs));
      };

      // "over" borbulha, por isso um só ouvinte no título apanha todas as letras
      ["pointerover", "mouseover", "pointerdown"].forEach((ev) => titulo.addEventListener(ev, (e) => {
        const letra = e.target.closest?.(".letra, .letra-t");
        if (letra && titulo.contains(letra)) colorir(letra);
      }));
    });
    console.info(`[extras v7] títulos coloridos ligados em ${$$(SELETORES.titulos).length} títulos`);
  }


  /* ======================================================================
     4. NAVEGAÇÃO: índice lateral com secção atual
     ====================================================================== */

  function indiceLateral() {
    const hero = $(".hero");
    const secoes = $$(".secao[id]");
    if (!hero || secoes.length < 2 || !("IntersectionObserver" in window)) return;

    hero.id = hero.id || "topo-pagina";
    const alvos = [
      { id: hero.id, nome: "Início", no: hero },
      ...secoes.map((s) => {
        const h2 = $("h2", s);
        // o título pode já estar dividido em letras: o texto limpo está no .so-leitor
        const nome = h2 ? ($(".so-leitor", h2)?.textContent || h2.textContent) : s.id;
        return { id: s.id, nome, no: s };
      }),
    ];

    const nav = el("nav", "indice");
    nav.setAttribute("aria-label", "Secções da página");
    const ligacoes = new Map();
    alvos.forEach((a) => {
      const l = el("a", "indice-ponto");
      l.href = `#${a.id}`;
      l.append(el("span", "indice-rotulo", a.nome), el("span", "indice-bola"));
      nav.append(l);
      ligacoes.set(a.id, l);
    });
    document.body.append(nav);

    const io = new IntersectionObserver((entradas) => entradas.forEach((e) => {
      if (!e.isIntersecting) return;
      ligacoes.forEach((l, id) => l.toggleAttribute("aria-current", id === e.target.id));
      ligacoes.get(e.target.id)?.setAttribute("aria-current", "true");
    }), { rootMargin: "-45% 0px -50% 0px" });
    alvos.forEach((a) => io.observe(a.no));
  }


  /* ======================================================================
     5. CARTÕES: luz que segue o rato e inclinação
     ====================================================================== */

  function cartoesInterativos() {
    if (!comRato) return;
    const max = AJUSTES.cartoes.inclinacaoMax;

    document.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const c = e.target.closest?.(".cartao, .curso");
      if (!c) return;
      const r = c.getBoundingClientRect();
      const px = (e.clientX - r.left) / r.width;
      const py = (e.clientY - r.top) / r.height;
      c.style.setProperty("--mx", `${px * 100}%`);
      c.style.setProperty("--my", `${py * 100}%`);
      if (animar && c.classList.contains("cartao")) {
        c.style.setProperty("--ry", `${(px - 0.5) * 2 * max}deg`);
        c.style.setProperty("--rx", `${-(py - 0.5) * 2 * max}deg`);
      }
    }, { passive: true });

    document.addEventListener("pointerout", (e) => {
      const c = e.target.closest?.(".cartao");
      if (c && !c.contains(e.relatedTarget)) { c.style.removeProperty("--rx"); c.style.removeProperty("--ry"); }
    });
  }


  /* ======================================================================
     6. FILTROS: entrada em cascata e filtro no endereço
     ====================================================================== */

  /* Ao mudar de filtro, os itens que ficam entram um a um */
  function animarFiltros() {
    if (!animar) return;
    document.addEventListener("click", (e) => {
      if (!e.target.closest(".filtro[data-valor]")) return;
      const lista = $(SELETORES.cascata);
      if (!lista) return;
      [...lista.children].filter((n) => !n.hidden).forEach((n, i) => {
        n.style.setProperty("--i", i % AJUSTES.filtroCascataMax);
        n.classList.remove("entra");
        void n.offsetWidth;                      // reinicia a animação
        n.classList.add("entra");
        setTimeout(() => n.classList.remove("entra"), 900);
      });
    });
  }

  /* O filtro escolhido fica no endereço (ex.: imagens.html#GFX) e pode ser partilhado */
  function filtrosNoUrl() {
    const botoes = $$(".filtro[data-valor]");
    if (!botoes.length) return;
    botoes.forEach((b) => b.addEventListener("click", () => {
      const v = b.dataset.valor;
      history.replaceState(null, "", v === "*" ? location.pathname + location.search : `#${encodeURIComponent(v)}`);
    }));
    let alvo = "";
    try { alvo = decodeURIComponent(location.hash.slice(1)); } catch { /* hash inválido */ }
    botoes.find((b) => b.dataset.valor === alvo)?.click();
  }


  /* ======================================================================
     7. CONTEÚDO: contactos, ferramentas, cursos
     ====================================================================== */

  /* Contactos: botão para copiar (útil para o Discord, que não tem link) */
  function contactos() {
    $$(".contactos li").forEach((li) => {
      const valor = $(".valor", li)?.textContent;
      if (!valor) return;
      const b = el("button", "copiar", "Copiar");
      b.type = "button";
      b.setAttribute("aria-label", `Copiar ${valor}`);
      b.addEventListener("click", async () => {
        try { await navigator.clipboard.writeText(valor); aviso(`Copiado: ${valor}`); }
        catch { aviso("Não foi possível copiar"); }
      });
      li.append(b);
    });
  }

  /* Ferramentas: dica com o nível + botão para ordenar por nível (com animação) */
  function ferramentas() {
    const ul = $("#ferramentas .linhas");
    if (!ul) return;
    const itens = $$("li", ul);
    itens.forEach((li) => {
      li._n = $$(".stud.on", li).length;
      li.title = `Nível ${li._n} de ${$$(".stud", li).length}`;
    });

    const b = el("button", "filtro", "Ordenar por nível");
    b.type = "button";
    b.setAttribute("aria-pressed", "false");
    b.addEventListener("click", () => {
      const ligado = b.getAttribute("aria-pressed") !== "true";
      b.setAttribute("aria-pressed", String(ligado));

      const antes = new Map(itens.map((li) => [li, li.getBoundingClientRect()]));
      (ligado ? [...itens].sort((a, c) => c._n - a._n) : itens).forEach((li) => ul.append(li));

      if (!animar) return;
      itens.forEach((li) => {                   // técnica FLIP: cada item desliza do sítio antigo
        const a = antes.get(li), d = li.getBoundingClientRect();
        const dx = a.left - d.left, dy = a.top - d.top;
        if (dx || dy) li.animate(
          [{ transform: `translate(${dx}px, ${dy}px)` }, { transform: "none" }],
          { duration: AJUSTES.flipMs, easing: "cubic-bezier(.2,.8,.2,1)" });
      });
    });

    const grupo = el("div", "filtros");
    grupo.append(b);
    ul.before(grupo);
  }

  /* Cursos: expandir/recolher todos os módulos e "ler mais" nas notas */
  function cursos() {
    const dets = $$(".curso details");
    dets.forEach((d) => $$(".modulos li", d).forEach((li, i) => li.style.setProperty("--i", i)));

    const filtros = $(".filtros");
    if (dets.length > 1 && filtros) {
      const b = el("button", "filtro", "Expandir módulos");
      b.type = "button";
      const sync = () => { b.textContent = dets.every((d) => d.open) ? "Recolher módulos" : "Expandir módulos"; };
      b.addEventListener("click", () => {
        const abrir = !dets.every((d) => d.open);
        dets.forEach((d) => { d.open = abrir; });
        sync();
      });
      dets.forEach((d) => d.addEventListener("toggle", sync));
      filtros.append(b);
    }

    $$(".curso .notas").forEach((bloco) => {
      const extra = $$("p", bloco).slice(2);
      if (!extra.length) return;
      extra.forEach((p) => { p.hidden = true; });
      const b = el("button", "ler-mais", "Ler mais");
      b.type = "button";
      b.setAttribute("aria-expanded", "false");
      b.addEventListener("click", () => {
        const abrir = b.getAttribute("aria-expanded") !== "true";
        extra.forEach((p) => { p.hidden = !abrir; });
        b.setAttribute("aria-expanded", String(abrir));
        b.textContent = abrir ? "Ler menos" : "Ler mais";
      });
      bloco.append(b);
    });
  }


  /* ======================================================================
     8. LIGHTBOX: deslizar, ampliar, slideshow, ecrã inteiro, direção
     ====================================================================== */

  function lightboxExtra() {
    const estados = new WeakMap();                 // diálogo -> {anterior, aCorrer, timer, parar}
    const aberto = () => $("dialog.lightbox[open]");

    /* Deslizar no telemóvel */
    let x0 = null;
    document.addEventListener("pointerdown", (e) => {
      x0 = e.pointerType === "touch" && e.target.closest(".lightbox .lb-palco") ? e.clientX : null;
    });
    document.addEventListener("pointerup", (e) => {
      if (x0 == null) return;
      const dx = e.clientX - x0;
      x0 = null;
      if (Math.abs(dx) > 60) $(dx < 0 ? ".lb-seg" : ".lb-ant")?.click();
    });

    /* Clicar na imagem amplia, a partir do ponto clicado */
    document.addEventListener("click", (e) => {
      const img = e.target.closest(".lightbox .lb-palco img");
      if (!img) return;
      const r = img.getBoundingClientRect();
      img.style.transformOrigin = `${((e.clientX - r.left) / r.width) * 100}% ${((e.clientY - r.top) / r.height) * 100}%`;
      img.classList.toggle("zoom");
    });

    /* Slideshow */
    function agendar(dialogo, s) {
      clearTimeout(s.timer);
      s.parar?.();
      s.parar = null;
      if (!s.aCorrer) return;
      if ($(".lb-palco .pdf", dialogo)) { definirSlideshow(s, false); return; }   // um PDF lê-se com calma: o slideshow pára
      const seguinte = () => $(".lb-seg", dialogo)?.click();
      s.timer = setTimeout(() => {
        const video = $(".lb-palco video", dialogo);
        if (video && !video.paused) {              // se o vídeo estiver a tocar, espera que acabe
          video.addEventListener("ended", seguinte, { once: true });
          s.parar = () => video.removeEventListener("ended", seguinte);
        } else seguinte();
      }, AJUSTES.slideshowMs);
    }

    function definirSlideshow(s, ligado) {
      s.aCorrer = ligado;
      s.botaoPlay.innerHTML = ligado ? ICONES.pausa : ICONES.play;
      s.botaoPlay.setAttribute("aria-pressed", String(ligado));
      s.botaoPlay.setAttribute("aria-label", ligado ? "Parar slideshow" : "Iniciar slideshow");
    }

    function alternarSlideshow(dialogo) {
      const s = estados.get(dialogo);
      definirSlideshow(s, !s.aCorrer);
      agendar(dialogo, s);
    }

    function alternarEcraInteiro(dialogo) {
      if (document.fullscreenElement) document.exitFullscreen();
      else dialogo.requestFullscreen?.().catch(() => {});
    }

    function montar(dialogo, total) {
      const s = { anterior: 0, aCorrer: false, timer: null, parar: null };
      const barra = el("div", "lb-ferramentas");

      if (total > 1) {
        s.botaoPlay = el("button", "dlg-fechar");
        s.botaoPlay.type = "button";
        s.botaoPlay.innerHTML = ICONES.play;
        s.botaoPlay.setAttribute("aria-label", "Iniciar slideshow");
        s.botaoPlay.setAttribute("aria-pressed", "false");
        s.botaoPlay.title = "Slideshow (P)";
        s.botaoPlay.addEventListener("click", () => alternarSlideshow(dialogo));
        barra.append(s.botaoPlay);
      }
      if (document.fullscreenEnabled) {
        const b = el("button", "dlg-fechar");
        b.type = "button";
        b.innerHTML = ICONES.ecra;
        b.setAttribute("aria-label", "Ecrã inteiro");
        b.title = "Ecrã inteiro (F)";
        b.addEventListener("click", () => alternarEcraInteiro(dialogo));
        barra.append(b);
        const sync = () => {
          const ligado = document.fullscreenElement === dialogo;
          b.innerHTML = ligado ? ICONES.sair : ICONES.ecra;
          b.setAttribute("aria-label", ligado ? "Sair do ecrã inteiro" : "Ecrã inteiro");
        };
        document.addEventListener("fullscreenchange", sync);
        dialogo.addEventListener("close", () => document.removeEventListener("fullscreenchange", sync));
      }
      dialogo.append(barra);
      dialogo.addEventListener("close", () => { clearTimeout(s.timer); s.parar?.(); });
      estados.set(dialogo, s);
      return s;
    }

    /* O app.js avisa sempre que a imagem do lightbox muda */
    document.addEventListener("lightbox:mudou", (e) => {
      const { dialogo, atual, total } = e.detail;
      let s = estados.get(dialogo);
      if (!s) { s = montar(dialogo, total); s.anterior = atual; }

      const delta = atual - s.anterior;
      const palco = $(".lb-palco", dialogo);
      palco.classList.remove("lb-dir", "lb-esq");
      if (delta) palco.classList.add(delta === 1 || delta === -(total - 1) ? "lb-dir" : "lb-esq");
      s.anterior = atual;

      agendar(dialogo, s);
    });

    /* Teclas P (slideshow) e F (ecrã inteiro) com o lightbox aberto */
    document.addEventListener("keydown", (e) => {
      const d = aberto();
      if (!d || e.ctrlKey || e.metaKey || e.altKey || e.target.tagName === "VIDEO") return;
      const k = e.key.toLowerCase();
      if (k === "p" && estados.get(d)?.botaoPlay) alternarSlideshow(d);
      if (k === "f") alternarEcraInteiro(d);
    });
  }


  /* ======================================================================
     9. TECLADO: atalhos gerais
     ====================================================================== */

  function atalhos() {
    const tema = $(".btn-tema");
    if (tema) { tema.title = "Alternar tema (T)"; tema.setAttribute("aria-keyshortcuts", "T"); }
    const pesquisa = $(".pesquisa");
    if (pesquisa) pesquisa.title = "Atalho: /";

    document.addEventListener("keydown", (e) => {
      if (e.ctrlKey || e.metaKey || e.altKey) return;
      if (e.target.closest?.("input, textarea, select, [contenteditable]")) return;
      if ($("dialog[open]")) return;                // com um diálogo aberto, as teclas são dele
      if (e.key === "/" && pesquisa) { e.preventDefault(); pesquisa.focus(); }
      else if (e.key.toLowerCase() === "t") tema?.click();
    });
  }


  /* ======================================================================
     TABELA DE EFEITOS — uma linha por efeito
       id        -> nome em OPCOES.efeitos (config.js)
       fn        -> função que o liga
       movimento -> true se só faz sentido com animações ligadas
     ====================================================================== */

  const EFEITOS = [
    { id: "barraScroll",        fn: barraScroll,        movimento: false },
    { id: "botaoTopo",          fn: botaoTopo,          movimento: false },
    { id: "letrasNome",         fn: letrasNome,         movimento: true  },   // antes dos outros efeitos do topo
    { id: "titulosColoridos",   fn: titulosColoridos,   movimento: false },
    { id: "funcoesAlternadas",  fn: funcoesAlternadas,  movimento: true  },
    { id: "campoStuds",         fn: campoStuds,         movimento: false },   // sem movimento fica parado
    { id: "indiceLateral",      fn: indiceLateral,      movimento: false },
    { id: "revelarAoRolar",     fn: revelarAoRolar,     movimento: true  },
    { id: "contarPercentagens", fn: contarPercentagens, movimento: true  },
    { id: "studsAnimados",      fn: studsAnimados,      movimento: true  },
    { id: "cartoesInterativos", fn: cartoesInterativos, movimento: false },
    { id: "animarFiltros",      fn: animarFiltros,      movimento: true  },
    { id: "lightboxExtra",      fn: lightboxExtra,      movimento: false },
    { id: "atalhos",            fn: atalhos,            movimento: false },
  ];

  /* Funcionalidades sem efeito visual: estão sempre ligadas */
  const SEMPRE = [contactos, ferramentas, cursos, filtrosNoUrl];

  document.addEventListener("DOMContentLoaded", () => {
    document.documentElement.dataset.extras = "7";      // versão deste ficheiro (útil para confirmar a atualização)
    const opcoes = OPCOES.efeitos || {};
    SEMPRE.forEach((fn) => fn());
    EFEITOS.forEach(({ id, fn, movimento }) => {
      if (opcoes[id] === false) return;
      if (movimento && !animar) return;
      try { fn(); } catch (erro) { console.error(`[extras] "${id}" falhou:`, erro); }
    });
  });
})();