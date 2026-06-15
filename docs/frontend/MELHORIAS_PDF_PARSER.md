# Melhorias no PDF Parser

## Problema Identificado
O PDF "Extrato empresa outubro.pdf" não estava sendo parseado corretamente, retornando 0 transações.

## Melhorias Implementadas

### 1. Extração de Texto Melhorada
- **Múltiplos métodos de extração**:
  - Strings entre parênteses `(texto)` - formato padrão PDF
  - Strings entre colchetes `[texto]` - formato alternativo
  - Extração raw de caracteres legíveis
  - Extração de streams PDF (formato complexo)
- **Decodificação de escape sequences**: `\n`, `\r`, `\t`, etc.
- **Logs detalhados** da extração

### 2. Padrões Regex Adicionais
Adicionados 3 novos padrões para capturar diferentes formatos:

1. **Formato Tabela**: `Data | Descrição | Valor` (com separadores `|` ou tabs)
2. **Formato Extrato Empresa**: Mais flexível, aceita datas com 1-2 dígitos
3. **Formato com Espaços Múltiplos**: Para PDFs com espaçamento irregular

### 3. Logs de Debug Melhorados
Quando nenhuma transação é encontrada, a edge function agora loga:
- Primeiros 2000 caracteres do texto extraído
- Datas encontradas no texto
- Valores encontrados no texto
- Linhas que parecem transações (contêm data + valor)

## Como Fazer o Deploy

### Opção 1: Via Supabase CLI
```bash
cd familia-financas
supabase functions deploy pdf-parser --project-ref qkmuypctpuyoouqfatjf
```

### Opção 2: Via Dashboard
1. Acesse: https://supabase.com/dashboard/project/qkmuypctpuyoouqfatjf
2. Vá em **Edge Functions** > **pdf-parser**
3. Cole o conteúdo de `familia-financas/supabase/functions/pdf-parser/index.ts`
4. Clique em **Deploy**

## Teste Após Deploy

1. Faça upload do PDF novamente
2. Verifique os logs da edge function no Dashboard do Supabase
3. Os logs mostrarão:
   - Texto extraído (primeiros 2000 caracteres)
   - Datas e valores encontrados
   - Linhas que parecem transações
   - Qual padrão regex foi testado

## Próximos Passos

Se ainda não funcionar após o deploy:

1. **Verifique os logs** da edge function no Dashboard
2. **Copie uma amostra** do texto extraído dos logs
3. **Compartilhe** a amostra para ajustar os padrões regex específicos do seu formato

## Estrutura dos Logs

Após o deploy, você verá logs como:

```
⚠️ DEBUG - Nenhuma transação encontrada
📄 Tamanho do texto extraído: 9759 caracteres
📄 Primeiros 2000 caracteres do texto:
================================================================================
[texto extraído aqui]
================================================================================
📅 Datas encontradas no texto: ['01/10/2024', '02/10/2024', ...]
💰 Valores encontrados no texto: ['1.234,56 EUR', '567,89 EUR', ...]
📋 Linhas que parecem transações: ['01/10/2024 Pagamento XYZ 123,45 EUR', ...]
```

Esses logs ajudarão a identificar o formato exato do seu PDF e ajustar os padrões se necessário.

