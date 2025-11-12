-- Melhorar políticas RLS do storage para agent-uploads
-- Garantir que usuários autenticados possam fazer upload apenas em suas próprias pastas

-- Remover política antiga de INSERT (muito permissiva)
DROP POLICY IF EXISTS "Allow anon uploads to agent-uploads" ON storage.objects;

-- Criar nova política de INSERT mais específica
-- Usuários autenticados podem fazer upload apenas em pastas com seu próprio user_id
CREATE POLICY "Users can upload to own folder in agent-uploads" ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'agent-uploads' 
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Verificar se políticas de SELECT, UPDATE e DELETE estão corretas
-- (Já existem, mas vamos recriar para garantir consistência)

-- DROP existentes primeiro
DROP POLICY IF EXISTS "Allow authenticated to read agent-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to update agent-uploads" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated to delete agent-uploads" ON storage.objects;

-- Recriar SELECT policy
CREATE POLICY "Users can read own files in agent-uploads" ON storage.objects
FOR SELECT
USING (
  bucket_id = 'agent-uploads'
  AND (
    auth.role() = 'authenticated'
    AND (storage.foldername(name))[1] = auth.uid()::text
  )
);

-- Recriar UPDATE policy
CREATE POLICY "Users can update own files in agent-uploads" ON storage.objects
FOR UPDATE
USING (
  bucket_id = 'agent-uploads'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Recriar DELETE policy
CREATE POLICY "Users can delete own files in agent-uploads" ON storage.objects
FOR DELETE
USING (
  bucket_id = 'agent-uploads'
  AND auth.role() = 'authenticated'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
