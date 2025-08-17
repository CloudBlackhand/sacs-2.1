# 🚨 DEPLOY URGENTE NO RAILWAY - PASSO A PASSO

## Opção 1: Deploy via GitHub (MAIS FÁCIL)

### 1. Faça commit e push:
```bash
git add .
git commit -m "Fix Railway deployment"
git push origin main
```

### 2. No Railway Dashboard:
1. Vá para https://railway.app/new
2. Escolha **"Deploy from GitHub repo"**
3. Conecte seu repositório
4. Railway detectará o Dockerfile automaticamente

### 3. Configure as Variáveis de Ambiente:
No Railway Dashboard > Settings > Variables, adicione:

```env
# MODO TESTE (sem banco/WhatsApp real):
DEV_FAKE_AUTH=1
DISABLE_WHATSAPP=1
JWT_SECRET=qualquer_coisa_por_enquanto

# OU MODO PRODUÇÃO (com Supabase):
SUPABASE_URL=sua_url_aqui
SUPABASE_ANON_KEY=sua_chave_aqui
JWT_SECRET=chave_segura_aleatoria
```

### 4. Deploy automático iniciará!

---

## Opção 2: Deploy via Railway CLI

### 1. Instale Railway CLI:
```bash
npm install -g @railway/cli
```

### 2. Login e deploy:
```bash
railway login
railway link  # selecione ou crie projeto
railway up    # faz deploy
```

### 3. Configure variáveis:
```bash
# Modo teste rápido:
railway variables set DEV_FAKE_AUTH=1
railway variables set DISABLE_WHATSAPP=1
railway variables set JWT_SECRET=teste123

# Restart
railway restart
```

---

## 🔥 SOLUÇÃO DE PROBLEMAS COMUNS

### Erro: "Failed to launch browser"
**Solução**: Já corrigido no Dockerfile! Chrome está sendo instalado.

### Erro: "Python externally-managed-environment"
**Solução**: Já corrigido! Usando venv no Dockerfile.

### Erro: "Port 8080"
**Solução**: Já corrigido! Railway usa variável PORT automaticamente.

### WhatsApp não conecta
**Solução temporária**: Use `DISABLE_WHATSAPP=1` para testar o resto do sistema.

---

## ✅ TESTE RÁPIDO (SEM SUPABASE/WHATSAPP)

No Railway, adicione estas variáveis para teste imediato:

```
DEV_FAKE_AUTH=1
DISABLE_WHATSAPP=1
JWT_SECRET=teste
```

Login de teste:
- Usuário: `admin`
- Senha: `senha123`

---

## 📊 MONITORAMENTO

### Ver logs em tempo real:
```bash
railway logs
```

### Ou no Dashboard:
Railway Dashboard > Deployments > View Logs

---

## 🎯 RESULTADO ESPERADO

1. Build demora ~5-10 minutos (instala Chrome)
2. App fica disponível em: `seu-app.up.railway.app`
3. Acesse e faça login com admin/senha123 (modo dev)

---

## 💡 IMPORTANTE

- Railway tem **volume persistente** em `/data`
- Sessão WhatsApp fica salva em `/data/.wwebjs_auth`
- Chrome já está configurado no Dockerfile
- Python usa venv (sem conflitos)
- Porta é configurada automaticamente pelo Railway

---

## 🆘 SUPORTE EMERGENCIAL

Se ainda tiver problemas:
1. Verifique logs: `railway logs`
2. Certifique que variáveis estão configuradas
3. Use modo teste primeiro (DEV_FAKE_AUTH=1)
4. Deploy leva tempo na primeira vez (Chrome grande)

**TUDO JÁ ESTÁ CORRIGIDO NO CÓDIGO!**