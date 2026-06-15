# 💰 Família Finanças

> O gerenciador financeiro definitivo para famílias brasileiras e portuguesas.

[![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=for-the-badge&logo=supabase&logoColor=white)](https://supabase.com)
[![React](https://img.shields.io/badge/React-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=for-the-badge&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)

## 📋 Sobre o Projeto

O **Família Finanças** é uma aplicação web moderna projetada para simplificar a gestão financeira familiar. Com foco em usabilidade e automação, o sistema ajuda famílias a controlar gastos, planejar orçamentos e alcançar metas financeiras.

### ✨ Funcionalidades Principais

- **Dashboard Intuitivo**: Visão geral clara de receitas, despesas e saldo.
- **Gestão de Transações**: Adicione, edite e categorize suas movimentações financeiras.
- **Importação de Extratos**: Upload de arquivos (PDF, CSV) para facilitar o registro.
- **Metas Financeiras**: Defina e acompanhe objetivos (ex: Reserva de Emergência, Viagem).
- **Orçamentos**: Controle de gastos por categoria (ex: Alimentação, Moradia).
- **Sistema de Alertas**: Notificações inteligentes sobre limites de gastos e dicas de economia.
- **Multi-moeda**: Suporte para Real (BRL) e Euro (EUR).

## 🚀 Começando

### Pré-requisitos

- Node.js (v18+)
- Conta no Supabase

### Instalação

1. Clone o repositório:
   ```bash
   git clone https://github.com/seu-usuario/familia-financas.git
   ```

2. Instale as dependências:
   ```bash
   cd familia-financas
   npm install
   ```

3. Configure as variáveis de ambiente:
   Crie um arquivo `.env` na raiz baseado no `.env.example` e adicione suas credenciais do Supabase.

4. Inicie o servidor de desenvolvimento:
   ```bash
   npm run dev
   ```

## 🔔 Sistema de Alertas

O sistema conta com alertas inteligentes exibidos no Dashboard:
- **Avisos de Limite**: Quando seus gastos atingem 90% da renda.
- **Sucesso**: Feedback positivo quando você economiza.
- **Dicas**: Sugestões para melhorar o uso da plataforma.
- **Persistência**: Você pode dispensar alertas e eles não voltarão a aparecer no mês atual.
- **Configuração**: Personalize quais tipos de alertas deseja receber na página de Configurações.

Consulte a [documentação completa dos alertas](docs/frontend/alerts-system.md) para mais detalhes técnicos.

## 🛠️ Tecnologias

- **Frontend**: React, Vite, TypeScript
- **Estilização**: Tailwind CSS, Lucide Icons
- **Backend**: Supabase (PostgreSQL, Auth, Storage, Edge Functions)
- **Deploy**: Vercel / Netlify (Frontend), Supabase (Backend)

## 📄 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.
