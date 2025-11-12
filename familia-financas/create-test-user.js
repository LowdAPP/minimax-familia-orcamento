import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qkmuypctpuyoouqfatjf.supabase.co',
  'sb_secret_B62aCzQBfywN6yOdClgrWQ_zT4wy212'
);

async function createTestUser() {
  console.log('Criando usuário de teste...');
  
  // Criar usuário
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email: 'teste@teste.com',
    password: '123456',
    email_confirm: true
  });
  
  if (authError) {
    console.error('Erro ao criar usuário:', authError);
    return;
  }
  
  console.log('Usuário criado:', authData.user.id);
  
  // Criar perfil
  const { error: profileError } = await supabase
    .from('user_profiles')
    .insert({
      id: authData.user.id,
      persona_type: 'iniciante_perdido',
      primary_goal: 'controlar_gastos',
      monthly_income: 3500,
      onboarding_completed: false,
      preferred_language: 'pt-BR'
    });
  
  if (profileError) {
    console.error('Erro ao criar perfil:', profileError);
  } else {
    console.log('Perfil criado com sucesso!');
  }
}

createTestUser();
