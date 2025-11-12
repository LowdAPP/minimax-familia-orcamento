-- Migration: fix_storage_policies
-- Created at: 1762522239

-- Habilitar RLS no storage.objects se estiver desabilitado
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;

-- Criar política para permitir upload no bucket agent-uploads
CREATE POLICY "Allow uploads to agent-uploads bucket" ON storage.objects
FOR INSERT 
TO public
WITH CHECK (
    bucket_id = 'agent-uploads' AND 
    auth.role() = 'authenticated'
);

-- Criar política para permitir leitura do bucket agent-uploads
CREATE POLICY "Allow reading from agent-uploads bucket" ON storage.objects
FOR SELECT 
TO public
USING (bucket_id = 'agent-uploads');

-- Criar política para service_role
CREATE POLICY "Service role full access to storage" ON storage.objects
FOR ALL
TO service_role
USING (true)
WITH CHECK (true);

-- Verificar as políticas
SELECT schemaname, tablename, policyname, cmd, roles 
FROM pg_policies 
WHERE tablename = 'objects' AND schemaname = 'storage';;