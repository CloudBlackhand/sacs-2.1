#!/bin/bash

echo "🚀 Deploy Rápido para Railway"
echo "=============================="
echo ""

# Verifica se railway CLI está instalado
if ! command -v railway &> /dev/null; then
    echo "❌ Railway CLI não instalado!"
    echo ""
    echo "Instale com:"
    echo "  npm install -g @railway/cli"
    echo ""
    echo "Ou faça deploy manual:"
    echo "  1. Faça push para GitHub"
    echo "  2. Conecte o repo no Railway Dashboard"
    exit 1
fi

echo "📝 Checklist antes do deploy:"
echo ""
echo "1. Você configurou as variáveis no Railway?"
echo "   - SUPABASE_URL"
echo "   - SUPABASE_ANON_KEY" 
echo "   - JWT_SECRET"
echo ""
echo "2. Para testar SEM WhatsApp/Supabase, adicione:"
echo "   - DEV_FAKE_AUTH=1"
echo "   - DISABLE_WHATSAPP=1"
echo ""
read -p "Continuar? (s/n) " -n 1 -r
echo ""

if [[ ! $REPLY =~ ^[Ss]$ ]]; then
    echo "Deploy cancelado."
    exit 1
fi

echo ""
echo "🔄 Iniciando deploy..."
railway up

echo ""
echo "✅ Deploy iniciado!"
echo ""
echo "📌 Próximos passos:"
echo "1. Abra o Railway Dashboard"
echo "2. Veja os logs do deploy"
echo "3. Quando terminar, acesse a URL do seu app"
echo ""
echo "💡 Dicas:"
echo "- Se der erro de Chrome, o Railway já está instalando"
echo "- O primeiro deploy demora ~5-10 minutos"
echo "- Use os logs para debug: railway logs"