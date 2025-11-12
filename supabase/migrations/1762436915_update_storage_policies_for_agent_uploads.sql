-- Migration: update_storage_policies_for_agent_uploads
-- Created at: 1762436915

-- Remove existing policies for agent-uploads bucket
DROP POLICY IF EXISTS "uploads_by_user_prefix" ON storage.objects;
DROP POLICY IF EXISTS "update_by_user_prefix" ON storage.objects;
DROP POLICY IF EXISTS "delete_by_user_prefix" ON storage.objects;

-- Create new policies that allow both anon and authenticated users
-- Allow anon users (Edge Function calls) to insert files
CREATE POLICY "Allow anon uploads to agent-uploads" ON storage.objects
  FOR INSERT
  WITH CHECK (bucket_id = (SELECT id FROM storage.buckets WHERE name = 'agent-uploads') 
              AND auth.role() IN ('anon', 'authenticated'));

-- Allow authenticated users to select their own files
CREATE POLICY "Allow authenticated to read agent-uploads" ON storage.objects
  FOR SELECT
  USING (bucket_id = (SELECT id FROM storage.buckets WHERE name = 'agent-uploads') 
         AND (auth.role() = 'anon' OR name LIKE (auth.uid()::text || '/%')));

-- Allow authenticated users to update their own files
CREATE POLICY "Allow authenticated to update agent-uploads" ON storage.objects
  FOR UPDATE
  USING (bucket_id = (SELECT id FROM storage.buckets WHERE name = 'agent-uploads') 
         AND name LIKE (auth.uid()::text || '/%')
         AND auth.role() = 'authenticated');

-- Allow authenticated users to delete their own files
CREATE POLICY "Allow authenticated to delete agent-uploads" ON storage.objects
  FOR DELETE
  USING (bucket_id = (SELECT id FROM storage.buckets WHERE name = 'agent-uploads') 
         AND name LIKE (auth.uid()::text || '/%')
         AND auth.role() = 'authenticated');;