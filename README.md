# SACS 2.1 - Sistema de Aproximação Cliente Suporte

Sistema de automação WhatsApp com análise de sentimentos e envio em massa.

## ⚠️ IMPORTANTE: Sobre o WhatsApp Web

Este sistema usa [whatsapp-web.js](https://docs.wwebjs.dev/) que **REQUER Chrome/Chromium instalado**.

**Por quê?** A biblioteca funciona abrindo o WhatsApp Web em um navegador real (Chrome) e controlando ele via Puppeteer. Isso é necessário para evitar bloqueios do WhatsApp.

## 🚀 Como Rodar

### Opção 1: Desenvolvimento Local SEM WhatsApp (Mais Simples)

```bash
# Dá permissão e executa
chmod +x run-local.sh
./run-local.sh
```

Acesse: http://localhost:3000

**Login padrão (modo dev):**
- Usuário: `admin`
- Senha: `senha123`

⚠️ **Nota**: Por padrão, roda com `DISABLE_WHATSAPP=1` (WhatsApp mockado para testes)

### Opção 2: Desenvolvimento Local COM WhatsApp

**Pré-requisito**: Chrome ou Chromium instalado

```bash
# Instalar Chrome (se não tiver)
# Ubuntu/Debian:
sudo apt-get install chromium-browser

# macOS:
brew install --cask google-chrome

# Editar .env e remover/comentar:
# DISABLE_WHATSAPP=1

# Executar
./run-local.sh
```

### Opção 3: Docker (Recomendado para Produção)

```bash
# Constrói a imagem (já inclui Chrome)
docker build -t sacs .

# Roda o container
docker run -p 3000:3000 -p 8001:8001 sacs
```

## 📋 Requisitos

### Para rodar localmente SEM WhatsApp:
- Node.js 18+ 
- Python 3.8+

### Para rodar COM WhatsApp:
- Node.js 18+ 
- Python 3.8+
- **Chrome ou Chromium** (OBRIGATÓRIO)

### Para Docker:
- Apenas Docker (Chrome já incluído na imagem)

## 🔧 Configuração

### Modo Desenvolvimento (sem WhatsApp real)
```env
DEV_FAKE_AUTH=1        # Login sem banco de dados
DISABLE_WHATSAPP=1     # WhatsApp mockado (não precisa Chrome)
```

### Modo Produção (com WhatsApp real)
```env
# Banco de dados Supabase
SUPABASE_URL=sua_url_aqui
SUPABASE_ANON_KEY=sua_chave_aqui

# Segredo JWT
JWT_SECRET=um_segredo_forte_aqui

# NÃO incluir DISABLE_WHATSAPP (WhatsApp real será usado)
# Chrome/Chromium DEVE estar instalado
```

## 🎯 Funcionalidades

- ✅ **Upload de Excel** - Processa planilhas com contatos
- ✅ **Análise de Sentimentos** - Detecta reclamações e elogios
- ✅ **Envio em Massa** - Templates personalizados
- ✅ **Auto-resposta** - Responde automaticamente baseado no sentimento
- ✅ **Interface Web** - Dashboard completo
- ✅ **WhatsApp Web** - Integração real via [whatsapp-web.js](https://docs.wwebjs.dev/)

## 🐛 Solução de Problemas

### Erro "Failed to launch the browser process" ou "libnss3.so not found"

**Causa**: Chrome/Chromium não está instalado ou faltam dependências.

**Soluções**:

1. **Para desenvolvimento/testes** - Use modo mock:
   ```bash
   echo "DISABLE_WHATSAPP=1" >> .env
   ./run-local.sh
   ```

2. **Para produção** - Instale Chrome:
   ```bash
   # Ubuntu/Debian
   sudo apt-get update
   sudo apt-get install -y chromium-browser libnss3 libnspr4

   # Ou use Docker que já tem tudo
   docker build -t sacs .
   docker run -p 3000:3000 -p 8001:8001 sacs
   ```

### Erro Python "externally-managed-environment"
O script `run-local.sh` já resolve isso usando ambiente virtual.

### WhatsApp não conecta
1. Verifique se Chrome está instalado: `which chromium-browser` ou `which google-chrome`
2. Para testes sem Chrome, use: `DISABLE_WHATSAPP=1`
3. Se usar Docker, Chrome já está incluído

## 📦 Estrutura

```
sacs-2.1/
├── backend/
│   ├── node/        # API principal (Express.js + whatsapp-web.js)
│   └── python/      # Processamento Excel e análise (FastAPI)
├── frontend/
│   └── public/      # Interface web
├── Dockerfile       # Imagem com Chrome incluído
└── run-local.sh     # Script para rodar localmente
```

## 🔍 Sobre as Dependências do Chrome

**Por que precisa do Chrome?**

O [whatsapp-web.js](https://docs.wwebjs.dev/) funciona abrindo uma instância real do WhatsApp Web em um navegador Chrome/Chromium controlado via Puppeteer. Isso é necessário porque:

1. WhatsApp não oferece API oficial para bots
2. Simular o navegador real reduz chances de bloqueio
3. Permite acesso a todas funcionalidades do WhatsApp Web

**Alternativas**:
- Para desenvolvimento/testes: Use `DISABLE_WHATSAPP=1` (modo mock)
- Para produção: Use Docker (Chrome já incluído)
- Para deploy em nuvem: Railway, Heroku, etc. suportam nosso Dockerfile

## ⚠️ Aviso Legal

Conforme documentado no [whatsapp-web.js](https://docs.wwebjs.dev/):

> "It is not guaranteed you will not be blocked by using this method. WhatsApp does not allow bots or unofficial clients on their platform, so this shouldn't be considered totally safe."

Use por sua conta e risco. Este projeto não é afiliado ao WhatsApp.

## 🤝 Suporte

Para problemas:
1. Verifique se tem Node.js e Python instalados
2. Para usar WhatsApp real, Chrome/Chromium é OBRIGATÓRIO
3. Para testes sem Chrome, use `DISABLE_WHATSAPP=1`
4. Considere usar Docker para evitar problemas de dependências

---

**Desenvolvido com ❤️ para simplificar o atendimento via WhatsApp**