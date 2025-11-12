import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
  'https://qkmuypctpuyoouqfatjf.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFrbXV5cGN0cHV5b291cWZhdGpmIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjIzNzI3NzEsImV4cCI6MjA3Nzk0ODc3MX0.pcJcYy-NUXNhR2oiTVVI0vrIqjR4L5MbyElzGTymXEM'
);

async function testUpdateProfile() {
  console.log('1. Fazendo login...');
  const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
    email: 'teste@teste.com',
    password: '123456'
  });
  
  if (authError) {
    console.error('Erro no login:', authError);
    return;
  }
  
  console.log('Login bem-sucedido! User ID:', authData.user.id);
  
  console.log('\n2. Testando UPDATE (via upsert)...');
  const { data: updateData, error: updateError } = await supabase
    .from('user_profiles')
    .upsert(
      {
        id: authData.user.id,
        monthly_income: 8000,
        preferred_language: 'pt-PT',
        updated_at: new Date().toISOString()
      },
      { onConflict: 'id' }
    )
    .select()
    .maybeSingle();
  
  if (updateError) {
    console.error('ERRO ao atualizar perfil:', updateError);
    return;
  }
  
  console.log('UPDATE bem-sucedido!');
  console.log('Dados atualizados:', JSON.stringify(updateData, null, 2));
  
  console.log('\n3. Verificando se foi persistido...');
  const { data: checkData, error: checkError } = await supabase
    .from('user_profiles')
    .select('*')
    .eq('id', authData.user.id)
    .maybeSingle();
  
  if (checkError) {
    console.error('Erro ao verificar:', checkError);
    return;
  }
  
  console.log('Perfil atual:', JSON.stringify(checkData, null, 2));
  
  if (checkData.monthly_income == 8000 && checkData.preferred_language === 'pt-PT') {
    console.log('\n✓ SUCCESS: Perfil foi salvo corretamente!');
  } else {
    console.log('\n✗ FAIL: Valores não foram salvos corretamente');
  }
}

testUpdateProfile().catch(console.error);
