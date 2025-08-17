# SACS 2.1 - Sistema de Aproximação Cliente Suporte

Sistema de automação WhatsApp com análise de sentimentos e envio em massa.

## 🚀 Como Rodar

### Opção 1: Desenvolvimento Local (Mais Simples)

```bash
# Dá permissão e executa
chmod +x run-local.sh
./run-local.sh
```

Acesse: http://localhost:3000

**Login padrão (modo dev):**
- Usuário: `admin`
- Senha: `senha123`

### Opção 2: Docker (Para Deploy)

```bash
# Constrói a imagem
docker build -t sacs .

# Roda o container
docker run -p 3000:3000 -p 8001:8001 sacs
```

## 📋 Requisitos

### Para rodar localmente:
- Node.js 18+ 
- Python 3.8+
- Chrome ou Chromium (apenas se quiser usar WhatsApp real)

### Para Docker:
- Docker instalado

## 🔧 Configuração

### Modo Desenvolvimento (sem WhatsApp/Supabase real)
O script `run-local.sh` já configura tudo automaticamente com:
- `DEV_FAKE_AUTH=1` - Login sem banco de dados
- `DISABLE_WHATSAPP=1` - WhatsApp mockado

### Modo Produção
Crie um arquivo `.env` com:

```env
# Banco de dados Supabase
SUPABASE_URL=sua_url_aqui
SUPABASE_ANON_KEY=sua_chave_aqui

# Segredo JWT
JWT_SECRET=um_segredo_forte_aqui

# Porta (Railway define automaticamente)
PORT=3000
```

## 🎯 Funcionalidades

- ✅ **Upload de Excel** - Processa planilhas com contatos
- ✅ **Análise de Sentimentos** - Detecta reclamações e elogios
- ✅ **Envio em Massa** - Templates personalizados
- ✅ **Auto-resposta** - Responde automaticamente baseado no sentimento
- ✅ **Interface Web** - Dashboard completo

## 🐛 Solução de Problemas

### Erro "libnss3.so not found"
```bash
# Ubuntu/Debian
sudo apt-get install libnss3 libnspr4

# Ou use Docker que já tem tudo instalado
```

### Erro Python "externally-managed-environment"
O script `run-local.sh` já resolve isso usando ambiente virtual.

### WhatsApp não conecta
Em desenvolvimento, use `DISABLE_WHATSAPP=1` para testar sem WhatsApp real.

## 📦 Estrutura

```
sacs-2.1/
├── backend/
│   ├── node/        # API principal (Express.js)
│   └── python/      # Processamento Excel e análise (FastAPI)
├── frontend/
│   └── public/      # Interface web
└── run-local.sh     # Script para rodar localmente
```

## 🤝 Suporte

Para problemas ou dúvidas, verifique se:
1. Tem Node.js e Python instalados
2. Executou `chmod +x run-local.sh`
3. Está usando `./run-local.sh` para iniciar

---

**Desenvolvido com ❤️ para simplificar o atendimento via WhatsApp**