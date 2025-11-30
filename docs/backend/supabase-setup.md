# Instruções de Setup do Backend Supabase

## Passo 1: Executar Migration SQL

1. Acesse o Supabase Dashboard: https://supabase.com/dashboard/project/odgjjncxcseuemrwskip
2. Vá em **SQL Editor** no menu lateral
3. Clique em **New Query**
4. Copie todo o conteúdo do arquivo `supabase/migrations/001_create_complete_schema.sql`
5. Cole no editor e clique em **RUN**
6. Verifique se todas as tabelas foram criadas sem erros

## Passo 2: Criar Storage Buckets

1. Acesse **Storage** no menu lateral do Supabase Dashboard
2. Clique em **Create bucket**

### Bucket 1: bank-statements
- **Nome:** `bank-statements`
- **Public:** ❌ Não (private)
- **File size limit:** 10 MB
- **Allowed MIME types:** `application/pdf`

**Políticas RLS (criar após criação do bucket):**
```sql
-- Política de leitura (usuário pode ler apenas seus próprios PDFs)
CREATE POLICY "Users can read own bank statements"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'bank-statements' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política de upload
CREATE POLICY "Users can upload own bank statements"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bank-statements' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- Política de deleção
CREATE POLICY "Users can delete own bank statements"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'bank-statements' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);
```

### Bucket 2: user-avatars (opcional)
- **Nome:** `user-avatars`
- **Public:** ✅ Sim (para exibição de avatares)
- **File size limit:** 2 MB
- **Allowed MIME types:** `image/jpeg, image/png, image/webp`

## Passo 3: Configurar Authentication

1. Acesse **Authentication** > **Providers** no Supabase Dashboard
2. Habilite **Email** provider
3. Configure **Email Templates** (opcional):
   - Confirmation email
   - Password recovery email

## Passo 4: Verificar Environment Variables

As seguintes variáveis já estão configuradas:
- `SUPABASE_URL`: https://odgjjncxcseuemrwskip.supabase.co
- `SUPABASE_PROJECT_ID`: odgjjncxcseuemrwskip
- `SUPABASE_ANON_KEY`: (disponível no Dashboard > Settings > API)
- `SUPABASE_SERVICE_ROLE_KEY`: (disponível no Dashboard > Settings > API)

## Passo 5: Deploy das Edge Functions

Após a execução da migration SQL, as Edge Functions serão deployadas automaticamente:

1. `pdf-parser` - Upload e parsing de PDFs bancários
2. `transaction-categorizer` - Categorização automática de transações
3. `alert-engine` - Sistema de alertas inteligentes
4. `budget-calculator` - Cálculo de orçamentos
5. `debt-optimizer` - Simulação Snowball vs Avalanche

## Verificação Final

Execute o seguinte comando SQL para verificar todas as tabelas criadas:

```sql
SELECT table_name 
FROM information_schema.tables 
WHERE table_schema = 'public' 
ORDER BY table_name;
```

**Tabelas esperadas:**
- user_profiles
- accounts
- categories
- transactions
- budgets
- budget_envelopes
- goals
- debt_payoff_plans
- debt_items
- alerts
- gamification_achievements

## Próximo Passo

Após confirmar que o setup do backend está completo, o frontend React será desenvolvido e integrado automaticamente.
