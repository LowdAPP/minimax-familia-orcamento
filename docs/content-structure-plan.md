# Plano de Estrutura de Conteúdo - SaaS Gestão Financeira Familiar

## 1. Inventário de Materiais

**Arquivos de Conteúdo:**
- `docs/dores_usuarios_financas.md` (6.500 palavras, 8 seções: contexto, metodologia, dores emocionais, dificuldades práticas, FAQ, problemas famílias brasileiras 2025, insights estratégicos)
- `docs/metodologias_financeiras.md` (4.800 palavras, 9 seções: resumo executivo, metodologia, fundamentos comportamentais, Envelope Method, 50/30/20, Zero-Based, Debt Snowball vs Avalanche, outras metodologias)
- `docs/regra_negocio_sistema.md` (7.200 palavras, 7 seções: resumo executivo, personas, metodologias traduzidas, funcionalidades, onboarding, metas, educação financeira, gamificação, alertas, métricas)

**Assets Visuais:**
- Nenhum arquivo de imagem específico fornecido (design irá especificar padrões visuais para ícones SVG, ilustrações de dados, gráficos)

**Dados de Referência:**
- Estatísticas de ansiedade financeira (66%, 84%, 45%)
- Perfis de personas (4 tipos: Iniciante Perdido, Frustrado Anônimo, Sem Tempo, Gastador Impulsivo)
- Metodologias financeiras (Envelope, 50/30/20, Zero-Based, Debt Snowball, Debt Avalanche)
- Regras de negócio (estados de transação, orçamento, metas, alertas)

## 2. Estrutura do Sistema

**Tipo:** SPA (Single Page Application) com múltiplas views

**Justificativa:** 
- Sistema dashboard interativo com navegação fluida entre seções
- Funcionalidades integradas que compartilham estado (transações, orçamento, metas)
- Experiência mobile-first requer transições suaves
- Menos de 8 páginas principais (Landing + 6 seções dashboard + Onboarding)
- Objetivo único coeso: gestão financeira familiar integrada

## 3. Estrutura de Páginas/Views

### Página 1: Landing Page (Marketing) - `/`

**Propósito:** Conversão de visitantes em usuários cadastrados

**Mapeamento de Conteúdo:**

| Seção | Padrão de Componente | Fonte de Dados | Conteúdo a Extrair | Asset Visual |
|-------|---------------------|----------------|--------------------|-----------------|
| Hero | Hero Pattern | `regra_negocio_sistema.md` L1-36 | Proposta de valor: "Fazer sobrar no primeiro mês" + problema (ansiedade financeira) | - |
| Problema | 3-column stat grid | `dores_usuarios_financas.md` L69-83 | Estatísticas: 66% ansiedade, 84% saúde mental afetada, 45% descontrole | - |
| Solução | Feature grid (4 cards) | `regra_negocio_sistema.md` L149-163 | 4 funcionalidades core: Categorização automática, Relatórios visuais, Metas, Alertas | - |
| Como Funciona | 3-step process | `regra_negocio_sistema.md` L249-269 | Onboarding: Perfil → Renda → Orçamento (em 5 minutos) | - |
| Metodologias | 2-column layout | `metodologias_financeiras.md` L63-105 | Envelope Method + 50/30/20 (evidências científicas) | - |
| Preço | Pricing card | Requisito do usuário | €29,97/ano + benefícios | - |
| CTA Final | Full-width CTA | `regra_negocio_sistema.md` L35-42 | "Comece grátis" + promessa primeira sobra | - |

---

### Página 2: Onboarding Flow - `/onboarding`

**Propósito:** Personalização inicial e ativação em 7 dias

**Mapeamento de Conteúdo:**

| Seção | Padrão de Componente | Fonte de Dados | Conteúdo a Extrair | Asset Visual |
|-------|---------------------|----------------|--------------------|-----------------|
| Passo 1: Perfil | Card com 4 opções | `regra_negocio_sistema.md` L62-81 | 4 personas: Iniciante Perdido, Frustrado Anônimo, Sem Tempo, Gastador Impulsivo | - |
| Passo 2: Renda/Contas | Form simples | `regra_negocio_sistema.md` L261-263 | Input: renda líquida + 4 contas principais | - |
| Passo 3: Orçamento Inicial | Budget proposal card | `regra_negocio_sistema.md` L264-266 | Visualização envelopes/50-30-20 com saldo livre | - |
| Passo 4: Primeira Meta | Goal wizard | `regra_negocio_sistema.md` L267-269 | Escolher: Reserva emergência OU Quitar dívida | - |
| Passo 5: WOW Moment | Dashboard preview | `regra_negocio_sistema.md` L280-285 | Mostrar saldo livre + meta ativa + alertas configurados | - |

---

### Página 3: Dashboard Principal - `/dashboard`

**Propósito:** Visão geral do estado financeiro (hub central)

**Mapeamento de Conteúdo:**

| Seção | Padrão de Componente | Fonte de Dados | Conteúdo a Extrair | Asset Visual |
|-------|---------------------|----------------|--------------------|-----------------|
| Header | Navigation Pattern | Design spec | Logo + Nav horizontal + CTA "Upgrade" | - |
| KPIs Principais | 4-card stat grid | `regra_negocio_sistema.md` L398-417 | Métricas: Saldo livre, Taxa poupança, Orçamento status, Próxima meta | - |
| Gráfico Mensal | Line chart | `metodologias_financeiras.md` L269-280 | Visualização receitas vs despesas (últimos 3 meses) | - |
| Alertas Ativos | Alert list (3-5 items) | `regra_negocio_sistema.md` L236-246 | Limite envelope, Vencimento dívida, Revisão semanal | - |
| Progresso Metas | Progress cards | `regra_negocio_sistema.md` L290-311 | Top 3 metas ativas com barra de progresso | - |
| Ações Rápidas | Button grid | `regra_negocio_sistema.md` L155-163 | Adicionar transação, Ver orçamento, Ajustar meta, Upload PDF | - |

---

### Página 4: Transações - `/transactions`

**Propósito:** Registro e categorização de movimentações financeiras

**Mapeamento de Conteúdo:**

| Seção | Padrão de Componente | Fonte de Dados | Conteúdo a Extrair | Asset Visual |
|-------|---------------------|----------------|--------------------|-----------------|
| Header de Ação | Action bar | `regra_negocio_sistema.md` L192-204 | Botões: Adicionar manual, Upload PDF, Filtros | - |
| Lista de Transações | Table/Card list | `regra_negocio_sistema.md` L166-178 | Campos: Data, Descrição, Valor, Categoria, Conta | - |
| Categorização Automática | Suggestion chips | `regra_negocio_sistema.md` L180-189 | Sugestões de categoria com aprendizado | - |
| Filtros | Horizontal tabs | `regra_negocio_sistema.md` L196-204 | Por: Data, Categoria, Conta, Status (pendente/confirmada) | - |
| Estados Visuais | Status badges | `regra_negocio_sistema.md` L197-203 | Pendente (amarelo), Confirmada (verde), Estornada (cinza) | - |

---

### Página 5: Orçamento - `/budget`

**Propósito:** Gerenciar envelopes e métodos de orçamento

**Mapeamento de Conteúdo:**

| Seção | Padrão de Componente | Fonte de Dados | Conteúdo a Extrair | Asset Visual |
|-------|---------------------|----------------|--------------------|-----------------|
| Seletor de Metodologia | Tab navigation | `regra_negocio_sistema.md` L98-148 | 3 métodos: Envelope, 50/30/20, Zero-Based | - |
| Envelope Method View | Category cards grid | `metodologias_financeiras.md` L63-100 | Cards por categoria com limite, gasto atual, saldo restante | - |
| 50/30/20 View | 3-section layout | `metodologias_financeiras.md` L106-131 | Necessidades (50%), Desejos (30%), Poupança/Dívidas (20%) | - |
| Zero-Based View | Allocation editor | `metodologias_financeiras.md` L133-165 | Alocação de cada Real com saldo zero no final | - |
| Progresso Mensal | Donut chart | `regra_negocio_sistema.md` L207-218 | Visualização categorias com % gasto vs limite | - |
| Ajustes Rápidos | Inline editors | `regra_negocio_sistema.md` L180-189 | Realocação entre envelopes com drag-drop | - |

---

### Página 6: Metas e Dívidas - `/goals`

**Propósito:** Acompanhar objetivos financeiros e quitação de dívidas

**Mapeamento de Conteúdo:**

| Seção | Padrão de Componente | Fonte de Dados | Conteúdo a Extrair | Asset Visual |
|-------|---------------------|----------------|--------------------|-----------------|
| Metas Ativas | Card grid | `regra_negocio_sistema.md` L290-323 | Reserva emergência, Quitação dívida, Supérfluos, Orçamento mensal | - |
| Criação de Meta | Modal wizard | `regra_negocio_sistema.md` L293-301 | Form: Nome, Tipo, Valor-alvo, Prazo, Método (se dívida) | - |
| Métodos de Dívida | Comparison table | `metodologias_financeiras.md` L167-187 | Debt Snowball vs Debt Avalanche (prós/contras) | - |
| Plano de Quitação | Timeline visual | `regra_negocio_sistema.md` L303-311 | Lista dívidas ordenadas + marcos de quitação | - |
| Progresso | Progress bars + badges | `regra_negocio_sistema.md` L313-323 | Estados: Definida, Ativa, Pausada, Concluída | - |
| Calculadora | Debt calculator | `metodologias_financeiras.md` L173-177 | Simular economia de juros (Avalanche) vs tempo (Snowball) | - |

---

### Página 7: Educação Financeira - `/learn`

**Propósito:** Conteúdo educativo contextual (just-in-time)

**Mapeamento de Conteúdo:**

| Seção | Padrão de Componente | Fonte de Dados | Conteúdo a Extrair | Asset Visual |
|-------|---------------------|----------------|--------------------|-----------------|
| Tópicos Principais | Card grid | `regra_negocio_sistema.md` L326-337 | 6 tópicos: Organizar sem planilha, Renda variável, Casa compartilhada, Cartões, Quitação dívidas, Quando ver resultados | - |
| Microlearning | Article pattern | `dores_usuarios_financas.md` L133-162 | FAQ: Como separar gastos, Funciona sem Excel, Renda variável, Investir ou quitar | - |
| Checklists Semanais | Checklist component | `regra_negocio_sistema.md` L241-246 | Revisão orçamento, Categorizar transações, Ajustar metas | - |
| Recursos Externos | Link cards | `metodologias_financeiras.md` L260-347 | Artigos científicos sobre metodologias | - |
| Progresso Educacional | Badge collection | `regra_negocio_sistema.md` L343-363 | Badges: "Consistente", "Vitória Rápida", reconhecimentos | - |

---

### Página 8: Configurações - `/settings`

**Propósito:** Preferências de alertas, contas, assinatura

**Mapeamento de Conteúdo:**

| Seção | Padrão de Componente | Fonte de Dados | Conteúdo a Extrair | Asset Visual |
|-------|---------------------|----------------|--------------------|-----------------|
| Perfil Usuário | Form sections | `regra_negocio_sistema.md` L170-172 | Nome, E-mail, Telefone, Perfil selecionado | - |
| Contas Financeiras | List + CRUD | `regra_negocio_sistema.md` L173 | Tipo, Apelido, Instituição, Saldo inicial | - |
| Preferências de Alertas | Toggle list | `regra_negocio_sistema.md` L369-378 | Canal (app/email/SMS), Horários, Intensidade, Quiet hours | - |
| Assinatura | Billing card | Requisito usuário | Status: Ativo €29,97/ano, Próxima cobrança, Histórico | - |
| Dados e Privacidade | Settings panel | `regra_negocio_sistema.md` L445-453 | Transparência, Privacidade, Consentimento | - |

---

## 4. Análise de Conteúdo

**Densidade de Informação:** Alta

**Justificativa:**
- 18.500 palavras de conteúdo de referência
- Sistema complexo com múltiplas funcionalidades integradas
- Necessidade de educação financeira contextual
- Dados financeiros densos (transações, orçamentos, metas)

**Balanço de Conteúdo:**

- **Texto:** 18.500 palavras (~60%) - Alta densidade de regras de negócio, metodologias, personas
- **Dados/Visualizações:** ~30% - Gráficos, tabelas, KPIs, dashboards
- **Imagens:** ~10% - Ícones SVG, ilustrações de dados (não fotos/imagens decorativas)

**Tipo de Conteúdo:** Misto - Data-driven + Educacional

**Características:**
- Dashboard denso com múltiplos KPIs e visualizações
- Conteúdo educativo extenso (FAQ, metodologias, guias)
- Transações e dados financeiros estruturados
- Gamificação visual (badges, progresso, streaks)
- Sistema de alertas com mensagens contextuais

**Implicações de Design:**
- Hierarquia visual clara essencial (evitar sobrecarga cognitiva)
- Espaçamento generoso entre seções (48-96px) para "respirar"
- Tipografia escalável (16px base, até 64px hero)
- Componentes de dados visuais (charts, progress bars, stat cards)
- Sistema de cores com neutrals 90% para reduzir ansiedade
- Icons SVG consistentes (Lucide/Heroicons) para navegação

**Observação:** Nenhuma imagem decorativa de background ou hero será especificada. Design focará em padrões visuais através de componentes, ícones SVG e visualização de dados (gráficos, tabelas, cards).
