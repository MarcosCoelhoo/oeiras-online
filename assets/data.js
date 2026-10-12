// Conteúdo de exemplo (esboço) — substitua pelas notícias reais / API do painel.
window.OO = window.OO || {};

// Logos da nova identidade (assets/IDENTIDADE/logos)
OO.LOGO = "assets/IDENTIDADE/logos/logo-horizontal-azul.png";          // para fundo branco
OO.LOGO_BRANCO = "assets/IDENTIDADE/logos/logo-horizontal-branco.png"; // para fundo azul
OO.SIMBOLO_BRANCO = "assets/IDENTIDADE/logos/simbolo-on-branco.png";

OO.categorias = [
  { slug: "cidade",     nome: "Cidade",     icon: "building-2" },
  { slug: "politica",   nome: "Política",   icon: "landmark" },
  { slug: "policia",    nome: "Polícia",    icon: "siren" },
  { slug: "esportes",   nome: "Esportes",   icon: "trophy" },
  { slug: "cultura",    nome: "Cultura",    icon: "music" },
  { slug: "saude",      nome: "Saúde",      icon: "heart-pulse" },
  { slug: "educacao",   nome: "Educação",   icon: "graduation-cap" },
  { slug: "interior",   nome: "Interior",   icon: "trees" },
  { slug: "videos",     nome: "Vídeos",     icon: "clapperboard" },
  { slug: "servicos",   nome: "Serviços",   icon: "info" },
];

OO.destaques = [
  { tag: "URGENTE",   titulo: "Defesa Civil alerta para cheia dos rios nesta semana", sub: "Veja as orientações para moradores das áreas ribeirinhas", link: "noticia.html?id=1" },
  { tag: "SERVIÇO",   titulo: "Calendário de vacinação de outubro está disponível",   sub: "Toque aqui e confira os postos e horários", link: "noticia.html?id=4" },
  { tag: "ESPORTES",  titulo: "Final do Campeonato Municipal acontece neste domingo",  sub: "Saiba onde assistir e como chegar ao estádio", link: "noticia.html?id=3" },
  { tag: "PARTICIPE", titulo: "Mande sua pauta para a redação pelo WhatsApp",          sub: "Sua denúncia, sugestão ou foto pode virar notícia", link: "#envie" },
];

OO.urgentes = [
  "Defesa Civil emite alerta de cheia para comunidades ribeirinhas",
  "Matrículas da rede municipal seguem abertas até sexta-feira",
  "Final do Municipal de futebol será no domingo, às 16h",
  "Nova linha de barco liga a sede às comunidades do interior",
];

const IMG = (seed, w = 900, h = 560) => `https://picsum.photos/seed/oeiras-${seed}/${w}/${h}`;

OO.noticias = [
  { id: 1, cat: "cidade",   titulo: "Defesa Civil alerta para cheia dos rios e orienta moradores das áreas ribeirinhas", resumo: "Equipes visitam comunidades e reforçam os cuidados com a subida do nível da água nos próximos dias.", img: IMG(1), autor: "Redação Oeiras OnLine", horas: 1, views: 4820 },
  { id: 2, cat: "politica", titulo: "Câmara Municipal aprova projeto que amplia o transporte escolar fluvial", resumo: "Proposta prevê novas embarcações e rotas para atender alunos das comunidades mais distantes.", img: IMG(2), autor: "Redação Oeiras OnLine", horas: 3, views: 3110 },
  { id: 3, cat: "esportes", titulo: "Final do Campeonato Municipal acontece neste domingo no estádio da cidade", resumo: "As duas equipes chegam invictas à decisão. Entrada gratuita para o público.", img: IMG(3), autor: "Equipe de Esportes", horas: 5, views: 5230 },
  { id: 4, cat: "saude",    titulo: "Secretaria de Saúde divulga calendário de vacinação para outubro", resumo: "Postos da sede e do interior terão horário estendido durante a campanha.", img: IMG(4), autor: "Redação Oeiras OnLine", horas: 7, views: 2650 },
  { id: 5, cat: "cultura",  titulo: "Festival de carimbó reúne grupos tradicionais na orla neste fim de semana", resumo: "Programação inclui apresentações, feira de artesanato e culinária regional.", img: IMG(5), autor: "Equipe de Cultura", horas: 9, views: 1980 },
  { id: 6, cat: "educacao", titulo: "Matrículas da rede municipal seguem abertas até sexta-feira", resumo: "Pais e responsáveis devem procurar a escola mais próxima com os documentos do aluno.", img: IMG(6), autor: "Redação Oeiras OnLine", horas: 12, views: 2210 },
  { id: 7, cat: "policia",  titulo: "Polícia Militar intensifica rondas no centro e na área portuária", resumo: "Operação conta com reforço de efetivo e apoio da Guarda Municipal durante a noite.", img: IMG(7), autor: "Redação Oeiras OnLine", horas: 14, views: 3870 },
  { id: 8, cat: "interior", titulo: "Comunidade ribeirinha ganha nova unidade de saúde e ponto de internet", resumo: "Estrutura vai atender centenas de famílias que antes viajavam horas até a sede.", img: IMG(8), autor: "Correspondente do Interior", horas: 20, views: 1540 },
  { id: 9, cat: "cidade",   titulo: "Nova linha de barco liga a sede às comunidades do interior", resumo: "Horários foram definidos com as associações de moradores. Confira a tabela completa.", img: IMG(9), autor: "Redação Oeiras OnLine", horas: 26, views: 2990 },
  { id: 10, cat: "videos",  titulo: "VÍDEO: veja como foi a abertura da feira do açaí na praça central", resumo: "Produtores locais apresentaram a safra e movimentaram a economia da cidade.", img: IMG(10), autor: "TV Oeiras OnLine", horas: 30, views: 6120, video: true },
  { id: 11, cat: "servicos", titulo: "Saiba como tirar a segunda via de documentos sem sair de Oeiras", resumo: "Ponto de atendimento funciona de segunda a sexta. Veja a lista de documentos.", img: IMG(11), autor: "Redação Oeiras OnLine", horas: 36, views: 1720 },
  { id: 12, cat: "politica", titulo: "Prefeitura apresenta plano de obras para os bairros da sede", resumo: "Pavimentação, iluminação e drenagem estão entre as prioridades anunciadas.", img: IMG(12), autor: "Redação Oeiras OnLine", horas: 44, views: 2480 },
];

OO.colunistas = [
  { nome: "Nome do Colunista", area: "Política & Bastidores", frase: "Os bastidores da semana na Câmara e o que muda para o cidadão.", img: IMG("c1", 200, 200) },
  { nome: "Nome da Colunista", area: "Saúde & Bem-estar",     frase: "Dicas práticas para cuidar da família no período das chuvas.", img: IMG("c2", 200, 200) },
  { nome: "Nome do Colunista", area: "Esporte Local",          frase: "A decisão do Municipal promete ser a maior dos últimos anos.", img: IMG("c3", 200, 200) },
];

OO.guia = [
  { icon: "fish",          titulo: "Culinária",   texto: "Peixe frito, açaí fresquinho, caldeirada e frutas da região — o sabor que identifica a nossa terra." },
  { icon: "waves",         titulo: "Rios",        texto: "Cercada por rios e igarapés, Oeiras vive no ritmo das águas, que ligam a sede às comunidades." },
  { icon: "music-2",       titulo: "Cultura",     texto: "Carimbó, festas de santo e manifestações populares mantêm vivas as tradições do povo oeirense." },
  { icon: "ship",          titulo: "Transporte",  texto: "Barcos e lanchas são o principal meio de ligação com o interior e os municípios vizinhos." },
  { icon: "palette",       titulo: "Artesanato",  texto: "Peças em palha, madeira e cerâmica feitas por artesãos locais, com identidade amazônica." },
  { icon: "trending-up",   titulo: "Economia",    texto: "Açaí, pesca e comércio movimentam a economia e geram renda para milhares de famílias." },
];

OO.telefones = [
  { nome: "Polícia Militar", numero: "190", icon: "shield" },
  { nome: "SAMU",            numero: "192", icon: "ambulance" },
  { nome: "Bombeiros",       numero: "193", icon: "flame" },
  { nome: "Defesa Civil",    numero: "199", icon: "life-buoy" },
];

OO.mural = [
  { nome: "Maria S.",   data: "11/10/2026", texto: "Parabéns pelo portal! Agora fica fácil acompanhar tudo que acontece na cidade." },
  { nome: "João B.",    data: "10/10/2026", texto: "Ótima cobertura do campeonato. Rumo à final!" },
  { nome: "Ana P.",     data: "09/10/2026", texto: "Seria ótimo uma matéria sobre a estrada da comunidade. Obrigada!" },
];
