# Guia de Debug - Upload de PDF

## Problema
Erro ao tentar enviar PDF para processamento.

## Passos para Debug

### 1. Verificar se a Edge Function está Deployada

A edge function `pdf-parser` precisa estar deployada no Supabase. Para verificar:

1. Acesse o Dashboard do Supabase: https://supabase.com/dashboard/project/qkmuypctpuyoouqfatjf
2. Vá em **Edge Functions** no menu lateral
3. Verifique se `pdf-parser` está listada e com status **ACTIVE**

### 2. Deploy da Edge Function (se necessário)

Se a edge function não estiver deployada, execute:

```bash
cd familia-financas
supabase functions deploy pdf-parser --project-ref qkmuypctpuyoouqfatjf
```

### 3. Verificar Variáveis de Ambiente

Certifique-se de que o arquivo `.env` ou `.env.local` contém:

```env
VITE_SUPABASE_URL=https://qkmuypctpuyoouqfatjf.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

### 4. Verificar Console do Navegador

Ao tentar fazer upload, abra o Console do Navegador (F12) e verifique:

1. **Logs de envio**: Deve aparecer `📤 Enviando PDF para edge function...`
2. **Logs de resposta**: Deve aparecer `📥 Resposta recebida:` com status HTTP
3. **Erros**: Qualquer erro será logado com `❌`

### 5. Erros Comuns e Soluções

#### Erro 404 - Not Found
**Causa**: Edge function não está deployada
**Solução**: Fazer deploy da edge function (passo 2)

#### Erro 401 - Unauthorized
**Causa**: Sessão expirada ou token inválido
**Solução**: Fazer logout e login novamente

#### Erro 500 - Internal Server Error
**Causa**: Erro na edge function
**Solução**: Verificar logs da edge function no Dashboard do Supabase

#### Erro "Failed to fetch" ou "NetworkError"
**Causa**: Problema de conexão ou CORS
**Solução**: 
- Verificar conexão com internet
- Verificar se a URL do Supabase está correta
- Verificar se não há bloqueador de CORS no navegador

### 6. Testar Edge Function Manualmente

Você pode testar a edge function diretamente usando curl:

```bash
# 1. Obter token de autenticação (faça login no app e copie o token do localStorage)
TOKEN="seu_token_aqui"

# 2. Testar a edge function
curl -X POST \
  https://qkmuypctpuyoouqfatjf.supabase.co/functions/v1/pdf-parser \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/caminho/para/seu/arquivo.pdf" \
  -F "user_id=seu_user_id" \
  -F "account_id=seu_account_id"
```

### 7. Verificar Logs da Edge Function

No Dashboard do Supabase:
1. Vá em **Edge Functions** > **pdf-parser**
2. Clique em **Logs**
3. Verifique os logs mais recentes para identificar erros

### 8. Verificar Permissões RLS

Certifique-se de que as políticas RLS estão corretas:

```sql
-- Verificar políticas da tabela transactions
SELECT * FROM pg_policies WHERE tablename = 'transactions';
```

## Informações para Suporte

Se o problema persistir, forneça:

1. **Status HTTP** da resposta (ver no console do navegador)
2. **Mensagem de erro completa** (ver no console)
3. **Logs da edge function** (Dashboard do Supabase)
4. **Tamanho do arquivo PDF** (arquivos muito grandes podem causar timeout)
5. **Formato do PDF** (alguns PDFs protegidos ou escaneados não funcionam)

