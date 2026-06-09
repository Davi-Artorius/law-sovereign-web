#!/bin/bash

################################################################################
# LAW SOVEREIGN — GERADOR DE DADOS DEMO (120 Leads)
#
# Gera 120 clientes espalhados pela jornada completa
# Com dados realistas: nomes, casos, áreas, telefones, eventos
################################################################################

set -e

# Cores
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

# Configuração
API_URL="${1:-http://localhost:4000}"
TOKEN="${2:-}"
TOTAL_LEADS=120

if [ -z "$TOKEN" ]; then
  echo -e "${RED}❌ Token JWT não fornecido${NC}"
  echo "Uso: $0 <API_URL> <JWT_TOKEN>"
  echo ""
  echo "Exemplo: $0 http://localhost:4000 'eyJhbGc...'"
  exit 1
fi

echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${BLUE}📊 GERADOR DE DADOS DEMO — LAW SOVEREIGN${NC}"
echo -e "${BLUE}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "${YELLOW}Gerando ${TOTAL_LEADS} leads distribuídos pela jornada...${NC}"
echo ""

# Arrays de dados realistas
NOMES=(
  "Dr. João Silva" "Dra. Maria Santos" "Dr. Pedro Oliveira" "Dra. Ana Costa"
  "Dr. Carlos Mendes" "Dra. Paula Ferreira" "Dr. Bruno Rocha" "Dra. Fernanda Lima"
  "Dr. Ricardo Alves" "Dra. Beatriz Martins" "Dr. Felipe Sousa" "Dra. Camila Neves"
  "Dr. Gustavo Barbosa" "Dra. Larissa Teixeira" "Dr. Marcelo Gomes" "Dra. Vanessa Cruz"
  "Dr. André Pereira" "Dra. Patrícia Dias" "Dr. Rodrigo Cavalcanti" "Dra. Sophia Barroso"
)

AREAS=(
  "Civil" "Trabalhista" "Criminal" "Comercial" "Tributário"
  "Imobiliário" "Previdenciário" "Ambiental" "Família" "Administrativo"
)

CASOS=(
  "Ação de indenização por danos morais" "Cobrança de débito comercial"
  "Disputa de inventário e herança" "Rescisão de contrato de aluguel"
  "Ação trabalhista por assédio" "Fusão empresarial em andamento"
  "Reconhecimento de paternidade" "Processo tributário em apelação"
  "Cumprimento de sentença" "Ação cautelar urgente"
  "Divórcio litigioso com custódia" "Embargo de imóvel"
  "Recall de produto defeituoso" "Pensão alimentícia em revisão"
  "Falência empresarial" "Ação de usucapião"
)

STATUSES=("TRIAGEM" "PROPOSTA" "CONTRATO" "ATIVO" "DESFECHO")

# Distribuição: 24 em cada status
LEADS_PER_STATUS=$((TOTAL_LEADS / ${#STATUSES[@]}))

# Telefones
RANDOM_PHONE() {
  echo "61 9$(shuf -i 20000000-99999999 -n 1)"
}

# Gerar cliente
GENERATE_CLIENT() {
  local name="$1"
  local area="$2"
  local case_desc="$3"
  local status="$4"
  local phone="$5"

  # Chance de sucesso (aumenta com progresso)
  case "$status" in
    TRIAGEM) CHANCE_SUCESSO=$((RANDOM % 50 + 30)) ;;      # 30-80%
    PROPOSTA) CHANCE_SUCESSO=$((RANDOM % 40 + 50)) ;;      # 50-90%
    CONTRATO) CHANCE_SUCESSO=$((RANDOM % 30 + 70)) ;;      # 70-100%
    ATIVO) CHANCE_SUCESSO=95 ;;                            # 95%
    DESFECHO) CHANCE_SUCESSO=$((RANDOM % 20 + 80)) ;;      # 80-100%
  esac

  # Dados do cliente
  local PAYLOAD=$(cat <<EOF
{
  "name": "$name",
  "area": "$area",
  "case": "$case_desc",
  "status": "$status",
  "phone": "$phone",
  "lastAction": "Contato realizado",
  "chanceOfSuccess": $CHANCE_SUCESSO,
  "costOfWaiting": $((RANDOM % 50000 + 5000)),
  "isPaperLead": $([ $((RANDOM % 2)) -eq 0 ] && echo "true" || echo "false")
}
EOF
)

  # Enviar
  RESPONSE=$(curl -s -X POST "$API_URL/clients" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "$PAYLOAD")

  CLIENT_ID=$(echo "$RESPONSE" | jq -r '.id // empty' 2>/dev/null)

  if [ -z "$CLIENT_ID" ]; then
    return 1
  fi

  # Adicionar evento inicial
  local EVENT_TEXT="Lead gerado pelo sistema de demo"
  case "$status" in
    TRIAGEM) EVENT_TEXT="Primeiro contato — cliente em análise inicial" ;;
    PROPOSTA) EVENT_TEXT="Proposta enviada — aguardando retorno do cliente" ;;
    CONTRATO) EVENT_TEXT="Contrato assinado — em execução" ;;
    ATIVO) EVENT_TEXT="Caso em andamento — procedimentos iniciados" ;;
    DESFECHO) EVENT_TEXT="Caso encerrado com resultado favorable" ;;
  esac

  curl -s -X POST "$API_URL/events" \
    -H "Content-Type: application/json" \
    -H "Authorization: Bearer $TOKEN" \
    -d "{\"clientId\": \"$CLIENT_ID\", \"type\": \"Anotação\", \"content\": \"$EVENT_TEXT\", \"date\": \"$(date +%Y-%m-%d)\"}" \
    > /dev/null 2>&1

  return 0
}

# Contadores
TOTAL_CREATED=0
STATUS_INDEX=0

# Gerar leads
for ((i = 1; i <= TOTAL_LEADS; i++)); do
  # Cicla pelos status
  STATUS="${STATUSES[$((STATUS_INDEX % ${#STATUSES[@]}))]}"
  ((STATUS_INDEX++))

  # Dados aleatórios
  NOME="${NOMES[$((RANDOM % ${#NOMES[@]}))]}"
  AREA="${AREAS[$((RANDOM % ${#AREAS[@]}))]}"
  CASO="${CASOS[$((RANDOM % ${#CASOS[@]}))]}"
  PHONE=$(RANDOM_PHONE)

  # Tentar criar
  if GENERATE_CLIENT "$NOME" "$AREA" "$CASO" "$STATUS" "$PHONE"; then
    ((TOTAL_CREATED++))

    # Progress bar
    PROGRESS=$((i * 100 / TOTAL_LEADS))
    if [ $((i % 10)) -eq 0 ]; then
      echo -ne "\r${BLUE}[${PROGRESS}%]${NC} $TOTAL_CREATED leads criados..."
    fi
  fi
done

echo ""
echo ""
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo -e "${GREEN}✅ SUCESSO!${NC}"
echo -e "${GREEN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${NC}"
echo ""
echo -e "Leads criados: ${YELLOW}${TOTAL_CREATED}/${TOTAL_LEADS}${NC}"
echo ""
echo "Distribuição:"
for STATUS in "${STATUSES[@]}"; do
  COUNT=$(curl -s "$API_URL/clients" \
    -H "Authorization: Bearer $TOKEN" \
    2>/dev/null | jq "[.[] | select(.status == \"$STATUS\")] | length" 2>/dev/null || echo "?")
  echo -e "  ${YELLOW}${STATUS}${NC}: ${GREEN}${COUNT}${NC}"
done
echo ""
echo -e "${GREEN}Dashboard está pronto para propaganda! 🚀${NC}"
