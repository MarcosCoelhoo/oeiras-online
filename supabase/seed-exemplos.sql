-- Notícias de exemplo do esboço do portal (opcional).
-- São importadas como RASCUNHO: ficam guardadas no painel, mas NÃO aparecem no site até serem revisadas e publicadas.
-- As fotos são ilustrativas (picsum.photos) e devem ser trocadas por fotos reais antes de publicar.
-- Execute depois do schema.sql, no SQL Editor do Supabase.

insert into public.noticias (slug, titulo, resumo, conteudo, categoria, autor, imagem_url, imagem_legenda, status, destaque, publicado_em)
values
  ('defesa-civil-alerta-para-cheia-dos-rios-e-orienta-moradores-das-areas-exemplo-1', 'Defesa Civil alerta para cheia dos rios e orienta moradores das áreas ribeirinhas', 'Equipes visitam comunidades e reforçam os cuidados com a subida do nível da água nos próximos dias.', '<p>Este é um texto de exemplo para o esboço do portal. Aqui entra o conteúdo completo da matéria, com o lide respondendo o que aconteceu, quem está envolvido, quando, onde e por quê.</p>
<p>O segundo parágrafo aprofunda o assunto com dados, contexto e falas de fontes ouvidas pela reportagem. A ideia é manter parágrafos curtos, que facilitam a leitura no celular.</p>
<blockquote>“Uma citação de destaque da matéria aparece assim, chamando a atenção do leitor.”</blockquote>
<h2>Intertítulo da matéria</h2>
<p>Intertítulos ajudam a dividir textos mais longos. O encerramento traz serviço (datas, endereços, telefones) ou os próximos passos do caso, quando houver.</p>', 'cidade', 'Redação Oeiras Online', 'https://picsum.photos/seed/oeiras-1/900/560', 'Foto ilustrativa', 'rascunho', true, now() - interval '1 hours'),
  ('camara-municipal-aprova-projeto-que-amplia-o-transporte-escolar-fluvia-exemplo-2', 'Câmara Municipal aprova projeto que amplia o transporte escolar fluvial', 'Proposta prevê novas embarcações e rotas para atender alunos das comunidades mais distantes.', '<p>Este é um texto de exemplo para o esboço do portal. Aqui entra o conteúdo completo da matéria, com o lide respondendo o que aconteceu, quem está envolvido, quando, onde e por quê.</p>
<p>O segundo parágrafo aprofunda o assunto com dados, contexto e falas de fontes ouvidas pela reportagem. A ideia é manter parágrafos curtos, que facilitam a leitura no celular.</p>
<blockquote>“Uma citação de destaque da matéria aparece assim, chamando a atenção do leitor.”</blockquote>
<h2>Intertítulo da matéria</h2>
<p>Intertítulos ajudam a dividir textos mais longos. O encerramento traz serviço (datas, endereços, telefones) ou os próximos passos do caso, quando houver.</p>', 'politica', 'Redação Oeiras Online', 'https://picsum.photos/seed/oeiras-2/900/560', 'Foto ilustrativa', 'rascunho', false, now() - interval '3 hours'),
  ('final-do-campeonato-municipal-acontece-neste-domingo-no-estadio-da-cid-exemplo-3', 'Final do Campeonato Municipal acontece neste domingo no estádio da cidade', 'As duas equipes chegam invictas à decisão. Entrada gratuita para o público.', '<p>Este é um texto de exemplo para o esboço do portal. Aqui entra o conteúdo completo da matéria, com o lide respondendo o que aconteceu, quem está envolvido, quando, onde e por quê.</p>
<p>O segundo parágrafo aprofunda o assunto com dados, contexto e falas de fontes ouvidas pela reportagem. A ideia é manter parágrafos curtos, que facilitam a leitura no celular.</p>
<blockquote>“Uma citação de destaque da matéria aparece assim, chamando a atenção do leitor.”</blockquote>
<h2>Intertítulo da matéria</h2>
<p>Intertítulos ajudam a dividir textos mais longos. O encerramento traz serviço (datas, endereços, telefones) ou os próximos passos do caso, quando houver.</p>', 'esportes', 'Equipe de Esportes', 'https://picsum.photos/seed/oeiras-3/900/560', 'Foto ilustrativa', 'rascunho', true, now() - interval '5 hours'),
  ('secretaria-de-saude-divulga-calendario-de-vacinacao-para-outubro-exemplo-4', 'Secretaria de Saúde divulga calendário de vacinação para outubro', 'Postos da sede e do interior terão horário estendido durante a campanha.', '<p>Este é um texto de exemplo para o esboço do portal. Aqui entra o conteúdo completo da matéria, com o lide respondendo o que aconteceu, quem está envolvido, quando, onde e por quê.</p>
<p>O segundo parágrafo aprofunda o assunto com dados, contexto e falas de fontes ouvidas pela reportagem. A ideia é manter parágrafos curtos, que facilitam a leitura no celular.</p>
<blockquote>“Uma citação de destaque da matéria aparece assim, chamando a atenção do leitor.”</blockquote>
<h2>Intertítulo da matéria</h2>
<p>Intertítulos ajudam a dividir textos mais longos. O encerramento traz serviço (datas, endereços, telefones) ou os próximos passos do caso, quando houver.</p>', 'saude', 'Redação Oeiras Online', 'https://picsum.photos/seed/oeiras-4/900/560', 'Foto ilustrativa', 'rascunho', true, now() - interval '7 hours'),
  ('festival-de-carimbo-reune-grupos-tradicionais-na-orla-neste-fim-de-sem-exemplo-5', 'Festival de carimbó reúne grupos tradicionais na orla neste fim de semana', 'Programação inclui apresentações, feira de artesanato e culinária regional.', '<p>Este é um texto de exemplo para o esboço do portal. Aqui entra o conteúdo completo da matéria, com o lide respondendo o que aconteceu, quem está envolvido, quando, onde e por quê.</p>
<p>O segundo parágrafo aprofunda o assunto com dados, contexto e falas de fontes ouvidas pela reportagem. A ideia é manter parágrafos curtos, que facilitam a leitura no celular.</p>
<blockquote>“Uma citação de destaque da matéria aparece assim, chamando a atenção do leitor.”</blockquote>
<h2>Intertítulo da matéria</h2>
<p>Intertítulos ajudam a dividir textos mais longos. O encerramento traz serviço (datas, endereços, telefones) ou os próximos passos do caso, quando houver.</p>', 'cultura', 'Equipe de Cultura', 'https://picsum.photos/seed/oeiras-5/900/560', 'Foto ilustrativa', 'rascunho', false, now() - interval '9 hours'),
  ('matriculas-da-rede-municipal-seguem-abertas-ate-sexta-feira-exemplo-6', 'Matrículas da rede municipal seguem abertas até sexta-feira', 'Pais e responsáveis devem procurar a escola mais próxima com os documentos do aluno.', '<p>Este é um texto de exemplo para o esboço do portal. Aqui entra o conteúdo completo da matéria, com o lide respondendo o que aconteceu, quem está envolvido, quando, onde e por quê.</p>
<p>O segundo parágrafo aprofunda o assunto com dados, contexto e falas de fontes ouvidas pela reportagem. A ideia é manter parágrafos curtos, que facilitam a leitura no celular.</p>
<blockquote>“Uma citação de destaque da matéria aparece assim, chamando a atenção do leitor.”</blockquote>
<h2>Intertítulo da matéria</h2>
<p>Intertítulos ajudam a dividir textos mais longos. O encerramento traz serviço (datas, endereços, telefones) ou os próximos passos do caso, quando houver.</p>', 'educacao', 'Redação Oeiras Online', 'https://picsum.photos/seed/oeiras-6/900/560', 'Foto ilustrativa', 'rascunho', false, now() - interval '12 hours'),
  ('policia-militar-intensifica-rondas-no-centro-e-na-area-portuaria-exemplo-7', 'Polícia Militar intensifica rondas no centro e na área portuária', 'Operação conta com reforço de efetivo e apoio da Guarda Municipal durante a noite.', '<p>Este é um texto de exemplo para o esboço do portal. Aqui entra o conteúdo completo da matéria, com o lide respondendo o que aconteceu, quem está envolvido, quando, onde e por quê.</p>
<p>O segundo parágrafo aprofunda o assunto com dados, contexto e falas de fontes ouvidas pela reportagem. A ideia é manter parágrafos curtos, que facilitam a leitura no celular.</p>
<blockquote>“Uma citação de destaque da matéria aparece assim, chamando a atenção do leitor.”</blockquote>
<h2>Intertítulo da matéria</h2>
<p>Intertítulos ajudam a dividir textos mais longos. O encerramento traz serviço (datas, endereços, telefones) ou os próximos passos do caso, quando houver.</p>', 'policia', 'Redação Oeiras Online', 'https://picsum.photos/seed/oeiras-7/900/560', 'Foto ilustrativa', 'rascunho', false, now() - interval '14 hours'),
  ('comunidade-ribeirinha-ganha-nova-unidade-de-saude-e-ponto-de-internet-exemplo-8', 'Comunidade ribeirinha ganha nova unidade de saúde e ponto de internet', 'Estrutura vai atender centenas de famílias que antes viajavam horas até a sede.', '<p>Este é um texto de exemplo para o esboço do portal. Aqui entra o conteúdo completo da matéria, com o lide respondendo o que aconteceu, quem está envolvido, quando, onde e por quê.</p>
<p>O segundo parágrafo aprofunda o assunto com dados, contexto e falas de fontes ouvidas pela reportagem. A ideia é manter parágrafos curtos, que facilitam a leitura no celular.</p>
<blockquote>“Uma citação de destaque da matéria aparece assim, chamando a atenção do leitor.”</blockquote>
<h2>Intertítulo da matéria</h2>
<p>Intertítulos ajudam a dividir textos mais longos. O encerramento traz serviço (datas, endereços, telefones) ou os próximos passos do caso, quando houver.</p>', 'interior', 'Correspondente do Interior', 'https://picsum.photos/seed/oeiras-8/900/560', 'Foto ilustrativa', 'rascunho', false, now() - interval '20 hours'),
  ('nova-linha-de-barco-liga-a-sede-as-comunidades-do-interior-exemplo-9', 'Nova linha de barco liga a sede às comunidades do interior', 'Horários foram definidos com as associações de moradores. Confira a tabela completa.', '<p>Este é um texto de exemplo para o esboço do portal. Aqui entra o conteúdo completo da matéria, com o lide respondendo o que aconteceu, quem está envolvido, quando, onde e por quê.</p>
<p>O segundo parágrafo aprofunda o assunto com dados, contexto e falas de fontes ouvidas pela reportagem. A ideia é manter parágrafos curtos, que facilitam a leitura no celular.</p>
<blockquote>“Uma citação de destaque da matéria aparece assim, chamando a atenção do leitor.”</blockquote>
<h2>Intertítulo da matéria</h2>
<p>Intertítulos ajudam a dividir textos mais longos. O encerramento traz serviço (datas, endereços, telefones) ou os próximos passos do caso, quando houver.</p>', 'cidade', 'Redação Oeiras Online', 'https://picsum.photos/seed/oeiras-9/900/560', 'Foto ilustrativa', 'rascunho', false, now() - interval '26 hours'),
  ('video-veja-como-foi-a-abertura-da-feira-do-acai-na-praca-central-exemplo-10', 'VÍDEO: veja como foi a abertura da feira do açaí na praça central', 'Produtores locais apresentaram a safra e movimentaram a economia da cidade.', '<p>Este é um texto de exemplo para o esboço do portal. Aqui entra o conteúdo completo da matéria, com o lide respondendo o que aconteceu, quem está envolvido, quando, onde e por quê.</p>
<p>O segundo parágrafo aprofunda o assunto com dados, contexto e falas de fontes ouvidas pela reportagem. A ideia é manter parágrafos curtos, que facilitam a leitura no celular.</p>
<blockquote>“Uma citação de destaque da matéria aparece assim, chamando a atenção do leitor.”</blockquote>
<h2>Intertítulo da matéria</h2>
<p>Intertítulos ajudam a dividir textos mais longos. O encerramento traz serviço (datas, endereços, telefones) ou os próximos passos do caso, quando houver.</p>', 'videos', 'Redação Oeiras Online', 'https://picsum.photos/seed/oeiras-10/900/560', 'Foto ilustrativa', 'rascunho', false, now() - interval '30 hours'),
  ('saiba-como-tirar-a-segunda-via-de-documentos-sem-sair-de-oeiras-exemplo-11', 'Saiba como tirar a segunda via de documentos sem sair de Oeiras', 'Ponto de atendimento funciona de segunda a sexta. Veja a lista de documentos.', '<p>Este é um texto de exemplo para o esboço do portal. Aqui entra o conteúdo completo da matéria, com o lide respondendo o que aconteceu, quem está envolvido, quando, onde e por quê.</p>
<p>O segundo parágrafo aprofunda o assunto com dados, contexto e falas de fontes ouvidas pela reportagem. A ideia é manter parágrafos curtos, que facilitam a leitura no celular.</p>
<blockquote>“Uma citação de destaque da matéria aparece assim, chamando a atenção do leitor.”</blockquote>
<h2>Intertítulo da matéria</h2>
<p>Intertítulos ajudam a dividir textos mais longos. O encerramento traz serviço (datas, endereços, telefones) ou os próximos passos do caso, quando houver.</p>', 'servicos', 'Redação Oeiras Online', 'https://picsum.photos/seed/oeiras-11/900/560', 'Foto ilustrativa', 'rascunho', false, now() - interval '36 hours'),
  ('prefeitura-apresenta-plano-de-obras-para-os-bairros-da-sede-exemplo-12', 'Prefeitura apresenta plano de obras para os bairros da sede', 'Pavimentação, iluminação e drenagem estão entre as prioridades anunciadas.', '<p>Este é um texto de exemplo para o esboço do portal. Aqui entra o conteúdo completo da matéria, com o lide respondendo o que aconteceu, quem está envolvido, quando, onde e por quê.</p>
<p>O segundo parágrafo aprofunda o assunto com dados, contexto e falas de fontes ouvidas pela reportagem. A ideia é manter parágrafos curtos, que facilitam a leitura no celular.</p>
<blockquote>“Uma citação de destaque da matéria aparece assim, chamando a atenção do leitor.”</blockquote>
<h2>Intertítulo da matéria</h2>
<p>Intertítulos ajudam a dividir textos mais longos. O encerramento traz serviço (datas, endereços, telefones) ou os próximos passos do caso, quando houver.</p>', 'politica', 'Redação Oeiras Online', 'https://picsum.photos/seed/oeiras-12/900/560', 'Foto ilustrativa', 'rascunho', false, now() - interval '44 hours')
on conflict (slug) do nothing;
