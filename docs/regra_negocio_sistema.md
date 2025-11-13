# Blueprint de Regras de Negócio para SaaS de Gestão Financeira Familiar

## Resumo executivo e objetivos do sistema

O contexto nacional revela um brasileiro que luta para organizar as finanças em meio à pressão social, rotinas corridas, rendas variáveis e tentativas frustradas com métodos tradicionais. A análise de comentários de um vídeo educativo widely consumed no país sobre “organizar o dinheiro sem planilha” mostra um padrão consistente de dores: o dinheiro “some” no fim do mês; compras por impulso minam a disciplina; métodos como planilhas são percibidos como complexos e abandonment é alto; e a ansiedade, a vergonha e o medo de errar bloqueiam o início. Os perfis mais recorrentes incluem o Iniciante Perdido (medo de errar), o Frustrado Anônimo (já tentou várias vezes), o Sem Tempo (precisa de praticidade imediata) e o Gastador Impulsivo (baixo autocontrole). As dúvidas mais frequentes concentram-se em como separar gastos quando não se sabe o tamanho do “bolo”, se funciona sem Excel, como adaptar a renda variável, e quando os resultados aparecem.

Este blueprint organiza, em um sistema de gestão financeira familiar, as escolhas de produto e as regras de negócio que convertem a energia do “preciso melhorar” em hábitos sustentados, sem exigir do usuário o que ele não tem (tempo, paciência, domínio técnico, disciplina rígida). O sistema parte de um fluxo de onboarding centrado em “fazer sobrar” no primeiro mês, utiliza metodologias comportamentais com evidência para sustentar hábitos e decisões, e organiza metas e gamificação para reduzir ansiedade e induzir progresso visível.

Princípios que orientam este produto:

- Simplicidade acima de tudo: eliminar fricções cognitivas e técnicas, por meio de categorias pré-mapeadas, guias visuais, exemplos práticos e uma linguagem que não intimida.
- Educação just-in-time: conteúdos e microações oferecidas no momento certo, na interface, conectadas a decisões concretas do usuário, reforçando autoconfiança e competência.
- Ações que educam: cada comportamento (adicionar transação, criar meta, visualizar progresso) deve, por si, explicar o sistema e treinar a pessoa usuária, evitando tutorials extensos.
- Redução de ansiedade: o produto precisa devolver uma sensação de controle desde o primeiro uso, com metas pequenas, feedback positivo e alertas que previnem problemas sem culpar.

Resultados esperados:

- Fazer sobrar no primeiro mês: acionar uma prática inicial que organiza gastos essenciais e desejos, cria envelope mínimo para emergência e mostra saldo livre disponível.
- Manter consistência nos primeiros 60 dias: reduzir o abandono por meio de conquistas leves, lembretes proporcionais e visuais de progresso que reforçam a percepção de avanço.
- Introduzir hábitos financeiros básicos: registrar transações, alocar renda, poupar um percentual, quitar dívidas com método, revisar semanalmente.

Este plano operacionaliza o produto em seis pilares que respondem, em sequência lógica, às dores e às perguntas dos perfis:

1) Funcionalidades prioritárias e regras de negócio  
2) Fluxo de onboarding para iniciantes (momentos “WOW” em 7 dias)  
3) Sistema de metas e acompanhamento (orçamento, dívida, poupança)  
4) Recursos de educação financeira integrados (conteúdo e coaching)  
5) Estratégias de gamificação para manter engajamento (sem manipulação)  
6) Sistema de alertas e notificações inteligentes (proativas, empáticas)

Cada seção avança com regras claras, Estados e Transições (máquina de estados) e critérios de medição. As metodologias financeiras aqui mobilizadas (Envelope, 50/30/20, Zero-Based, Bola de Neve e Avalanche, além de princípios de educação financeira adultos) se conectam ao desenho de interface e à gamificação, para minimizar o atrito e maximizar a adoção sustentada.

### Objetivos de produto e sucesso do usuário

O produto tem como objetivo fundamental criar “sobra” mensurável e duradoura. O usuário deve conseguir, no primeiro ciclo, ver e decidir o que fazer com o dinheiro que sobrou; organizar o orçamento de modo intuitivo, com guias para categorias; quitar ao menos uma dívida usando uma estratégia clara e recompensada; e establecer uma reserva mínima.

Metas de adoção e ativação para otime de produto:

- Dia 0 a Dia 7: onboarding concluído com a primeira categorização automática e visualização do saldo livre; ao menos uma meta criada (emergência ou quitação).
- Semana 2: pelo menos 10 transações registradas ou importadas e um ciclo de revisão de orçamento realizado; primeiro alerta inteligente configurado conforme perfil.
- Semana 4: “primeira sobra” confirmada no dashboard de metas; ciclo de quitação de dívida iniciado; se aplicável, reserva mínima estabelecida.
- Dia 30 a Dia 60: consistência medida (streak semanal de revisão, taxa de categorização >80%); redução do consumo impulsivo (queda de gastos supérfluos vs. baseline); início de hábito de poupança regular.

### Princípios de design e governança

O sistema evita modularidades complexas em fases iniciais (como integrações bancárias avançadas, agregação multiusuário com dependentes e controles parentais) para reduzir risco de complexidade indevida e falha. A experiência segue três princípios:

- Fricção mínima: tarefas essenciais em 3–5 cliques; pedir o mínimo de dados (apenas renda bruta/líquida e quatro contas básicas para começar); categorização automática com ajustes simples.
- Educação just-in-time e unbiased: conteúdos práticos acionados pela interface; linguagem clara; apresentar prós e contras em recomendações de dívida, consumo e poupança.
- Educação no lugar certo: “ação educa” — cada botão, gráfico e texto explica a decisão; microcopys guiam o que fazer em linguagem simples, com exemplos próximos da realidade do usuário.

Uma última premissa de governança é a segurança psicológica: o produto deve evitar “culpar” o usuário. Alertas e feedbacks são escritos em linguagem empática e focada em opções (“você pode mover R$ X do envelope ‘compras’ para ‘contas’ e manter o plano no azul”).

## Personas e dores do usuário

A proposta de valor só é clara quando os obstáculos e motivos reais de cada persona ficam visíveis. O sistema deve atender com precisão o Iniciante Perdido (medo de errar), o Frustrado Anônimo (ceticismo), o Sem Tempo (praticidade imediata) e o Gastador Impulsivo (autocontrole). O produto deve “fazer sobrar” já no primeiro mês, sem exigir planilhas, e manter um caminho de resultados que não punitive.

Para sintetizar as dores e respostas adequadas, o mapa a seguir organiza os perfis.

Para tornar tangíveis os perfis e metas de intervenção, a Tabela 1 resume dores, gatilhos, objeções, métricas de sucesso e funcionalidades que endereçam cada persona. Esta visualização permite desenhar jornadas, microcopys e educação que dialogam com cada necessidade real.

Tabela 1 — Mapa de Persona: Dores, Gatilhos, Objeções, Métricas e Features

| Persona                | Dores principais                                                                 | Gatilhos                              | Objeções comuns                                       | Métricas de sucesso                                   | Funcionalidades que respondem                                                                 |
|------------------------|-----------------------------------------------------------------------------------|---------------------------------------|-------------------------------------------------------|-------------------------------------------------------|------------------------------------------------------------------------------------------------|
| Iniciante Perdido      | Medo de errar; ansiedade; vergonha; “não sei por onde começar”                    | Recebimento de salário; contas a vencer| “Planilha é difícil”; “não tenho tempo”               | Onboarding concluído; primeira sobra; primeira meta   | Categorização automática; guia de orçamento; visual “saldo livre”; conteúdo básico de 5 min    |
| Frustrado Anônimo      | Tentativas fracassadas; ceticismo; desistência constante                          | Queda de renda; dívida increases       | “É só mais um app”; “não funciona na vida real”       | Taxa de classificação de transações >80%; Streak 4 sem | Metodologias (Envelope, Zero-Based); microconquistas; relatórios simples de progresso           |
| Sem Tempo              | Rotina corrida; falta de tempo para controles                                     | Mês atípico (gastos extras)            | “Não aguento mais app complicado”                     | 10 transações registradas em 14 dias; revisão semanal | Importação simplificada; alertas de envelope; lembretes leves;Dashboard com visão semanal       |
| Gastador Impulsivo     | Compras por impulso; baixa disciplina; resistência à mudança                      | Promoções; datas especiais             | “Não consigo parar de gastar”                         | Queda de supérfluos; uso de bloqueios de gasto        | Bloqueio preventivo; metas micro; recompensas não-monetárias; feedback pós-compra               |

A partir deste mapa, o sistema personaliza o onboarding, o desenho do primeiro orçamento, as metas, os alertas e o conteúdo. O Frustrado precisa de evidências de avanço; o Sem Tempo quer que o app faça por ele; o Iniciante quer segurança emocional; o Impulsivo precisa de mecanismos de autocontrole. A Tabela 2 aprofunda as dores por persona, conectando objeções e mensagens-chave de confiança.

Tabela 2 — Dores por persona vs funcionalidades e objeções

| Persona             | Dores específicas                               | Objeções típicas                                 | Mensagens de confiança e features                               |
|---------------------|--------------------------------------------------|--------------------------------------------------|------------------------------------------------------------------|
| Iniciante Perdido   | Ansiedade; medo de errar; vergonha               | “Não entendo de finanças”                         | “Sem planilha”; “fazer sobrar” como primeiro resultado; guias visuais |
| Frustrado Anônimo   | Desistência; ceticismo                           | “Já tentei e não funciona”                        | Pequenas vitórias; streaks; relatórios simples de progresso       |
| Sem Tempo           | Falta de tempo; rotina corrida                   | “Outro app vai tomar meu tempo”                   | Importação rápida; categorização automática; alertas leves        |
| Gastador Impulsivo  | Impulso; baixa disciplina                        | “Não resisto a promoções”                         | Bloqueios preventivos; metas micro; reforço positivo              |

### Persona 1: Iniciante Perdido

O Iniciante precisa de segurança emocional e clareza prática. O produto deve reduzir a ansiedade desde o primeiro uso e tornar o caminho óbvio: fornecer um guia passo a passo de orçamento em linguagem simples, com categorias pré-mapeadas, exemplos cotidianos e visual do saldo livre (“dinheiro disponível para você decidir”). A oferta do “primeiro valor” deve ser concreta: ver, em 5 minutos, o que é essencial, o que é supérfluo e quanto pode ser guardado ou usado para quitar uma dívida.

### Persona 2: Frustrado Anônimo

O Frustrado não acredita em promessas. É decisivo mostrar progresso real e recompensas proporcionais. O sistema deve permitir escolher a metodologia de orçamento, oferecer relatórios simples de evolução e pontuar pequenas conquistas (sem monetização direta): streak semanal, três semanas sem ultrapassar envelope, quitação da primeira dívida pequena. O ceticismo se reduz quando oapp prova utilidade sem pedir nada complexo em troca.

### Persona 3: Sem Tempo

O Sem Tempo não quer configuração longa. O onboarding deve capturar renda e quatro contas principais, propor um orçamento com categorias pré-mapeadas e permitir importação simplificada de extratos. Os alertas precisam prevenir消費 excessos (“você está a R$ 150 de exceder o envelope de ‘compras’ esta semana”) e sugerir ações leves (“adiar esta compra em 24h economiza R$ X”), sem punishing.

### Persona 4: Gastador Impulsivo

O Impulsivo se beneficia de mecanismos de autocontrole: limites configuráveis por categoria, bloqueios preventivos em datas especiais, metas micro com recompensas simbólicas, feedback pós-compra que compara intenção vs. comportamento (“você pretendia gastar R$ 80 nesta categoria e gastou R$ 140”). O sistema deve reforço positivo e tarefas que formam hábito (ex.: adicionar transação imediatamente após compra).

## Metodologias financeiras e tradução em regras de produto

O sistema não impõe um método único; ele habilita metodologias com evidência comportamental e operacionaliza regras que são fáceis de seguir, com automações, limites e visualizar progressos. Na família brasileira típica, a combinação de métodos traz mais robustez: usar Envelope para categorias com propensão a excesso; Zero-Based para meses com mudanças significativas; 50/30/20 quando se busca simplicidade e margem de segurança. No endividamento, a família escolhe entre Bola de Neve (motivação por vitórias rápidas) e Avalanche (otimização de juros). O produto orienta e compara, sem induzir decisões.

Para contextualizar a amplitude das práticas recomendadas para educação financeira de adultos e sua transposição para a experiência digital, a Figura 1 apresenta um excerto de boas práticas consolidado por autoridades federais (CFPB, FLEC, GAO), que enfatiza aprendizado timely, habilidades-chave, motivação por metas e suporte contínuo.

![Excerto do relatório FINRED: melhores práticas de educação financeira aplicáveis a adultos](.pdf_temp/viewrange_chunk_1_1_5_1762372635/images/pvm4x0.jpg)

Este referencial sustenta as escolhas de produto: conteúdos unbiased, microlearning integrado ao uso, coaching leve via mensagens e suporte ao longo do tempo, ao invés de módulos isolados e descontextualizados. Mais adiante, a seção de educação detalha a materialização dessas diretrizes na interface.

A Tabela 3 traduz cada metodologia em funcionalidades e regras concretas.

Tabela 3 — Matriz Metodologia vs funcionalidades e regras

| Metodologia        | Funcionalidades principais                                      | Regras e parâmetros                                            | Como a dor é endereçada                                                  |
|--------------------|------------------------------------------------------------------|-----------------------------------------------------------------|-------------------------------------------------------------------------|
| Envelope           | Limites por categoria; alertas; bloqueios preventivos            | Definir valor por envelope; visualizar saldo; avisar ao se aproximar do limite; bloqueio opcional | Supérfluos: controla impulso; Sem Tempo: prevenção e aviso oportuno     |
| 50/30/20           | Planos pré-configurados; cálculo automático                      | 50% necessidades; 30% desejos; 20% metas/poupança; ajustes por renda | Iniciante: simplicidade; Frustrado: disciplina leve com resultado claro |
| Zero-Based         | Alocação de cada Real; modelo “sobra=reserva ou dívida”          | Cada Real tem destino; revisão mensal; histórico de versões     | Frustrado: sensação de controle; meses atípicos: ajuste granular        |
| Bola de Neve       | Plano de quitação priorizando menor saldo                        | Lista de dívidas; marcos de quitação; feedback por pequena vitória | Iniciante/Frustrado: motivação por vitórias rápidas                     |
| Avalanche          | Plano priorizando maior taxa de juros                            | Ordenação por juros; simulação de economia total; alerta de rebalanceamento | Frustrado: otimização racional; casos com juros elevados                |

Tabela 4 — Dívidas: Bola de Neve vs Avalanche

| Critério             | Bola de Neve                                     | Avalanche                                        | Quando usar                                        |
|----------------------|---------------------------------------------------|--------------------------------------------------|----------------------------------------------------|
| Foco                 | Motivação (vitórias rápidas)                     | Economia de juros (otimização)                   | Baixa disciplina → Bola de Neve; alta → Avalanche  |
| Ordem de pagamento   | Menor saldo primeiro                              | Maior taxa de juros primeiro                     |                                                    |
| Efeito emocional     | Positivo rápido                                   | Pode ser mais lento                              |                                                    |
| Regras do sistema    | Marcar marcos;勋章 micro                          | Comparar economia total; alert para rebalancear |                                                    |

### Envelope Method (método dos envelopes)

O sistema cria envelopes por categoria com limites, uso progressivo e alertas quando o consumo se aproxima do fim. Há bloqueios preventivos e perguntar se a pessoa quer adiar uma compra por 24 horas, para criar espaço para reflexão. “Mostrar, não explicar” é a lógica: gráficos simples de saldo de envelope, indicação de cor (verde/amarelo/vermelho), microcopys de decisão. Em semanas atípicas, o usuário pode realocar saldo entre envelopes com um toque.

### Regra 50/30/20

A persona Iniciante se beneficia de uma versão simples: uma proposta de orçamento pré-configurada em 50/30/20 com alertas de alerta amarelo quando “desejos” se aproximam do limite. O sistema oferece ajustes conforme o perfil (autônomo com renda variável; iniciante que precisa priorizar quitação). O foco é transformar uma estrutura clara em rotina.

### Zero-Based Budgeting

A lógica é que cada Real tem destino: saldo livre não existe por padrão — ele é alocado para reserva, quitação de dívida ou meta. O usuário mantém histórico de versões do orçamento, o que permite comparar meses, ver padrões de gastos, e aprender com variações.

### Debt Snowball vs Debt Avalanche

O sistema de dívidas compara métodos e recomenda com transparência: se a disciplina for baixa, prioriza-se Bola de Neve com pequenas vitórias; se o perfil for otimizador e com conhecimento, Avalanche para economia de juros. A recomendação evita viés e apresenta prós e contras. Em ambos os casos, o progresso é reforçado com microconquistas.

### Princípios de educação financeira adulta

As diretrizes de educação financiera effective para adultos orientam o conteúdo: melhorar habilidades financeiras (saber encontrar, interpretar e agir), prover informação oportuna e conectada à decisão, construir sobre motivação (metas reais), simplificar boas decisões e oferecer suporte contínuo. A interface aplica “ação educa”: categorias, alertas e metas são também oportunidades de aprender.

## Funcionalidades prioritárias e regras de negócio

Para resolver as principais dores, as funcionalidades devem ser enxutas, com automações que reduzem carga cognitiva, e regras claras para estados e transições. A Tabela 5 organiza o portfólio de funcionalidades por dor e perfil.

Tabela 5 — Funcionalidade vs dor e perfil

| Funcionalidade                                   | Dor endereçada                                   | Perfis mais beneficiados                      |
|--------------------------------------------------|--------------------------------------------------|-----------------------------------------------|
| Categorização automática                         | “Dinheiro some”; falta de tempo                  | Sem Tempo; Iniciante                           |
| Relatórios simples e visuais                     | Excel difícil; frustração                        | Frustrado; Iniciante                           |
| Metas de quitação e reserva                      | Descontrole; ansiedade                           | Iniciante; Frustrado                           |
| Alertas de orçamento e dívidas                   | Impulso; prazos                                  | Gastador Impulsivo; Sem Tempo                  |
| Dashboards de saldo livre                        | Falta de clareza                                 | Iniciante; Sem Tempo                           |
| Conteúdo just-in-time                            | Falta de conhecimento                            | Iniciante; Frustrado                           |

As regras detalhadas de cada domínio (transações, orçamento, metas e alertas) tornam o produto previsível e reduzem erros de uso. O Dicionário de Dados (Tabela 6) define entidades essenciais e campos mínimos; a Matriz de Regras (Tabela 7) define condicionais e automações que explicam o “como” do produto, eliminando complexidade para o usuário.

Tabela 6 — Dicionário de Dados (Entidades e Campos Mínimos)

| Entidade      | Campos essenciais                                                                                       |
|---------------|----------------------------------------------------------------------------------------------------------|
| Usuário       | Nome; e-mail; telefone; perfil (Iniciante/Frustrado/Sem Tempo/Impulsivo); objetivo primário (sobra/divida/poupança) |
| Membro        | Nome; relação familiar; permissões básicas (visualizar; adicionar transações; administrar metas)        |
| Conta         | Tipo (conta corrente/poupança/cartão/dívida); apelido; instituição; saldo inicial                       |
| Categoria     | Tipo (essencial/supérfluo/poupança/dívida); envelope configurado; limites                                |
| Transação     | Data; valor; descrição; conta; categoria; origem (importação/manual); status (pendente/confirmada)       |
| Meta          | Nome; tipo (reserva/quitação/dívida/orçamento); meta de valor; prazo; estado; progresso                 |
| Alerta        | Tipo (limite de envelope; vencimento; orçamento); gatilho; linguagem (empática); canal (app/email/SMS)  |
| Conta de dívida | Nome do credor; saldo; taxa de juros; mínimo; status; método (Bola de Neve/Avalanche)                  |

Tabela 7 — Matriz de Regras de Negócio (Se/Então)

| Condição                                                                 | Ação/Automação                                                                                 |
|--------------------------------------------------------------------------|-------------------------------------------------------------------------------------------------|
| Se transação não categorizada por 48h                                    | Sugerir categoria com base em descrição; pedir confirmação; aprender com aceitações            |
| Se envelope “supérfluos” > 80% do limite                                 | Alerta amarelo; sugerir realocação; bloquear compras acima do limite (opcional)                |
| Se data de vencimento de dívida ≤ 7 dias                                 | Lembrete com opções: pagar mínimo, negociar, priorizar no plano; simular impacto               |
| Se renda mensal variável                                                 | Sugerir média móvel de 3 meses; recomendar envelope conservador                                |
| Se saldo livre > R$ X                                                    | Perguntar se deseja alocar em reserva; criar micro meta                                        |
| Se user sem transações em 7 dias                                         | Notificar; sugerir importação de extrato; mostrar progresso parcial                            |
| Se usuário excede envelope 2 semanas seguidas                            | Oferecer coaching leve; ajustar limites; sugerir método alternativo                            |

### Regras do módulo Transações

O sistema permite transações manuais e importação simplificada, com categorização automática baseada em descrições comuns e aprendizado incremental. Em duplicidade, utiliza heurísticas de valor, data, descrição e conta para identificar e consolidar. O feed de transações deve ser claro, rápido e perdão/undo dentro de um prazo curto (por exemplo, 5 minutos), para reduzir ansiedade por erro.

#### Estados de Transação

Tabela 8 — Máquina de Estados: Transação

| Estado       | Descrição                                    | Transições                                    |
|--------------|-----------------------------------------------|-----------------------------------------------|
| Pendente     | Importada; menunggu confirmação               | → Confirmada (pelo usuário ou validação)      |
| Confirmada   | Contabilizada no orçamento e dashboards       | → Estornada/Desfeita (undo)                   |
| Estornada    | Removida; ajuste nos saldos e categorias      | —                                             |

### Regras do módulo Orçamento

O orçamento inclui a Regra 50/30/20, Envelope e Zero-Based, com a possibilidade de ajustar por perfil e mês atípico. Metas de poupança e reserva mínima podem ser pré-configuradas; envelopes supérfluos podem ter bloqueios preventivos configuráveis para Gastador Impulsivo. A revisão semanal é incentivada com checklist simples e feedback.

#### Estados do Orçamento

Tabela 9 — Máquina de Estados: Orçamento

| Estado       | Descrição                                          | Transições                                 |
|--------------|------------------------------------------------------|--------------------------------------------|
| Proposto     | Rascunho inicial com metodologias e categorias      | → Ativo (aprovado pelo usuário)            |
| Ativo        | Em execução no mês; guiado por alertas e metas      | → Fechado (final do ciclo; relatório)      |
| Fechado      | Comparativo disponível; lições aprendidas           | → Proposto (novo ciclo)                    |

### Regras do módulo Metas

Metas são organizadas por tipo (reserva de emergência, quitação de dívida, supérfluos, orçamento), com progresso, marcos e recompensas leves. O plano de ação pode derivar da metodologia Bola de Neve ou Avalanche. O sistema permite realocar “sobra” para metas, alinhando o valor com objetivos declarados. Estados e transições precisam ser explícitos para gerar confiança.

#### Estados de Meta

Tabela 10 — Máquina de Estados: Meta

| Estado       | Descrição                                 | Transições                                              |
|--------------|--------------------------------------------|---------------------------------------------------------|
| Definida     | Nome, valor e prazo definidos               | → Ativa (início do plano)                               |
| Ativa        | Em progresso; pagamentos/ajustes incluídos  | → Pausada (user opta por pause); → Concluída (meta atingida) |
| Pausada      | Progresso interrompido; pode retomar        | → Ativa; → Abandonada (com feedback)                    |
| Concluída    | Meta atingida; feedback e próximo passo     | —                                                       |

### Regras do módulo Alertas

Alertas são triggers comportamentais que previnem problemas e oferecem opções de ação, em linguagem empática. Priorizam orçamento, dívidas e hábitos. O usuário controla preferências, canais (app, e-mail, SMS), horários e intensidade.

Tabela 11 — Catálogo de Alertas

| Tipo                        | Gatilho                                  | Mensagem (tônus)                                     | Ação sugerida                         | Canal           | Prioridade |
|-----------------------------|------------------------------------------|------------------------------------------------------|--------------------------------------|-----------------|-----------|
| Limite de envelope          | > 80% do limite                           | “Você está a R$ X do limite de ‘compras’.”           | Adiar compra em 24h; realocar valor  | App             | Alta      |
| Vencimento de dívida        | ≤ 7 dias                                  | “Sua dívida vence em X dias.”                        | Pagar; negociar; simular impacto     | App/E-mail      | Alta      |
| Orçamento mensal            | 3 dias antes do fechamento                | “Hora de revisar seu mês.”                           | Abrir checklist; ver dashboards      | App             | Média     |
| Hábito de revisão semanal   | 2 dias sem registrar transações           | “Vamos registrar suas últimas compras?”               | Importar extrato; categorizar        | App             | Baixa     |
| Microeconomia de impulso    | Compra atípica supérflua                  | “Isso se alinha ao seu plano?”                       | Confirmar; ajustar meta              | App             | Média     |

## Fluxo de onboarding para iniciantes

O onboarding segue quatro pilares de boa prática: foco no objetivo do usuário, remoção de fricções, personalização por perfil, e “antecipar o WOW” — em 7 dias, o usuário precisa ver saldo livre, orçamento simples, meta ativa e recomendação de reserva mínima. O sistema mostra, não explica; integra ação com educação; e dá recompensas proporcionais. O onboarding é contínuo, mantendo perspectiva de “day one” em todas as interações.

Personalização por perfil orienta perguntas e ofertas de valor:

- Iniciante Perdido: perguntas simples e validação positiva constante.
- Frustrado Anônimo: mostrar como relatórios e metas provam progresso.
- Sem Tempo: perguntar o mínimo e importar extratos rapidamente.
- Gastador Impulsivo: propor bloqueios e metas micro desde o início.

Tabela 12 — Mapa do Onboarding

| Passo                         | Objetivo                            | Ação do usuário                   | Critério de sucesso                         | Próxima ação                                 |
|------------------------------|-------------------------------------|-----------------------------------|---------------------------------------------|----------------------------------------------|
| Boas-vindas + perfil         |Personalizar jornada                  | Escolher perfil e objetivo         | Perfil e objetivo definidos                 | Sugerir método inicial                        |
| Renda e contas (mínimas)     |Calcular orçamento                    | Informar renda; adicionar 4 contas | Contas registradas                          | Gerar proposta de orçamento                   |
| Orçamento inicial            |Visualizar saldo livre                | Revisar envelopes                  | Saldo livre visível                         | Sugerir meta inicial                          |
| Importação/registro          |Reducer esforço                       | Importar extrato; registrar 3–5 transações | 5 transações processadas               | Configurar alertas                            |
| Alertas                      |Prevenir problemas                    | Aceitar alertas recomendados       | 2 alertas configurados                      | Convidar para microconteúdo                   |
| WOW Day 7                    |Provar valor                          | Ver dashboards; saldo livre        | Primeira sobra/ meta ativa                  | Encaminhar para coaching leve                 |

Tabela 13 — Perguntas de Onboarding por Persona

| Persona            | Perguntas-chave                                                   | Finalidade de personalização                             |
|--------------------|-------------------------------------------------------------------|----------------------------------------------------------|
| Iniciante Perdido  | “O que é mais urgente hoje: fazer sobrar ou quitar dívida?”      | Ajustar primeira meta e visibilidade de saldo livre      |
| Frustrado Anônimo  | “Você prefere ver progresso em pequenas vitórias ou economia de juros?” | Selecionar Bola de Neve vs Avalanche                     |
| Sem Tempo          | “Vamos importar seus extratos para acelerar?”                     | Minimizar esforço; ativar categorização automática       |
| Gastador Impulsivo | “Deseja bloqueios preventivos nas categorias de impulso?”         | Definir limites e alertas mais rígidos                   |

### Onboarding Day 0

Cadastro simplificado; escolha de perfil e objetivo; coleta mínima de renda e contas. O sistema gera o primeiro orçamento com categorias pré-mapeadas e mostra o saldo livre, que é a primeira prova de valor — “isso é o que você pode decidir hoje”.

### Onboarding Days 1–7

O sistema convida a importar transações e configurar alertas essenciais (limites de supérfluos, vencimentos de dívidas). A primeira meta é criada: reserva mínima ou quitação de dívida menor. O produto ativa microlearning prático: 5 minutos, ação e educação juntas. Em 7 dias, o usuário vê saldo livre,(meta ativa e alertas configurados.

## Sistema de metas e acompanhamento

As metas devem ser claras, alcançáveis e conectadas ao método de orçamento. A tipologia contempla: reserva de emergência, quitação de dívidas, consumo/supérfluos e orçamento mensal. Regras de cálculo mostram progresso e marcos, com feedback e recompensas leves. O sistema incentiva revisão semanal e realocação da “sobra” para objetivos, criando coerência entre decisão e planejamento.

Tabela 14 — Especificação de Metas

| Campo             | Descrição                                  | Tipo             | Validação                                   | Exemplo                           |
|-------------------|--------------------------------------------|------------------|---------------------------------------------|-----------------------------------|
| Nome              | Identificador da meta                      | Texto            | Obrigatório                                 | “Reserva de Emergência”           |
| Tipo              | Categoria da meta                          | Enum             | reserva/divida/supérfluos/orçamento         | “reserva”                         |
| Valor-alvo        | Valor objetivo                             | Número           | > 0                                         | R$ 1.000                          |
| Prazo             | Data alvo                                  | Data             | > hoje                                      | 31/12/2025                        |
| Valor atual       | Progresso acumulado                        | Número           | >= 0                                        | R$ 250                            |
| Estado            | Estado atual                               | Enum             | Definida/Ativa/Pausada/Concluída            | “Ativa”                           |
| Método (dívida)   | Bola de Neve ou Avalanche                  | Enum             | Opcional                                    | “Bola de Neve”                    |

Tabela 15 — Plano de Ação por Meta

| Meta                  | Ações recomendadas                                    | Frequência            | Observações                            |
|----------------------|--------------------------------------------------------|-----------------------|----------------------------------------|
| Reserva de emergência| Auto-transferência mensal; alertas de supérfluos       | Mensal                | Meta mínima sugerida                   |
| Quitação de dívida   | Priorização pelo método chosen; marcos e feedback      | Semanal/Mensal        | Simulações de economia                 |
| Supérfluos           | Limites e bloqueios; adiar compra 24h                  | Semanal               | Reforço positivo                       |
| Orçamento mensal     | Revisão semanal; ajuste de envelopes                   | Semanal               | Relatórios simples                     |

### Estados de Meta (detalhado)

Tabela 16 — Máquina de Estados: Meta

| Evento            | Estado inicial | Condição                            | Estado final   | Feedback                              |
|-------------------|----------------|-------------------------------------|----------------|---------------------------------------|
| Iniciar           | Definida       | Aceite de plano                      | Ativa          | “Meta iniciada. Você consegue.”       |
| Pausar            | Ativa          | Optou por pausa                      | Pausada        | “Pausada. Retoma quando quiser.”      |
| Retomar           | Pausada        | Reativar                             | Ativa          | “Retomada. Vamos em frente.”          |
| Completar         | Ativa          | Valor atual >= valor-alvo            | Concluída      | “Parabéns! Próximo passo: nova meta.” |
| Abandonar         | Ativa/Pausada  | Optou por abandonar                  | —              | “Feedback: por que abandonou?”        |

## Recursos de educação financeira integrados

A educação no sistema é contextual, unbiased e contínua. Os formatos combinam microlearning (5 minutos), checklists semanais, Q&A e coaching leve, acionados pela interface quando a ação é executada. Tópicos iniciais incluem: organização sem planilha, renda variável, adaptada para quem mora com pais ou em casa compartilhada, gestão de cartões, quitação de dívidas, e cronograma de resultados. A “ação educa” reduz a barreira de aprendizado e aumenta a autoconfiança.

Tabela 17 — Biblioteca de Conteúdo

| Tópico                           | Persona                | Momento de entrega (gatilho)             | Objetivo comportamental                         | Métrica de eficácia                           |
|----------------------------------|------------------------|-------------------------------------------|--------------------------------------------------|-----------------------------------------------|
| Organizar sem planilha           | Iniciante              | Após primeiro orçamento                    | Entender categorias e saldo livre                | % de orçamentos ativados                      |
| Renda variável: como ajustar     | Iniciante/Sem Tempo    | Ao detectar renda atípica                  | Ajustar envelopes com média móvel                | Taxa de ajustes aplicáveis                    |
| Casa com pais/compartilhada      | Iniciante/Frustrado    | Ao configurar orçamento                    | Separar gastos comuns e pessoais                 | % de categorias mapeadas                      |
| Cartões:控 e evitar endividamento| Iniciante/Frustrado    | Ao registrar transação de cartão           | Evitar rolamento de fatura                       | % de faturas pagas em dia                     |
| Quitação de dívidas              | Frustrado/Iniciante    | Ao criar meta de dívida                    | Escolher método; manter disciplina               | % de marcos atingidos                         |
| Quando verei resultados?         | Iniciante              | Após 7 dias                                | Manter engajamento; reduzir ansiedade            | Streak de revisão semanal                     |

### Coaching e suporte

O sistema oferece coaching leve (mensagens e sugestões), um botão “falar com um humano” e encaminhamento para serviços de apoio, quando necessário. O foco é o que o usuário pode fazer no dia, conectado às decisões que ele já está tomando na interface.

## Estratégias de gamificação para manter engajamento

A gamificação deve reforçar hábitos sem manipular. Streaks semanais, medalhas leves, níveis por consistência, microconquistas e desafios de 30 dias formam a base. Recompensas são preferencialmente não-monetárias: badges, reconhecimento, insights personalizados. Mecânicas anti-desistência incluem recuperação (absolve-se 1 dia de streak por semana), avisos empáticos e foco na próxima tarefa simples. O ciclo “ação → feedback → recompensa” mantém o avanço perceptível e emocionalmente positivo. Exemplos e práticas de gamificação em apps financeiros sustentam essa abordagem.[^1]

Tabela 18 — Mapa de Gamificação

| Comportamento-alvo             | Mecânica              | Frequência        | Recompensa                 | Métrica de sucesso                         |
|-------------------------------|-----------------------|-------------------|----------------------------|--------------------------------------------|
| Registrar transações          | Streak semanal        | Diário            | Badge “Consistente”        | Dias consecutivos com registro             |
| Revisar orçamento             | Checklist semanal     | Semanal           | Insight personalizado      | % de semanas revisadas                     |
| Quitar dívida (Bola de Neve)  | Marco de quitação     | Evento            | Badge “Vitória Rápida”     | Nº de dívidas quitadas                     |
| Não exceder envelope          | Nível por consistência| Semanal           | Progresso visível          | Semanas sem exceder                         |
| Microeconomia de impulso      | Desafio 30 dias       | Diário            | Reconhecimento             | Queda de gastos supérfluos                  |

### Estudo de caso Tindin (inspiração)

A Tindin ilustra educação econômico-financeira gamificada, engajando o público jovem com mecânicas de jogo que reforçam aprendizado e prática. O sistema pode adaptar elementos similares (recompensas leves, desafios semanais, níveis) ao contexto de gestão financeira familiar, mantendo foco em hábitos e decisões concretas.[^2]

### Recompensas e ética

Recompensas devem ser proporcionais ao esforço e evitar vieses que pressionem decisões financeiras. O sistema é transparente sobre o propósito dos pontos e badges, evita monetização direta que incentive risco, e expõe explicitamente o objetivo: formar hábitos saudáveis e reduzir ansiedade. A “ação educa” prevalece: cada recompensa é acompanhada de orientação breve que reforça a competência da pessoa usuária.

## Sistema de alertas e notificações inteligentes

O sistema previne problemas e apoia decisões com alertas proativos e empáticos. Triggers se baseiam em gastos, padrões, metas e prazos. Preferências são controladas pelo usuário: canais, horários, intensidade. A linguagem é always empática e oferece opções claras. Mecanismos anti-risco incluem supressão e deduplicação, limites por período e canal, e descanso (quiet hours). No ámbito das dívidas, o sistema oferece lembretes de vencimento e caminhos para negociação, orientando sobre direitos e ações.[^3]

Tabela 19 — Catálogo de Alertas (detalhado)

| Tipo                     | Condição de disparo                         | Mensagem                                             | Ação sugerida                              | Canal        | Prioridade | Preferência do usuário                 |
|--------------------------|---------------------------------------------|------------------------------------------------------|--------------------------------------------|-------------|-----------|----------------------------------------|
| Envelope supérfluos      | > 80% do limite                             | “Você está a R$ X do limite de ‘compras’.”           | Adiar 24h; realocar; ajustar meta          | App         | Alta      | Horário; canal; intensidade            |
| Vencimento de dívida     | ≤ 7 dias                                    | “Sua dívida vence em X dias.”                        | Pagar; negociar; simular impacto           | App/E-mail  | Alta      | Canal preferencial                     |
| Revisão semanal          | 3 dias sem interação                        | “Hora de revisar seu mês.”                           | Abrir checklist; ver dashboards            | App         | Média      | Quiet hours                             |
| Renda variável atípica   | Variação > 20% vs média                     | “Sua renda este mês variou. Ajustar envelopes?”      | Ajustar; usar média móvel                  | App         | Média      | Intensidade                             |
| Impulso (compra atípica) | Transação supérflua > R$ X                  | “Isso se alinha ao seu plano?”                       | Confirmar; adiar; alterar meta             | App         | Média      | Silenciar por período                   |
| Reserva mínima           | Saldo livre ≥ R$ X                          | “Você tem saldo livre. Alocar na reserva?”           | Alocar; criar/ajustar meta                 | App         | Baixa      | Frequência                              |

### Mecanismos de priorização e supressão

Regras de prioridade: alertas de risco (dívida; limite supérfluos) são priorizados; consolidado de baixa prioridade em digest semanal; silêncio em horários de descanso; deduplicação para evitar repetição; intervalos mínimos entre alertas similares. O sistema ajusta intensidade conforme engajamento: se o usuário ignora alertas de baixa prioridade, reduz-se a frequência; se responde bem, mantém-se.

## Métricas de sucesso e OKRs

Medir é essencial para melhorar. Os OKRs devem conectar dores e comportamentos: reducir “dinheiro que some” e compras por impulso, aumentar consistência de revisão e taxa de orçamentos ativados, e medir a primeira sobra no primeiro ciclo.

Tabela 20 — Matriz OKR/KPI

| Objetivo                         | Key Result                                   | Métrica                          | Baseline | Meta             | Fonte                           | Frequência |
|----------------------------------|----------------------------------------------|----------------------------------|----------|------------------|---------------------------------|-----------|
| Reduzir “dinheiro que some”      | Aumentar taxa de categorização               | % de transações categorizadas    | 60%      | ≥ 80%            | Módulo Transações               | Semanal   |
| Diminuir compras por impulso     | Reduzir gastos supérfluos                    | R$ supérfluos/mês                | R$ X     | -20%             | Módulo Orçamento                | Mensal    |
| Aumentar consistência            | 4 semanas com revisão semanal                | % usuários com streak 4 semanas  | 20%      | ≥ 40%            | Módulo Alertas; Checklist       | Semanal   |
| Ativação de orçamento            | Orçamentos ativados                          | % de perfis com orçamento ativo  | 40%      | ≥ 70%            | Módulo Orçamento                | Mensal    |
| Primeira sobra                   | Usuários com saldo livre > 0                 | % em 30 dias                     | 30%      | ≥ 60%            | Dashboard Metas; Orçamento      | Mensal    |
| Progresso em dívidas             | Dívidas quitadas (Bola de Neve)              | Nº por mês                       | 0        | ≥ 1 por usuário  | Módulo Metas (dívida)           | Mensal    |

Tabela 21 — Funil de Ativação

| Etapa                    | Descrição                                  | Indicador                        | Taxa alvo  |
|--------------------------|--------------------------------------------|----------------------------------|-----------|
| Cadastro                 | Perfil e objetivo definidos                | % de cadastros completos         | ≥ 80%     |
| Onboarding               | Orçamento e alertas configurados           | % de onboarding concluído        | ≥ 60%     |
| Primeira transação       | Registro/importação                        | % com ≥ 1 transação em 7 dias    | ≥ 70%     |
| Primeira meta            | Reserva ou quitação criada                 | % com ≥ 1 meta ativa em 14 dias  | ≥ 50%     |
| Primeira revisão         | Checklist semanal                          | % com revisão em 21 dias         | ≥ 40%     |

Tabela 22 — Painel de Engajamento

| Métrica                    | Definição                              | Segmento                | Periodicidade |
|---------------------------|-----------------------------------------|-------------------------|--------------|
| DAU/WAU                    | Usuários ativos diário/semana           | Por persona; método     | Semanal      |
| Streak semanal             | Semanas consecutivas com revisão        | Por perfil              | Semanal      |
| Abertura de alertas        | % de alertas abertos                    | Por tipo                | Semanal      |
| Taxa de categorização      | % de transações categorizadas           | Por origem (manual/importada) | Semanal   |
| “Primeira sobra”           | % de usuários com saldo livre > 0       | Por perfil              | Mensal       |

### Instrumentação e dados

Para calcular KPIs com confiabilidade, a instrumentação deve registrar eventos essenciais: transação criada; transação categorizada; orçamento proposto/ativo/fechado; meta criada/ativa/concluída; alerta disparado; alerta aberto/acao tomadastreak semanal; importação de extrato. A qualidade de dados depende de consistência de timestamps, deduplicação e monitoramento de erros de importação; disclaimers devem explicar limitações de automação.

## Roadmap, riscos e conformidade

O roadmap prioriza MVP enxuto com alto impacto, validação do problema e aprendizagem rápida; expansão por funcionalidades e integrações; e ekosistemização com conteúdo e coaching. Segurança e confiança são pilares: linguagem clara, dados mínimos e transparência em recomendações unbiased.

Tabela 23 — Roadmap por Fase

| Fase       | Objetivos                              | Entregas principais                                       | Critérios de saída                             | Dependências                   |
|------------|----------------------------------------|-----------------------------------------------------------|------------------------------------------------|--------------------------------|
| MVP        | Resolver dores core; validar problema  | Onboarding; orçamento (Envelope/50/30/20); metas; alertas | ≥ 60% orçamentos ativados; 30% “primeira sobra”| Dados mínimos; conteúdo básico |
| Expansão   | Aprofundar funcionalidades             | Zero-Based; Bola de Neve/Avalanche; relatórios            | ≥ 40% com revisão semanal; ≥ 50% metas ativas | Instrumentação; UX进阶         |
| Ecossistema| Conteúdo e coaching; integrações       | Biblioteca de conteúdo; coaching leve; importação ampla   | ↑ retenção 60 dias; ↓ churn                    | Parcerias; automação           |

Tabela 24 — Registro de Riscos

| Risco                         | Probabilidade | Impacto | Mitigação                                     | Proprietário         | Revisado em |
|------------------------------|---------------|---------|-----------------------------------------------|----------------------|------------|
| Complexidade indevida        | Média         | Alta    | MVP enxuto; UX simplificado                   | Produto; UX          | Mensal     |
| Desistência de usuários      | Alta          | Alta    | Gamificação leve; alertas empáticos           | Produto; Data        | Semanal    |
| Falhas de integração         | Média         | Média   | Fallbacks; importação manual                   | Engenharia           | Mensal     |
| Mensagens malinterpretadas   | Baixa         | Média   | Testes de linguagem; revisão jurídica          | Produto; Jurídico    | Trimestral |
| Automação de categorização   | Média         | Média   | Aprendizado incremental; feedback do usuário   | Data; Produto        | Semanal    |

Tabela 25 — Matriz de Conformidade

| Tema             | Medida                                 | Evidência                          | Status   |
|------------------|----------------------------------------|------------------------------------|----------|
| Transparência    | Mensagens unbiased; prós e contras     | Catálogo de mensagens; auditoria   | Ativo    |
| Privacidade      | Dados mínimos; controle de alertas     | Logs de preferências               | Ativo    |
| Consentimento    | Aceitação de termos e preferências     | Registro de consentimento          | Ativo    |
| Qualidade        | Disclaimers de automação               | Textos na interface; biblioteca     | Ativo    |

### MVP vs próxima fase

- MVP: onboarding em 3–5 passos; orçamento básico (Envelope/50/30/20); metas simples; alertas essenciais. Foco em reduzir complexidade e provar “primeira sobra”.
- Próxima fase: Zero-Based e metodologias de dívidas completas; relatórios; importação ampla; biblioteca de conteúdo e coaching leve; personalização mais fina por perfil.

### Limitações e lacunas de informação

Para calibração precisa (percentuais por método, cortes por faixa de renda, limiares de alertas), é necessário coletar dados de uso real e benchmarks locais. A validação com personas por segmento (renda baixa, autônomos, MEI, dependentes) deve informar ajustes finos de onboarding, metas e mensagens.

---

## Referências

[^1]: Yu-kai Chou. Top 10 Finance Gamification Examples. https://yukaichou.com/gamification-examples/top-10-finance-apps-for-2017-from-an-octalysis-gamification-perspective/

[^2]: Tindin - Educação Econômico-Financeira Gamificada. https://tindin.com.br/

[^3]: William Carvalho. COMO SAIR DAS DÍVIDAS com inteligência em 2025 - YouTube. https://www.youtube.com/watch?v=1Bmxri8umYE

[^4]: Relatório FINRED: Best Practices for Providing Financial Literacy Education. https://finred.usalearning.gov/assets/downloads/FINRED-BestPracticesReport-R.pdf