/* ==========================================================================
   CONFIG.JS — É AQUI QUE EDITAS TUDO.
   --------------------------------------------------------------------------
   Para ADICIONAR algo: copia uma linha/bloco existente, cola por baixo e
   altera os textos. Para REMOVER: apaga o bloco (ou põe // à frente dele).
   A ordem no ficheiro é a ordem no site.

   Onde pôr os ficheiros:
     Media/    -> logo, favicon, foto de perfil
     Imagens/  -> imagens dos projetos e da página "Imagens"
     Videos/   -> vídeos (.mp4, .webm, .mov)
   Nos blocos abaixo escreves só o NOME do ficheiro (ex.: "capa.png").
   O site sabe em que pasta procurar. Também aceita links completos (https://...).

   Cuidado: cada item termina com vírgula, e os textos vão entre aspas.
   Todo o conteúdo abaixo é de EXEMPLO: substitui pelo teu.
   ========================================================================== */


/* ---------- 1. Pastas e opções gerais ---------- */

const PASTAS = {
  media:   "Media/",
  imagens: "Imagens/",
  videos:  "Videos/",
};

const OPCOES = {
  animacoes: true,       // interruptor geral: false desliga TODOS os efeitos de movimento
  nivelMaximo: 5,        // escala das ferramentas: 0 a 5

  /* Efeitos individuais (extras.js). Põe false para desligar um deles. */
  efeitos: {
    barraScroll:        true,   // barra de progresso no topo ao rolar a página
    botaoTopo:          true,   // botão ↑ para voltar ao topo
    revelarAoRolar:     true,   // secções e cartões aparecem ao rolar
    contarPercentagens: true,   // as percentagens dos cursos contam de 0 até ao valor
    campoStuds:         true,   // topo interativo: os studs seguem o rato e o clique cria ondas
    funcoesAlternadas:  true,   // a função no topo escreve-se sozinha (ver INICIO.funcoes)
    letrasNome:         true,   // letras do nome saltam ao passar o rato
    titulosColoridos:   true,   // títulos: cada letra ganha uma cor ao passar o rato e volta ao normal
    indiceLateral:      true,   // pontos de navegação ao lado, com a secção atual realçada
    studsAnimados:      true,   // os níveis das ferramentas "acendem" um a um
    cartoesInterativos: true,   // luz que segue o rato e ligeira inclinação nos cartões
    animarFiltros:      true,   // os itens entram em cascata quando mudas de filtro
    lightboxExtra:      true,   // slideshow, ecrã inteiro, deslizar e ampliar nas imagens
    atalhos:            true,   // teclas: / pesquisa, T tema
  },
};

const SITE = {
  nome:      "Martim Diogo",
  funcao:    "Desenvolvedor de jogos Roblox e Designer Gráfico",
  descricao: "Portfólio de ProGamer: jogos, ferramentas e trabalho em Roblox Studio e web.",
  logo:      "Logo.png",       // em Media/ (se não existir, mostra só o nome)
  favicon:   "Favicon.png",    // em Media/
  rodape:    "© {ano} Martim Diogo. Todos os direitos reservados.",   // {ano} muda sozinho
};

/* Menu do topo. Para esconder uma página, apaga a linha. */
const PAGINAS = [
  { id: "inicio",   nome: "Início",   ficheiro: "index.html"    },
  { id: "cursos",   nome: "Cursos",   ficheiro: "cursos.html"   },
  { id: "projetos", nome: "Projetos", ficheiro: "projetos.html" },
  { id: "imagens",  nome: "Imagens",  ficheiro: "imagens.html"  },
];


/* ---------- 2. Página inicial ---------- */

const INICIO = {
  saudacao: "Olá, eu sou",
  /* Textos que se escrevem sozinhos por baixo do nome (efeito funcoesAlternadas).
     Apaga a lista para mostrar apenas SITE.funcao. */
  funcoes: ["Desenvolvedor de jogos Roblox", "Designer Gráfico", "Editor de vídeo e pós-produção", "Modelador 3D"],

  resumo:   "Eu crio jogos na plataforma Roblox ou crio trabalhos focados em design como Posters ou Logotipos.",

  /* Botões do topo. "principal: true" dá-lhe a cor de destaque. */
  botoes: [
    { texto: "Ver projetos", link: "projetos.html", principal: true },
    { texto: "Contacto",     link: "#contacto" },
  ],

  /* Secções, pela ordem em que aparecem. Apaga uma linha para a esconder.
     Os "id" são fixos (sobre, idiomas, competencias, ferramentas, contacto);
     o "titulo" podes mudar. */
  secoes: [
    { id: "sobre",        titulo: "Sobre mim" },
    { id: "idiomas",      titulo: "Competências linguísticas" },
    { id: "competencias", titulo: "Competências técnicas" },
    { id: "ferramentas",  titulo: "Ferramentas principais" },
    { id: "contacto",     titulo: "Contacto" },
  ],

  /* Sobre mim: um texto por parágrafo. */
  sobre: [
    "Estudante do CTeSP em Design Digital, focado em aprender fazendo e a aplicar conhecimentos, na prática.",
    "Gosto de explorar a lógica por detrás do código e de desenvolver projetos que desafiem a minha criatividade e capacidade técnica.",
    "Cada erro é uma oportunidade de aprender e cada projeto concluído fortalece as minhas competências.",
    "Procuro crescer como desenvolvedor de forma consistente, aprofundando a programação e dedicação à área do design digital.",
    "Eu vivo em Santarém."
  ],
  foto: "eu.png",   // ex.: "eu.jpg" (em Media/). Deixa vazio para não mostrar foto.

  /* Idiomas: nível em texto livre (Nativo, C1, Básico...). */
  idiomas: [
    { nome: "Português", nivel: "Nativo" },
    { nome: "Inglês",    nivel: "Avançado" },
  ],

  /* Competências técnicas: grupos com etiquetas. */
  competencias: [
    { grupo: "Design Gráfico", itens: ["Edição de vídeo e pós produção", "Criação de identidade visual", "Design vetorial"] },
    { grupo: "Jogos",       itens: ["Desenvolvimento de jogos e scripting (Luau)", "Modelagem 3d e renderização"] },
    { grupo: "Comunidade",  itens: ["Gestão de grupos Roblox", "Automação com Google Sheets", "Organização de documentos e sheets"] },
  ],

  /* Ferramentas: nível de 0 a 5 (cada nível é um "stud" preenchido). */
  legendaNiveis: "0 é só ouvi falar, 5 é dominar sem consultar documentação.",
  ferramentas: [
    { nome: "Roblox Studio",      nivel: 4 },
    { nome: "Lua",                nivel: 3 },
    { nome: "Premiere Pro",         nivel: 3 },
    { nome: "Illustrator",         nivel: 2 },
    { nome: "Blender", nivel: 2 },
    { nome: "After Effects",       nivel: 1 },
    { nome: "Substance Painter",       nivel: 1 },
    { nome: "Google Docs (Formatação)",       nivel: 4 },
    { nome: "Google Sheets (Formatação)",       nivel: 4 },
    { nome: "Google Sheets (Scripting)",       nivel: 2 },
  ],

  /* Contactos: "link" é o que abre ao clicar (mailto:, https://...). */
  contactos: [
    { nome: "Email",   valor: "martimrdiogo@gmail.com", link: "martimrdiogo@gmail.com" },
    { nome: "Discord", valor: "institute_leader",        link: "" },
    { nome: "Youtube",  valor: "M4rSCP",            link: "https://www.youtube.com/@MartimProductions" },
  ],
};


/* ---------- 3. Cursos ---------- */

/* Estados possíveis. "cor" é a bolinha do estado. Podes renomear ou acrescentar. */
const ESTADOS_CURSO = {
  "em-curso":  { texto: "Em curso",  cor: "#E5A400" },
  "concluido": { texto: "Concluído", cor: "#1F9D5B" },
  "planeado":  { texto: "Planeado",  cor: "#7B879B" },
};

/* Como preencher cada curso:
     titulo, instituicao      -> textos
     progresso                -> 0 a 100
     modulos (opcional)       -> lista de {nome, feito}. Se existir, o progresso
                                 é calculado sozinho a partir dos módulos feitos.
     estado (opcional)        -> se não puseres, é calculado (0 = planeado,
                                 100 = concluído, entre os dois = em curso)
     inicio, fim, notas, certificado (opcionais) */
const CURSOS = {
  titulo: "Cursos",
  intro:  "O que estou a aprender e até onde já cheguei.",
  lista: [
    {
      titulo: "Curso Profissional Técnico/a de Audiovisual",
      instituicao: "Agrupamento de Escolas Dr. Ginestal Machado",
      inicio: "",
      notas: [
        "Durante este período no curso, aprendi a utilizar ferramentas de audiovisual pela primeira vez, principalmente aplicações da Adobe, como Adobe Premiere Pro e Adobe Illustrator. ",
        "Ao longo da formação, desenvolvi competências na área de fotografia, gravação de vídeo e edição multimédia.",
        "Foi também neste curso que participei em vários projetos criativos.",
        "Entre eles, destaco a realização da minha própria PAP, baseada numa animação 3D desenvolvida com Roblox Studio e Blender, além da colaboração na produção de uma curta-metragem.",
        "Estas experiências permitiram melhorar a minha criatividade, organização e capacidade de trabalho em equipa.",
    ],
      progresso: 100,
    },
    {
      titulo: "Curso Técnico Superior Profissional Tecnologias e Programação de Sistemas de Informação",
      instituicao: "Instituto Politécnico de Santarém",
      inicio: "",
      notas: [
        "Eu entrei neste curso anteriormente antes do Curso de Design Digital com o objetivo de aprender/melhorar as minhas habilidades como Programador.",
        "Porém, ao longo do curso eu acabei perdendo interesse neste tipo de curso por várias razões mas acredito em que aprendi ou melhorei minhas habilidades, mesmo não sendo a minha área principal.",
    ],
      modulos: [
        { nome: "Língua Inglesa", feito: true  },
        { nome: "Métodos Quantitativos", feito: false  },
        { nome: "Língua Portuguesa", feito: true  },
        { nome: "Sistemas de Informação", feito: true  },
        { nome: "Introdução à Programação", feito: true  },
        { nome: "Arquitecturas de Hardware e Sistemas Operativos", feito: false  },
        { nome: "Bases de Dados I", feito: false  },
        { nome: "Engenharia de Software", feito: false  },
        { nome: "Desenvolvimento de Produtos Multimédia", feito: true  },
        { nome: "Programação Orientada a Objetos", feito: false  },
        { nome: "Redes de Comunicação e Serviços", feito: false  },
        { nome: "Segurança de Redes e Sistemas", feito: true  },
      ],
    },
    {
      titulo: "Curso Técnico Superior Profissional Design Digital",
      instituicao: "Instituto Politécnico de Santarém",
      inicio: "",
      notas: [
        "Durante o percurso no curso de Design Digital, continuei a desenvolver competências adquiridas anteriormente na área do audiovisual.",
        "Trabalhei novamente com ferramentas de edição, design e criação digital, aprofundando conhecimentos em áreas como design gráfico, produção multimédia e conteúdos visuais.",
        "Ao longo da formação, participei em projetos criativos focados em comunicação visual e desenvolvimento digital, junto com mais uma curta-metragem, sendo ela mais pequena.",
        "Esta experiência permitiu reforçar competências técnicas, criatividade, organização de projetos e trabalho em equipa, preparando-me para futuros desafios na área do design e desenvolvimento digital.",
    ],
      modulos: [
        { nome: "Análise do Discurso dos Media", feito: true  },
        { nome: "Design e Representação Gráfica", feito: true  },
        { nome: "Fotografia e Imagem Digital", feito: true  },
        { nome: "Publicidade e Marketing", feito: true  },
        { nome: "Teorias da Comunicação", feito: true  },
        { nome: "Teorias do Design", feito: true  },
        { nome: "Composição de Imagem e Ilustração digital", feito: true  },
        { nome: "Ética e Deontologia do Design", feito: true  },
        { nome: "Novos Media", feito: true  },
        { nome: "Produção Audiovisual", feito: true  },
        { nome: "Psicologia da Comunicação", feito: true  },
        { nome: "Sistema de Informação", feito: true  },
        { nome: "Design Multimédia e Interatividade", feito: false  },
        { nome: "Desenvolvimento e Avaliação de Projetos em DD", feito: false  },
        { nome: "Empreendedorismo Aplicado ao Design", feito: false  },
        { nome: "Edição Gráfica", feito: false  },
        { nome: "Objetos Multimédia", feito: false  },
        { nome: "Sistemas de Gestão de Conteúdos", feito: false  },
      ],
    },
  ],
};


/* ---------- 4. Projetos pessoais ---------- */

const ESTADOS_PROJETO = {
  "em-desenvolvimento": { texto: "Em desenvolvimento", cor: "#E5A400" },
  "lancado":            { texto: "Lançado",            cor: "#1F9D5B" },
  "em-pausa":           { texto: "Em pausa",           cor: "#7B879B" },
};

/* Como preencher cada projeto:
     titulo, resumo (aparece no cartão), descricao (aparece ao abrir)
     estado     -> uma das chaves de ESTADOS_PROJETO
     etiquetas  -> criam os filtros automaticamente
     capa       -> imagem em Imagens/
     video      -> vídeo em Videos/ (opcional)
     imagens    -> mais imagens em Imagens/ (opcional)
     links      -> botões ao abrir o projeto (opcional) */
const PROJETOS = {
  titulo: "Projetos pessoais",
  intro:  "Jogos e ferramentas que criei por iniciativa própria.",
  lista: [
    {
      titulo: "Site-Theta",
      resumo: "Jogo de Roleplay focado em um ambiente pós-apocalipse na plataforma Roblox",
      descricao: "O projeto 'Project Sanctuary' é um projeto individual que estou a desenvolver na plataforma Roblox. O foco é a criação de um jogo indie baseado em roleplay sério, numa instalação secreta com estrutura organizada, hierarquia e funções bem definidas.",
      estado: "em-desenvolvimento",
      etiquetas: ["Roblox", "Lua", "Jogo"],
      capa: "ACF.png",
      video: "",
      imagens: ["wildview-02.png", "wildview-03.png"],
      links: [
        { nome: "Jogar no Roblox", url: "https://www.roblox.com/" },
      ],
    },
  ],
};


/* ---------- 5. Imagens de trabalho ---------- */

/* Cada item: ficheiro (em Imagens/ ou, se for vídeo, em Videos/), titulo,
   legenda e categoria (cria os filtros). O tipo é detetado pela extensão:
   .mp4 .webm .mov .m4v .ogv são vídeos, o resto são imagens. */
const GALERIA = {
  titulo: "Imagens de trabalho",
  intro:  "Capturas, cenas e vídeos do meu trabalho. Clica para ver em ponto grande.",
  lista: [
    { ficheiro: "Capa1.png",  titulo: "The Grand Hideaway", legenda: "Capa", categoria: "Design" },
    { ficheiro: "Capa2.png",  titulo: "The Grand Hideaway", legenda: "Capa", categoria: "Design" },
    { ficheiro: "Capa3.png",  titulo: "The Grand Hideaway", legenda: "Capa", categoria: "Design" },
    { ficheiro: "Capa4.jpg",  titulo: "The Grand Hideaway", legenda: "Capa", categoria: "Design" },
    { ficheiro: "Aethaon GFX1.png",  titulo: "GFX feito para um individual", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "Aethaon GFX2.png",  titulo: "GFX feito para um individual", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "arkoudafe GFX.png",  titulo: "GFX feito para um individual", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "Back GFX.png",  titulo: "GFX feito para um individual", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "Cerb GFX.png",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "Cold Race GFX1.png",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "Cold Race GFX2.png",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "CR GFX.png",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "Dev GFX.png",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "DrkHal GFX.png",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "ET GFX.png",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "Events GFX.png",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "ltrc GFX.png",  titulo: "GFX feito para um individual", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "Manticore GFX.png",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "NT GFX.png",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "OC GFX.png",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "Python GFX.png",  titulo: "GFX feito para um individual", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "RB GFX.png",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "RB GFX2.jpg",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "RB GFX3.png",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "RB Prog GFX.png",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "Sergeant GFX.png",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "TT GFX1.png",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "TT GFX2.png",  titulo: "GFX feito para um grupo", legenda: "Graphics", categoria: "GFX" },
    { ficheiro: "Mapa1.png",  titulo: "Desenvolvimento de Jogo Roblox", legenda: "Roblox", categoria: "Roblox" },
    { ficheiro: "Mapa2.png",  titulo: "Desenvolvimento de Jogo Roblox", legenda: "Roblox", categoria: "Roblox" },
    { ficheiro: "Mapa3.png",  titulo: "Desenvolvimento de Jogo Roblox", legenda: "Roblox", categoria: "Roblox" },
    { ficheiro: "Mapa4.png",  titulo: "Desenvolvimento de Jogo Roblox", legenda: "Roblox", categoria: "Roblox" },
    { ficheiro: "Mapa5.png",  titulo: "Desenvolvimento de Jogo Roblox", legenda: "Roblox", categoria: "Roblox" },
    { ficheiro: "Mapa6.png",  titulo: "Desenvolvimento de Jogo Roblox", legenda: "Roblox", categoria: "Roblox" },
    { ficheiro: "Mapa7.png",  titulo: "Desenvolvimento de Jogo Roblox", legenda: "Roblox", categoria: "Roblox" },
    { ficheiro: "Mapa8.png",  titulo: "Desenvolvimento de Jogo Roblox", legenda: "Roblox", categoria: "Roblox" },
    { ficheiro: "Mapa9.png",  titulo: "Desenvolvimento de Jogo Roblox", legenda: "Roblox", categoria: "Roblox" },
    { ficheiro: "Mapa10.png",  titulo: "Desenvolvimento de Jogo Roblox", legenda: "Roblox", categoria: "Roblox" },
    { ficheiro: "Mapa11.png",  titulo: "Desenvolvimento de Jogo Roblox", legenda: "Roblox", categoria: "Roblox" },
    { ficheiro: "Mapa12.png",  titulo: "Desenvolvimento de Jogo Roblox", legenda: "Roblox", categoria: "Roblox" },
    { ficheiro: "Boneco1.png",  titulo: "Boneco de um personagem", legenda: "Objeto 3D", categoria: "Mesh" },
    { ficheiro: "Emblem.png",  titulo: "Emblema 3d de um logotipo", legenda: "Objeto 3D", categoria: "Mesh" },
    { ficheiro: "Curta Metragem - _Acidente ao Volante_.mp4",  titulo: "Acidente ao Volante", legenda: "Curta-Metragem", categoria: "Video" },
    { ficheiro: "Evento de Brecha.mp4",  titulo: "Evento de Brecha", legenda: "Animação 3d", categoria: "Video" },
    { ficheiro: "Showcase of PS.mp4",  titulo: "Evento de Brecha", legenda: "Showcase Roblox", categoria: "Video" },
    { ficheiro: "STOP MOTION.mp4",  titulo: "STOP MOTION", legenda: "Video", categoria: "Video" },
    { ficheiro: "Trabalho 4 Planos _O Último Bilhete_.mp4",  titulo: "O Último Bilhete", legenda: "Video", categoria: "Video" },
    { ficheiro: "Poster6.png",  titulo: "Anúncio para um grupo de oficias de um grupo de comunidade", legenda: "Graphics", categoria: "GFX" },
  ],
};