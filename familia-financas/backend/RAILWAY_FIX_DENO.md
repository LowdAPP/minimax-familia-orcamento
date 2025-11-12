# Como Forçar Node.js no Railway (se estiver usando Deno)

Se o Railway continuar tentando usar Deno, siga estes passos:

## Opção 1: Configurar Builder Manualmente

1. No Railway, vá em **Settings** do seu serviço
2. Em **Build & Deploy**, encontre **Builder**
3. Selecione **Nixpacks** (não Deno)
4. Configure:
   - **Build Command**: `npm install`
   - **Start Command**: `node server.js`

## Opção 2: Usar Dockerfile (Mais Confiável)

Se ainda não funcionar, podemos criar um Dockerfile. Me avise se precisar.

## Opção 3: Verificar Root Directory

Certifique-se de que o **Root Directory** está configurado como:
```
familia-financas/backend
```

Não como:
```
familia-financas
```

## Verificar se está usando Node.js

Nos logs do Railway, você deve ver:
```
Installing dependencies...
npm install
```

**NÃO** deve ver:
```
deno cache
```

## Solução Rápida

Se nada funcionar, no Railway:
1. Vá em **Settings** > **Service**
2. Delete o serviço atual
3. Crie um novo serviço
4. Selecione **"Empty Service"**
5. Configure manualmente:
   - Root Directory: `familia-financas/backend`
   - Build Command: `npm install`
   - Start Command: `node server.js`

