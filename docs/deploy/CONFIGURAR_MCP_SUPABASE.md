# 🚀 Configurar MCP do Supabase no Cursor

## O que é MCP?
MCP (Model Context Protocol) permite que o Cursor se conecte diretamente ao seu projeto Supabase, permitindo executar queries SQL, aplicar migrations e gerenciar o banco de dados diretamente pela interface.

## 📋 Passo a Passo

### 1. Acessar Dashboard do Supabase
1. Vá para: https://supabase.com/dashboard
2. Selecione seu projeto: **qkmuypctpuyoouqfatjf**
3. No menu lateral, procure por **"MCP"** ou **"AI Tools"**
4. Clique em **"Connect"** ou **"MCP"**

### 2. Configurar no Cursor

#### Opção A: Configuração Automática (Recomendado)
1. No Supabase Dashboard, vá em **MCP** → **Connect**
2. Selecione o cliente: **Cursor**
3. Escolha os grupos de recursos que deseja habilitar:
   - ✅ Database (para executar SQL)
   - ✅ Migrations (para aplicar migrations)
   - ⚠️ Storage (opcional, apenas se necessário)
4. Clique em **"Generate Config"** ou **"Copy Config"**
5. O Supabase vai gerar um JSON de configuração

#### Opção B: Configuração Manual

1. **Localizar arquivo de configuração do Cursor:**
   - No macOS: `~/.cursor/mcp.json` ou `~/.cursor/config.json`
   - Ou através das configurações do Cursor: `Cmd + ,` → procurar por "MCP"

2. **Criar/Editar o arquivo de configuração:**

Se o arquivo não existir, crie em: `~/.cursor/mcp.json`

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp",
      "headers": {
        "Authorization": "Bearer SEU_ACCESS_TOKEN"
      }
    }
  }
}
```

### 3. Obter Access Token (se necessário)

Se precisar de autenticação manual:

1. No Supabase Dashboard, vá em **Settings** → **Access Tokens**
2. Clique em **"Generate New Token"**
3. Dê um nome (ex: "Cursor MCP")
4. Selecione os escopos necessários:
   - ✅ `projects:read`
   - ✅ `database:read`
   - ✅ `database:write` (para aplicar migrations)
5. Copie o token gerado
6. Cole no arquivo de configuração no lugar de `SEU_ACCESS_TOKEN`

### 4. Autenticação OAuth (Alternativa)

O Cursor pode abrir uma janela do navegador para autenticação OAuth:

1. Quando configurar o MCP, o Cursor vai pedir para fazer login
2. Uma janela do navegador vai abrir
3. Faça login no Supabase
4. Autorize o acesso ao projeto
5. Selecione a organização que contém o projeto

### 5. Verificar Configuração

Após configurar:

1. Reinicie o Cursor completamente
2. Tente usar o MCP executando uma query simples
3. Se funcionar, você verá o servidor "supabase" disponível nas ferramentas

## 🔒 Segurança (IMPORTANTE!)

⚠️ **Siga estas práticas de segurança:**

1. **Use apenas em desenvolvimento**: Não conecte o MCP a projetos de produção
2. **Modo somente leitura**: Se possível, configure como somente leitura
3. **Escopo limitado**: Habilite apenas os recursos necessários
4. **Token seguro**: Guarde o token com segurança, não commite no git

## 🧪 Testar se Funcionou

Após configurar, você pode testar executando:

```typescript
// O MCP deve estar disponível como ferramenta
// Tente executar uma query simples
```

## 📝 Configuração Recomendada para Este Projeto

Para este projeto, recomendo habilitar:

```json
{
  "mcpServers": {
    "supabase": {
      "type": "http",
      "url": "https://mcp.supabase.com/mcp",
      "projectId": "qkmuypctpuyoouqfatjf",
      "resources": [
        "database",
        "migrations"
      ]
    }
  }
}
```

## 🐛 Problemas Comuns

### "MCP server not available"
- **Solução**: Verifique se o arquivo de configuração está no local correto
- **Solução**: Reinicie o Cursor completamente
- **Solução**: Verifique se o token está correto

### "Authentication failed"
- **Solução**: Gere um novo token no Supabase Dashboard
- **Solução**: Verifique se o token não expirou
- **Solução**: Tente usar autenticação OAuth

### "Cannot connect to MCP server"
- **Solução**: Verifique sua conexão com a internet
- **Solução**: Verifique se a URL está correta: `https://mcp.supabase.com/mcp`

## 📚 Referências

- [Documentação Oficial Supabase MCP](https://supabase.com/docs/guides/getting-started/mcp)
- [Práticas de Segurança Supabase](https://supabase.com/docs/guides/getting-started/mcp#step-1-follow-our-security-best-practices)

## ✅ Checklist

- [ ] Acessei o Supabase Dashboard
- [ ] Encontrei a seção MCP/AI Tools
- [ ] Configurei o cliente Cursor
- [ ] Gerei/obtive o Access Token (se necessário)
- [ ] Criei/editei o arquivo `~/.cursor/mcp.json`
- [ ] Reiniciei o Cursor
- [ ] Testei executando uma query simples
- [ ] Funcionou! 🎉

