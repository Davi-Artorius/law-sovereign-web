#!/bin/bash

################################################################################
# LAW SOVEREIGN — REGISTER NEW USER (JWT)
#
# Uso: ./register-user.sh "nome-cliente" "email@example.com" "https://api-url"
#
# O que faz:
# 1. Registra novo usuário via /auth/register
# 2. Salva credenciais em arquivo seguro
# 3. Mostra credenciais para entregar ao cliente
################################################################################

set -e

# Cores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Validação de argumentos
if [ $# -lt 3 ]; then
    echo -e "${RED}❌ Uso: ./register-user.sh <nome-cliente> <email> <api-url>${NC}"
    echo ""
    echo "Exemplo:"
    echo "  ./register-user.sh 'Dr. João Silva' 'joao@example.com' 'https://api.railway.app'"
    exit 1
fi

NAME="$1"
EMAIL="$2"
API_URL="$3"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BASE_DIR="$HOME/.law-sovereign-credentials"
CREDS_FILE="$BASE_DIR/credentials-${EMAIL}-${TIMESTAMP}.txt"

# Criar diretório se não existir
mkdir -p "$BASE_DIR"
chmod 700 "$BASE_DIR"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔐 LAW SOVEREIGN — USER REGISTRATION (JWT)${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Nome:${NC} $NAME"
echo -e "${YELLOW}Email:${NC} $EMAIL"
echo -e "${YELLOW}API:${NC} $API_URL"
echo ""

# Gerar senha aleatória (16 caracteres, apenas alfanuméricos)
PASSWORD=$(openssl rand -base64 12 | tr -d "=+/" | cut -c1-12)

echo -e "${BLUE}[PASSO 1]${NC} Gerando senha aleatória..."
echo -e "${YELLOW}Senha:${NC} $PASSWORD"
echo ""

# Enviar registro para API
echo -e "${BLUE}[PASSO 2]${NC} Registrando usuário na API..."

RESPONSE=$(curl -s -X POST "$API_URL/auth/register" \
  -H "Content-Type: application/json" \
  -d "{\"email\":\"$EMAIL\",\"password\":\"$PASSWORD\",\"name\":\"$NAME\"}")

TOKEN=$(echo $RESPONSE | jq -r '.token // empty' 2>/dev/null)
TENANT_ID=$(echo $RESPONSE | jq -r '.tenantId // empty' 2>/dev/null)
ERROR=$(echo $RESPONSE | jq -r '.error // empty' 2>/dev/null)

if [ -z "$TOKEN" ]; then
    echo -e "${RED}❌ Erro ao registrar usuário${NC}"
    echo ""
    echo "Resposta da API:"
    echo "$RESPONSE" | jq . 2>/dev/null || echo "$RESPONSE"
    exit 1
fi

echo -e "${GREEN}✅ Usuário registrado com sucesso${NC}"
echo -e "${YELLOW}Tenant ID:${NC} $TENANT_ID"
echo -e "${YELLOW}Token:${NC} ${TOKEN:0:50}..."
echo ""

# Salvar credenciais em arquivo
echo -e "${BLUE}[PASSO 3]${NC} Salvando credenciais em arquivo seguro..."

cat > "$CREDS_FILE" << EOF
LAW SOVEREIGN — CREDENCIAIS DE ACESSO
================================================================================
Gerado em: $TIMESTAMP

CLIENTE: $NAME
EMAIL:   $EMAIL

================================================================================
ACESSAR AGORA:
  URL:      https://law-sovereign.vercel.app (ou seu domínio)
  Email:    $EMAIL
  Senha:    $PASSWORD

================================================================================
DETALHES TÉCNICOS:
  Tenant ID: $TENANT_ID
  API URL:   $API_URL
  Token:     $TOKEN

================================================================================
INSTRUÇÕES:
  1. Acesse https://law-sovereign.vercel.app
  2. Clique em "Registrar"
  3. Cole o email e senha acima
  4. Faça login
  5. Comece a criar seus dossiers

SEGURANÇA:
  • Mude sua senha no primeiro acesso
  • Não compartilhe este arquivo
  • Token expira em 7 dias (faça login novamente)
  • Cada tenant só vê seus dados (isolamento garantido)

================================================================================
SUPORTE:
  Contato: davi@law-sovereign.io
  Docs:    https://github.com/Davi-Artorius/law-sovereign-web

EOF

chmod 600 "$CREDS_FILE"

echo -e "${GREEN}✅ Credenciais salvas em: $CREDS_FILE${NC}"
echo ""

# Mostrar credenciais na tela
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}🎉 PRONTO PARA ENTREGA AO CLIENTE${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}COMPARTILHE COM O CLIENTE:${NC}"
echo ""
echo "  Email:    $EMAIL"
echo "  Senha:    $PASSWORD"
echo ""
echo -e "${BLUE}Link de acesso:${NC} https://law-sovereign.vercel.app"
echo ""
echo -e "${YELLOW}NOTA IMPORTANTE:${NC}"
echo "  • Token valido por 7 dias. Faça login novamente se expirar."
echo "  • Cada cliente vê apenas seus próprios dados (multi-tenancy)"
echo "  • Rate limiting: máx 5 tentativas de login / 5 minutos"
echo ""
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
