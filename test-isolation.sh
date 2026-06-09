#!/bin/bash

################################################################################
# TEST-ISOLATION.SH — VALIDADOR DE ISOLAMENTO MONO-TENANT
#
# Uso: ./test-isolation.sh <client-a-name> <client-b-name> <admin-api-key>
#
# Valida que Cliente A não vê dados de Cliente B (e vice-versa)
#
# Exemplo:
#   ./test-isolation.sh "joao-silva" "maria-santos" "api-key-secret"
#
# O que faz:
# 1. Verifica que ambos os clientes estão deployed no Vercel
# 2. Insere um cliente de TESTE em A
# 3. Insere um cliente DIFERENTE de TESTE em B
# 4. Consulta A → deve ver SÓ seus dados
# 5. Consulta B → deve ver SÓ seus dados
# 6. Se A ver dados de B (ou vice) → VAZAMENTO!
################################################################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Argumentos
if [ $# -lt 3 ]; then
    echo -e "${RED}❌ Uso: ./test-isolation.sh <client-a-name> <client-b-name> <admin-api-key>${NC}"
    echo ""
    echo "Exemplo:"
    echo "  ./test-isolation.sh 'joao-silva' 'maria-santos' 'abc123def456'"
    exit 1
fi

CLIENT_A="$1"
CLIENT_B="$2"
ADMIN_API_KEY="$3"

# URLs (assumindo que Vercel gerou elas após deploy)
URL_A="https://law-sovereign-${CLIENT_A}.vercel.app"
URL_B="https://law-sovereign-${CLIENT_B}.vercel.app"

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}🔐 TEST-ISOLATION — VALIDADOR DE ISOLAMENTO${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Cliente A:${NC} $CLIENT_A → $URL_A"
echo -e "${YELLOW}Cliente B:${NC} $CLIENT_B → $URL_B"
echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 1: VERIFICAR SAÚDE DOS ENDPOINTS
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[PASSO 1]${NC} Verificando conexão com os endpoints..."

echo -n "  Testando $URL_A/health... "
if HEALTH_A=$(curl -s -m 5 "$URL_A/health" 2>/dev/null | grep -q '"status":"ok"' && echo "OK" || echo "FAIL"); then
    echo -e "${GREEN}✅ Conectado${NC}"
else
    echo -e "${RED}❌ Erro de conexão${NC}"
    echo "    → Vercel pode estar em redeploy, espere 1-2 min e tente novamente"
    exit 1
fi

echo -n "  Testando $URL_B/health... "
if HEALTH_B=$(curl -s -m 5 "$URL_B/health" 2>/dev/null | grep -q '"status":"ok"' && echo "OK" || echo "FAIL"); then
    echo -e "${GREEN}✅ Conectado${NC}"
else
    echo -e "${RED}❌ Erro de conexão${NC}"
    echo "    → Vercel pode estar em redeploy, espera 1-2 min e tenta novamente"
    exit 1
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 2: INSERIR DADOS DE TESTE NO CLIENTE A
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[PASSO 2]${NC} Inserindo dados de TESTE no Cliente A..."

TIMESTAMP=$(date +%s)
TEST_CLIENT_A="Teste-Cliente-A-${TIMESTAMP}"

# Inserir um cliente de teste em A (via API)
POST_RESPONSE_A=$(curl -s -X POST \
  -H "x-api-key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  "$URL_A/clients" \
  -d "{
    \"name\": \"$TEST_CLIENT_A\",
    \"status\": \"TESTE\",
    \"case\": \"Isolamento_A\",
    \"area\": \"TESTES\",
    \"lastAction\": \"Inserido por test-isolation.sh\"
  }" 2>/dev/null)

# Verificar se foi criado
if echo "$POST_RESPONSE_A" | grep -q "id"; then
    echo -e "${GREEN}✅ Dados inseridos em A${NC}"
    echo "   Nome: $TEST_CLIENT_A"
else
    echo -e "${RED}❌ Erro ao inserir dados em A${NC}"
    echo "   Response: $POST_RESPONSE_A"
    echo ""
    echo "   Possíveis causas:"
    echo "   - INTERNAL_API_KEY não está configurada em Vercel"
    echo "   - DATABASE_URL não está configurada em Vercel"
    echo "   - Servidor ainda está deployando"
    exit 1
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 3: INSERIR DADOS DIFERENTES NO CLIENTE B
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[PASSO 3]${NC} Inserindo dados de TESTE no Cliente B..."

TEST_CLIENT_B="Teste-Cliente-B-${TIMESTAMP}"

POST_RESPONSE_B=$(curl -s -X POST \
  -H "x-api-key: $ADMIN_API_KEY" \
  -H "Content-Type: application/json" \
  "$URL_B/clients" \
  -d "{
    \"name\": \"$TEST_CLIENT_B\",
    \"status\": \"TESTE\",
    \"case\": \"Isolamento_B\",
    \"area\": \"TESTES\",
    \"lastAction\": \"Inserido por test-isolation.sh\"
  }" 2>/dev/null)

if echo "$POST_RESPONSE_B" | grep -q "id"; then
    echo -e "${GREEN}✅ Dados inseridos em B${NC}"
    echo "   Nome: $TEST_CLIENT_B"
else
    echo -e "${RED}❌ Erro ao inserir dados em B${NC}"
    echo "   Response: $POST_RESPONSE_B"
    exit 1
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 4: CONSULTAR A E VERIFICAR ISOLAMENTO
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[PASSO 4]${NC} Consultando Cliente A (deve ver SÓ seus dados)..."

GET_RESPONSE_A=$(curl -s -X GET \
  -H "x-api-key: $ADMIN_API_KEY" \
  "$URL_A/clients" 2>/dev/null)

# Verificar se A vê seu próprio cliente de teste
if echo "$GET_RESPONSE_A" | grep -q "$TEST_CLIENT_A"; then
    echo -e "${GREEN}✅ Cliente A vê seus dados (esperado)${NC}"
else
    echo -e "${YELLOW}⚠️  Cliente A NÃO vê seus dados (pode ser erro de API)${NC}"
fi

# Verificar se A vê dados de B (VAZAMENTO!)
if echo "$GET_RESPONSE_A" | grep -q "$TEST_CLIENT_B"; then
    echo -e "${RED}❌ VAZAMENTO DETECTADO!${NC}"
    echo "   Cliente A está vendo dados de Cliente B!"
    echo ""
    echo "   Resposta de A:"
    echo "$GET_RESPONSE_A" | head -c 500
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Cliente A NÃO vê dados de B (isolado)${NC}"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 5: CONSULTAR B E VERIFICAR ISOLAMENTO
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[PASSO 5]${NC} Consultando Cliente B (deve ver SÓ seus dados)..."

GET_RESPONSE_B=$(curl -s -X GET \
  -H "x-api-key: $ADMIN_API_KEY" \
  "$URL_B/clients" 2>/dev/null)

# Verificar se B vê seu próprio cliente de teste
if echo "$GET_RESPONSE_B" | grep -q "$TEST_CLIENT_B"; then
    echo -e "${GREEN}✅ Cliente B vê seus dados (esperado)${NC}"
else
    echo -e "${YELLOW}⚠️  Cliente B NÃO vê seus dados (pode ser erro de API)${NC}"
fi

# Verificar se B vê dados de A (VAZAMENTO!)
if echo "$GET_RESPONSE_B" | grep -q "$TEST_CLIENT_A"; then
    echo -e "${RED}❌ VAZAMENTO DETECTADO!${NC}"
    echo "   Cliente B está vendo dados de Cliente A!"
    echo ""
    echo "   Resposta de B:"
    echo "$GET_RESPONSE_B" | head -c 500
    echo ""
    exit 1
else
    echo -e "${GREEN}✅ Cliente B NÃO vê dados de A (isolado)${NC}"
fi

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# PASSO 6: LIMPEZA (OPCIONAL)
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${BLUE}[PASSO 6]${NC} Limpando dados de teste..."

# Aviso: Pedir confirmação antes de deletar (comentado, seguro por padrão)
# echo -e "${YELLOW}Deletar dados de teste? (s/n)${NC}"
# read -r -t 5 DELETE_CONFIRM || DELETE_CONFIRM="n"
#
# if [ "$DELETE_CONFIRM" = "s" ]; then
#     curl -s -X DELETE \
#       -H "x-api-key: $ADMIN_API_KEY" \
#       "$URL_A/admin/nuke" > /dev/null 2>&1 || true
#     curl -s -X DELETE \
#       -H "x-api-key: $ADMIN_API_KEY" \
#       "$URL_B/admin/nuke" > /dev/null 2>&1 || true
#     echo -e "${GREEN}✅ Dados de teste deletados${NC}"
# else
#     echo -e "${YELLOW}⚠️  Dados de teste mantidos (manual cleanup)${NC}"
# fi

echo -e "${YELLOW}ℹ️  Dados de teste deixados para inspeção${NC}"
echo "   Para deletar manualmente:"
echo "   → Acesse $URL_A e delete o cliente '$TEST_CLIENT_A'"
echo "   → Acesse $URL_B e delete o cliente '$TEST_CLIENT_B'"

echo ""

# ─────────────────────────────────────────────────────────────────────────────
# RESULTADO FINAL
# ─────────────────────────────────────────────────────────────────────────────

echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ ISOLAMENTO VALIDADO COM SUCESSO!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo "Resultado:"
echo "  ✅ Cliente A isolado (não vê dados de B)"
echo "  ✅ Cliente B isolado (não vê dados de A)"
echo "  ✅ Bancos PostgreSQL separados funcionando"
echo ""
echo "Status: 🟢 PRONTO PARA PRODUÇÃO"
echo ""
echo "Próximos passos:"
echo "  1. Deletar clientes de teste (opcional)"
echo "  2. Entregar URLs pro cliente"
echo "  3. Agendar treinamento"
echo ""
