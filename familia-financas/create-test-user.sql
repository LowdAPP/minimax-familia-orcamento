-- Inserir usuário no auth.users
INSERT INTO auth.users (
  id,
  instance_id,
  aud,
  role,
  email,
  encrypted_password,
  email_confirmed_at,
  created_at,
  updated_at,
  confirmation_token
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  '00000000-0000-0000-0000-000000000000',
  'authenticated',
  'authenticated',
  'teste@teste.com',
  crypt('123456', gen_salt('bf')),
  now(),
  now(),
  now(),
  ''
) ON CONFLICT (email) DO NOTHING;

-- Inserir perfil
INSERT INTO public.user_profiles (
  id,
  persona_type,
  primary_goal,
  monthly_income,
  onboarding_completed,
  preferred_language
) VALUES (
  '11111111-1111-1111-1111-111111111111',
  'iniciante_perdido',
  'controlar_gastos',
  3500,
  false,
  'pt-BR'
) ON CONFLICT (id) DO NOTHING;
