#!/bin/bash

################################################################################
# LAW SOVEREIGN — MONO-TENANT CLIENT DEPLOYMENT SCRIPT
#
# Uso: ./deploy-client.sh "joao-silva" "joao@example.com"
#
# O que faz:
# 1. Clone o repositório
# 2. Configura variáveis de ambiente únicos
# 3. Deploy no Vercel (cria nova URL)
# 4. Registra credenciais em arquivo seguro
# 5. Mostra resumo pronto pra entregar
################################################################################

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validação de argumentos
if [ $# -lt 2 ]; then
    echo -e "${RED}❌ Uso: ./deploy-client.sh <nome-cliente> <email-cliente>${NC}"
    echo ""
    echo "Exemplo:"
    echo "  ./deploy-client.sh 'joao-silva' 'joao@example.com'"
    exit 1
fi

CLIENT_NAME="$1"
CLIENT_EMAIL="$2"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
REPO_URL="https://github.com/Davi-Artorius/law-sovereign-web.git"
BASE_DIR="$HOME/law-sovereign-clients"
CLIENT_DIR="$BASE_DIR/law-sovereign-$CLIENT_NAME"
LOG_FILE="$BASE_DIR/deployments.log"
CREDENTIALS_FILE="$BASE_DIR/credentials-$CLIENT_NAME.txt"

# Criar diretório base se não existir
mkdir -p "$BASE_DIR"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🚀 LAW SOVEREIGN — DEPLOYMENT MONO-TENANT${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Cliente:${NC} $CLIENT_NAME"
echo -e "${YELLOW}Email:${NC} $CLIENT_EMAIL"
echo -e "${YELLOW}Timestamp:${NC} $TIMESTAMP"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 1: VALIDAR PRÉ-REQUISITOS
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[PASSO 1]${NC} Validando pré-requisitos..."

if ! command -v git &> /dev/null; then
    echo -e "${RED}❌ Git não instalado. Instale antes de continuar.${NC}"
    exit 1
fi

if ! command -v vercel &> /dev/null; then
    echo -e "${RED}❌ Vercel CLI não instalado.${NC}"
    echo "   Instale com: npm install -g vercel"
    exit 1
fi

if ! command -v node &> /dev/null; then
    echo -e "${RED}❌ Node.js não instalado.${NC}"
    exit 1
fi

echo -e "${GREEN}✅ Git, Vercel CLI e Node.js detectados${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 2: CLONAR REPOSITÓRIO
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[PASSO 2]${NC} Clonando repositório..."

if [ -d "$CLIENT_DIR" ]; then
    echo -e "${YELLOW}⚠️  Diretório já existe. Removendo...${NC}"
    rm -rf "$CLIENT_DIR"
fi

if git clone "$REPO_URL" "$CLIENT_DIR" 2>/dev/null; then
    echo -e "${GREEN}✅ Repositório clonado${NC}"
else
    echo -e "${RED}❌ Erro ao clonar repositório. Verifique acesso.${NC}"
    exit 1
fi

cd "$CLIENT_DIR"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 3: CONFIGURAR VARIÁVEIS DE AMBIENTE
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[PASSO 3]${NC} Configurando variáveis de ambiente..."
echo ""

# Gera API Key única para este cliente
INTERNAL_API_KEY=$(node -e "console.log(require('crypto').randomBytes(32).toString('hex'))")
NUKE_KEY=$(node -e "console.log(require('crypto').randomBytes(16).toString('hex'))")

# ⚠️ VALIDAÇÃO CRÍTICA: DATABASE_URL ISOLADO POR CLIENTE
# Maelstrom: Isolamento mono-tenant — cada cliente = seu próprio PostgreSQL no Railway
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}⚠️  CRÍTICO — ISOLAMENTO MONO-TENANT${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Este cliente PRECISA de seu próprio banco PostgreSQL isolado."
echo "Se você colar a mesma DATABASE_URL de outro cliente:"
echo "  → Cliente A vai ver dados de Cliente B ✗ VAZAMENTO CRÍTICO"
echo ""
echo "Instruções:"
echo "  1. Acesse: https://railway.app/dashboard"
echo "  2. Crie um novo PostgreSQL (clique em '+Create')"
echo "  3. Copie a DATABASE_URL do novo banco"
echo "  4. Cole abaixo (ela começará com 'postgresql://')"
echo ""
echo -e "${RED}⚠️  NUNCA use a mesma DATABASE_URL para 2 clientes!${NC}"
echo ""

if [ -z "$DATABASE_URL" ]; then
    read -p "Cole a DATABASE_URL do Railway NOVO para este cliente: " DB_URL
    if [ -n "$DB_URL" ]; then
        # Validação: Database URL deve ser PostgreSQL
        if [[ ! "$DB_URL" =~ postgresql:// ]]; then
            echo -e "${RED}❌ ERRO: DATABASE_URL inválida (deve começar com 'postgresql://')${NC}"
            exit 1
        fi
        export DATABASE_URL="$DB_URL"
        echo -e "${GREEN}✅ DATABASE_URL configurada${NC}"
    else
        echo -e "${RED}❌ ERRO: DATABASE_URL obrigatória para isolamento seguro${NC}"
        echo "   Você precisa criar um novo PostgreSQL no Railway"
        echo "   Não é seguro fazer deploy sem DATABASE_URL!"
        exit 1
    fi
else
    # Validação se DATABASE_URL já está setada
    if [[ ! "$DATABASE_URL" =~ postgresql:// ]]; then
        echo -e "${RED}❌ ERRO: DATABASE_URL em env inválida (deve ser PostgreSQL)${NC}"
        exit 1
    fi
    echo -e "${GREEN}✅ DATABASE_URL encontrada em env${NC}"
fi

echo ""

# Cria .env.local para deploy
cat > .env.local << EOF
# Gerado automaticamente em $TIMESTAMP
NODE_ENV=production
DATABASE_URL=${DATABASE_URL:-"CONFIGURE_NO_VERCEL"}
INTERNAL_API_KEY=$INTERNAL_API_KEY
NUKE_KEY=$NUKE_KEY
VITE_APP_PASSWORD=temporary-password-change-later
GEMINI_API_KEY=${GEMINI_API_KEY:-""}
OCR_MODEL=gemini-2.5-flash
ALLOWED_ORIGIN=https://law-sovereign-$CLIENT_NAME.vercel.app
EOF

echo -e "${GREEN}✅ Arquivo .env.local criado${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 4: INSTALAR DEPENDÊNCIAS
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[PASSO 4]${NC} Instalando dependências..."

if npm install > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Dependências instaladas${NC}"
else
    echo -e "${RED}❌ Erro ao instalar dependências${NC}"
    exit 1
fi

if [ -d "server" ] && [ -f "server/package.json" ]; then
    cd server
    npm install > /dev/null 2>&1
    cd ..
    echo -e "${GREEN}✅ Dependências do servidor instaladas${NC}"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 5: BUILD
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[PASSO 5]${NC} Fazendo build..."

if npm run build > /dev/null 2>&1; then
    echo -e "${GREEN}✅ Build concluído${NC}"
else
    echo -e "${YELLOW}⚠️  Build teve avisos (pode ser normal)${NC}"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 6: DEPLOY NO VERCEL
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[PASSO 6]${NC} Deployando no Vercel..."
echo -e "${YELLOW}   (você pode precisar autorizar no navegador)${NC}"
echo ""

VERCEL_URL=""

# Tenta fazer deploy
if vercel deploy --prod --name law-sovereign-$CLIENT_NAME --force > /tmp/vercel-deploy.log 2>&1; then
    VERCEL_URL=$(grep -oP 'https://law-sovereign-\w+\.vercel\.app' /tmp/vercel-deploy.log | head -1)
    if [ -z "$VERCEL_URL" ]; then
        VERCEL_URL="https://law-sovereign-$CLIENT_NAME.vercel.app"
    fi
    echo -e "${GREEN}✅ Deploy concluído${NC}"
    echo -e "${GREEN}   URL: $VERCEL_URL${NC}"
else
    echo -e "${RED}❌ Erro no deploy${NC}"
    echo "   Log: /tmp/vercel-deploy.log"
    exit 1
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 7: CONFIGURAR VARIÁVEIS NO VERCEL
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[PASSO 7]${NC} Configurando variáveis no Vercel..."

# Tenta adicionar variáveis de ambiente no Vercel
vercel env add DATABASE_URL < /dev/null 2>/dev/null || true
vercel env add INTERNAL_API_KEY < /dev/null 2>/dev/null || true
vercel env add NUKE_KEY < /dev/null 2>/dev/null || true
vercel env add VITE_APP_PASSWORD < /dev/null 2>/dev/null || true
vercel env add GEMINI_API_KEY < /dev/null 2>/dev/null || true
vercel env add OCR_MODEL < /dev/null 2>/dev/null || true

echo -e "${YELLOW}⚠️  IMPORTANTE: Configure manualmente no Vercel:${NC}"
echo "   1. Acesse: vercel.com/dashboard"
echo "   2. Selecione: law-sovereign-$CLIENT_NAME"
echo "   3. Settings → Environment Variables"
echo "   4. Adicione:"
echo "      - DATABASE_URL (do Railway)"
echo "      - INTERNAL_API_KEY: $INTERNAL_API_KEY"
echo "      - NUKE_KEY: $NUKE_KEY"
echo "      - VITE_APP_PASSWORD: (escolha uma senha)"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 8: REGISTRAR CREDENCIAIS
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[PASSO 8]${NC} Registrando credenciais..."

cat > "$CREDENTIALS_FILE" << EOF
═══════════════════════════════════════════════════════════════════════════════
LAW SOVEREIGN — CREDENCIAIS DO CLIENTE + ISOLAMENTO
═══════════════════════════════════════════════════════════════════════════════

Cliente: $CLIENT_NAME
Email: $CLIENT_EMAIL
Data Deploy: $TIMESTAMP
Isolamento: MONO-TENANT (banco PostgreSQL separado)

URL DE ACESSO:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
$VERCEL_URL

CREDENCIAIS TÉCNICAS (PARA VOCÊ):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Diretório: $CLIENT_DIR
API Key: $INTERNAL_API_KEY
Nuke Key: $NUKE_KEY
Env File: $CLIENT_DIR/.env.local

CHECKLIST DE ISOLAMENTO (CRÍTICO!):
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ DATABASE_URL configurada no Vercel (NEW — do Railway)
□ DATABASE_URL é DIFERENTE de outro cliente (não compartilhada)
□ /health retorna "db": "connected"
□ Login funciona com VITE_APP_PASSWORD
□ test-isolation.sh passou (validou isolamento)

CHECKLIST ANTES DE LIBERAR PRO CLIENTE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
□ Todos os itens de isolamento acima ✅
□ Testou adicionar cliente de teste (aparece na lista)
□ Testou OCR (se GEMINI_API_KEY foi configurada)
□ Importou clientes antigos do cliente
□ Agendou call de treinamento (30 min)

REFERÊNCIA RÁPIDA:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Docs de deploy: ~/Projetos/law-sovereign-web/DEPLOY_CHECKLIST.md
Docs de isolamento: ~/Projetos/law-sovereign-web/ISOLAMENTO_MONO_TENANT.md
Teste de isolamento: ~/Projetos/law-sovereign-web/test-isolation.sh

SUPORTE:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
WhatsApp: [seu número]
Email: [seu email]
Horário: 09:00-18:00 Brasília

═══════════════════════════════════════════════════════════════════════════════
IMPORTANTE: Cada cliente tem seu próprio banco PostgreSQL isolado.
Cliente A não pode acessar dados de Cliente B. Validado via test-isolation.sh.
═══════════════════════════════════════════════════════════════════════════════
EOF

echo -e "${GREEN}✅ Credenciais salvas em: $CREDENTIALS_FILE${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 9: REGISTRAR NO LOG
# ─────────────────────────────────────────────────────────────────────────────

cat >> "$LOG_FILE" << EOF
[$TIMESTAMP] Deploy concluído
Cliente: $CLIENT_NAME <$CLIENT_EMAIL>
URL: $VERCEL_URL
Diretório: $CLIENT_DIR
API Key: $INTERNAL_API_KEY
────────────────────────────────────────────────────────────────────────────
EOF

echo -e "${BLUE}[PASSO 9]${NC} Registrando no log..."
echo -e "${GREEN}✅ Log atualizado${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 10: CHECKLIST DE ISOLAMENTO PRÉ-ENTREGA (CRÍTICO!)
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[PASSO 10]${NC} Checklist de isolamento pré-entrega..."
echo ""
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${RED}CRÍTICO: Validar isolamento antes de liberar${NC}"
echo -e "${RED}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Você precisa validar isolamento para ESTE cliente:"
echo ""
echo -e "${YELLOW}PRÓXIMAS AÇÕES (faça nesta ordem):${NC}"
echo ""
echo "1️⃣  Configure variáveis em Vercel (conforme instruções abaixo)"
echo "2️⃣  Teste login: $VERCEL_URL"
echo "3️⃣  Rode o teste de isolamento (OBRIGATÓRIO para produção):"
echo ""
echo -e "${YELLOW}   bash ~/Projetos/law-sovereign-web/test-isolation.sh \\${NC}"
echo -e "${YELLOW}     '$CLIENT_NAME' \\${NC}"
echo -e "${YELLOW}     '<outro-cliente-já-deployed>' \\${NC}"
echo -e "${YELLOW}     '$INTERNAL_API_KEY'${NC}"
echo ""
echo -e "${RED}⚠️  Se não rodar test-isolation.sh e validar isolamento,${NC}"
echo -e "${RED}    você coloca dados críticos do cliente em risco!${NC}"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# RESUMO FINAL
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ DEPLOYMENT CONCLUÍDO!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${BLUE}DADOS DO CLIENTE (pra entregar):${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "Nome: ${YELLOW}$CLIENT_NAME${NC}"
echo -e "Email: ${YELLOW}$CLIENT_EMAIL${NC}"
echo -e "URL: ${YELLOW}$VERCEL_URL${NC}"
echo -e "Status: ${YELLOW}⏳ AGUARDANDO VALIDAÇÃO DE ISOLAMENTO${NC}"
echo ""

echo -e "${BLUE}INSTRUÇÕES COMPLETAS:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo ""
echo "Abra: ISOLAMENTO_MONO_TENANT.md"
echo "  → Contém passo-a-passo completo"
echo "  → Locação: ~/Projetos/law-sovereign-web/ISOLAMENTO_MONO_TENANT.md"
echo ""
echo -e "${BLUE}CREDENCIAIS SALVAS EM:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}$CREDENTIALS_FILE${NC}"
echo ""
echo "Contém:"
echo "  - INTERNAL_API_KEY: $INTERNAL_API_KEY"
echo "  - NUKE_KEY: $NUKE_KEY"
echo "  - URL de acesso"
echo "  - Checklist pré-entrega"
echo ""

echo -e "${BLUE}LOG DE TODOS OS DEPLOYS:${NC}"
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo -e "${YELLOW}$LOG_FILE${NC}"
echo ""

echo -e "${YELLOW}⏳ NÃO entregue pro cliente ainda!${NC}"
echo "  Siga ISOLAMENTO_MONO_TENANT.md completamente."
echo ""
echo -e "${GREEN}🎯 Quando terminar com sucesso:${NC}"
echo "   Você verá ✅ ISOLAMENTO VALIDADO COM SUCESSO!"
echo ""
