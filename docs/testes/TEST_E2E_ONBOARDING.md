# Teste End-to-End: Correção Loop Onboarding e Salvar Perfil

## URL de Teste
https://lqbckpj0jl6i.space.minimax.io

## Data
2025-11-07

## Objetivos do Teste
1. ✅ Login bem-sucedido
2. ✅ Conclusão do onboarding (se necessário)
3. ✅ Navegação livre pós-onboarding
4. ✅ Acesso à página de Configurações
5. ✅ Salvamento de perfil funcional
6. ✅ Persistência de dados após refresh

## Credenciais
- Email: teste@teste.com
- Senha: 123456

## Cenários de Teste

### Cenário 1: Usuário Novo (Onboarding Incompleto)
- [ ] Login → Redireciona para onboarding
- [ ] Completar 5 etapas do onboarding
- [ ] Clicar "Ir para o Dashboard"
- [ ] Verificar redirecionamento para /dashboard
- [ ] Navegar para Configurações
- [ ] Verificar acesso permitido (SEM loop)

### Cenário 2: Salvar Perfil
- [ ] Acessar página Configurações
- [ ] Alterar Renda Mensal para valor diferente
- [ ] Alterar Idioma (se disponível)
- [ ] Clicar "Salvar Perfil"
- [ ] Verificar mensagem de sucesso
- [ ] Refresh da página
- [ ] Confirmar valores persistidos

## Status
⏳ Aguardando execução
