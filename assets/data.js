// Estrutura editorial do portal + conteúdo de demonstração.
// As notícias reais vêm do painel (/admin) via Supabase — veja assets/config.js e ADMIN-SETUP.md.
// As notícias de OO.noticias só aparecem no "modo demonstração" (quando o Supabase não está configurado).
window.OO = window.OO || {};

// Logos da identidade (assets/IDENTIDADE/logos)
OO.LOGO = "assets/IDENTIDADE/logos/logo-horizontal-azul.png";          // para fundo branco
OO.LOGO_BRANCO = "assets/IDENTIDADE/logos/logo-horizontal-branco.png"; // para fundo azul
OO.SIMBOLO_BRANCO = "assets/IDENTIDADE/logos/simbolo-on-branco.png";

OO.INSTAGRAM = "https://www.instagram.com/oeirasonline/";
OO.INSTAGRAM_USER = "oeirasonline";

// Categorias (editorias). Esta lista é a fonte única usada pelo site e pelo painel.
// Ao adicionar uma categoria aqui, inclua o slug também em supabase/schema.sql (restrição "noticias_categoria_valida").
OO.categorias = [
  { slug: "cidade",              nome: "Cidade",              icon: "building-2",     descricao: "O dia a dia da sede e dos bairros de Oeiras do Pará." },
  { slug: "politica",            nome: "Política",            icon: "landmark",       descricao: "Prefeitura, Câmara Municipal e decisões que afetam o cidadão." },
  { slug: "policia",             nome: "Polícia",             icon: "siren",          descricao: "Segurança pública e ocorrências no município." },
  { slug: "saude",               nome: "Saúde",               icon: "heart-pulse",    descricao: "Campanhas, atendimento e serviços de saúde." },
  { slug: "educacao",            nome: "Educação",            icon: "graduation-cap", descricao: "Escolas, matrículas, calendário e ensino no município." },
  { slug: "assistencia-social",  nome: "Assistência Social",  icon: "hand-heart",     descricao: "Programas e benefícios sociais, campanhas, serviços de atendimento, projetos e ações de apoio à população." },
  { slug: "esportes",            nome: "Esportes",            icon: "trophy",         descricao: "Competições, atletas e o esporte local." },
  { slug: "cultura",             nome: "Cultura",             icon: "music",          descricao: "Manifestações culturais, artistas e tradições do povo oeirense." },
  { slug: "festival-do-camarao", nome: "Festival do Camarão", icon: "party-popper",   logo: "assets/IDENTIDADE/logo-fest-camarao.svg",
    descricao: "Cobertura do Festival do Camarão de Oeiras do Pará: programação, cultura, gastronomia, preparativos, atrações e história do evento." },
  { slug: "gastronomia",         nome: "Gastronomia",         icon: "chef-hat",       descricao: "Pratos típicos, receitas, ingredientes, restaurantes e empreendedores da culinária de Oeiras do Pará e da região." },
  { slug: "turismo",             nome: "Turismo",             icon: "tree-palm",      descricao: "Atrativos, paisagens, cultura, patrimônio, eventos e experiências para moradores e visitantes de Oeiras do Pará." },
  { slug: "interior",            nome: "Interior",            icon: "trees",          descricao: "Notícias das comunidades e localidades do interior." },
  { slug: "videos",              nome: "Vídeos",              icon: "clapperboard",   descricao: "Reportagens em vídeo do Oeiras Online." },
  { slug: "servicos",            nome: "Serviços",            icon: "info",           descricao: "Informações de utilidade pública para o cidadão." },
];

// Slide fixo do carrossel "Destaques do Dia" (os demais vêm das notícias marcadas como destaque)
OO.slideParticipe = { tag: "PARTICIPE", titulo: "Mande sua pauta para a redação", sub: "Sua denúncia, sugestão ou foto pode virar notícia", link: "#envie" };

// ---------- Conteúdo de demonstração ----------
const IMG = (seed, w = 900, h = 560) => `https://picsum.photos/seed/oeiras-${seed}/${w}/${h}`;

OO.CONTEUDO_EXEMPLO = `
<p>Este é um texto de exemplo para o esboço do portal. Aqui entra o conteúdo completo da matéria, com o lide respondendo o que aconteceu, quem está envolvido, quando, onde e por quê.</p>
<p>O segundo parágrafo aprofunda o assunto com dados, contexto e falas de fontes ouvidas pela reportagem. A ideia é manter parágrafos curtos, que facilitam a leitura no celular.</p>
<blockquote>“Uma citação de destaque da matéria aparece assim, chamando a atenção do leitor.”</blockquote>
<h2>Intertítulo da matéria</h2>
<p>Intertítulos ajudam a dividir textos mais longos. O encerramento traz serviço (datas, endereços, telefones) ou os próximos passos do caso, quando houver.</p>`;

OO.noticias = [
  { id: 1, cat: "cidade",   titulo: "Defesa Civil alerta para cheia dos rios e orienta moradores das áreas ribeirinhas", resumo: "Equipes visitam comunidades e reforçam os cuidados com a subida do nível da água nos próximos dias.", img: IMG(1), autor: "Redação Oeiras Online", horas: 1, views: 4820, destaque: true },
  { id: 2, cat: "politica", titulo: "Câmara Municipal aprova projeto que amplia o transporte escolar fluvial", resumo: "Proposta prevê novas embarcações e rotas para atender alunos das comunidades mais distantes.", img: IMG(2), autor: "Redação Oeiras Online", horas: 3, views: 3110 },
  { id: 3, cat: "esportes", titulo: "Final do Campeonato Municipal acontece neste domingo no estádio da cidade", resumo: "As duas equipes chegam invictas à decisão. Entrada gratuita para o público.", img: IMG(3), autor: "Equipe de Esportes", horas: 5, views: 5230, destaque: true },
  { id: 4, cat: "saude",    titulo: "Secretaria de Saúde divulga calendário de vacinação para outubro", resumo: "Postos da sede e do interior terão horário estendido durante a campanha.", img: IMG(4), autor: "Redação Oeiras Online", horas: 7, views: 2650, destaque: true },
  { id: 5, cat: "cultura",  titulo: "Festival de carimbó reúne grupos tradicionais na orla neste fim de semana", resumo: "Programação inclui apresentações, feira de artesanato e culinária regional.", img: IMG(5), autor: "Equipe de Cultura", horas: 9, views: 1980 },
  { id: 6, cat: "educacao", titulo: "Matrículas da rede municipal seguem abertas até sexta-feira", resumo: "Pais e responsáveis devem procurar a escola mais próxima com os documentos do aluno.", img: IMG(6), autor: "Redação Oeiras Online", horas: 12, views: 2210 },
  { id: 7, cat: "policia",  titulo: "Polícia Militar intensifica rondas no centro e na área portuária", resumo: "Operação conta com reforço de efetivo e apoio da Guarda Municipal durante a noite.", img: IMG(7), autor: "Redação Oeiras Online", horas: 14, views: 3870 },
  { id: 8, cat: "interior", titulo: "Comunidade ribeirinha ganha nova unidade de saúde e ponto de internet", resumo: "Estrutura vai atender centenas de famílias que antes viajavam horas até a sede.", img: IMG(8), autor: "Correspondente do Interior", horas: 20, views: 1540 },
  { id: 9, cat: "cidade",   titulo: "Nova linha de barco liga a sede às comunidades do interior", resumo: "Horários foram definidos com as associações de moradores. Confira a tabela completa.", img: IMG(9), autor: "Redação Oeiras Online", horas: 26, views: 2990 },
  { id: 10, cat: "videos",  titulo: "VÍDEO: veja como foi a abertura da feira do açaí na praça central", resumo: "Produtores locais apresentaram a safra e movimentaram a economia da cidade.", img: IMG(10), autor: "Redação Oeiras Online", horas: 30, views: 6120, video: true },
  { id: 11, cat: "servicos", titulo: "Saiba como tirar a segunda via de documentos sem sair de Oeiras", resumo: "Ponto de atendimento funciona de segunda a sexta. Veja a lista de documentos.", img: IMG(11), autor: "Redação Oeiras Online", horas: 36, views: 1720 },
  { id: 12, cat: "politica", titulo: "Prefeitura apresenta plano de obras para os bairros da sede", resumo: "Pavimentação, iluminação e drenagem estão entre as prioridades anunciadas.", img: IMG(12), autor: "Redação Oeiras Online", horas: 44, views: 2480 },
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
