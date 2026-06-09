# 🔐 SEGURANÇA & AUDITORIA — ISOLAMENTO MONO-TENANT

## VISÃO GERAL DA ARQUITETURA DE SEGURANÇA

```
┌─────────────────────────────────────────────────────────────┐
│ CLIENTE A: lei-firma-a.com.br                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Vercel)              Backend (Railway)            │
│  law-sovereign-a.vercel.app     Express + Prisma            │
│        ↓                                ↓                     │
│  React 19 (browser)    ----HTTP--→   Node.js (4000)         │
│  Login: VITE_APP_PASSWORD              ↓                     │
│  Auth: Stateless                  PostgreSQL                 │
│                                  (banco isolado)             │
│                                                               │
│  Isolamento: DATABASE_URL_A único                           │
│  Autenticação: VITE_APP_PASSWORD_A                          │
│  API Key (internal): INTERNAL_API_KEY_A                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│ CLIENTE B: lei-firma-b.com.br                               │
├─────────────────────────────────────────────────────────────┤
│                                                               │
│  Frontend (Vercel)              Backend (Railway)            │
│  law-sovereign-b.vercel.app     Express + Prisma            │
│        ↓                                ↓                     │
│  React 19 (browser)    ----HTTP--→   Node.js (4000)         │
│  Login: VITE_APP_PASSWORD              ↓                     │
│  Auth: Stateless                  PostgreSQL                 │
│                                  (banco isolado)             │
│                                                               │
│  Isolamento: DATABASE_URL_B único                           │
│  Autenticação: VITE_APP_PASSWORD_B                          │
│  API Key (internal): INTERNAL_API_KEY_B                     │
│                                                               │
└─────────────────────────────────────────────────────────────┘

RESULTADO: A e B nunca se encontram
```

---

## CAMADAS DE ISOLAMENTO

### 1️⃣ CAMADA 1: Isolamento de Infraestrutura
| Componente | Isolado? | Como |
|-----------|----------|------|
| Frontend (Vercel) | ✅ SIM | Deploy separado por cliente |
| Backend (Railway) | ✅ SIM | Container separado por cliente |
| Database | ✅ SIM | PostgreSQL instância separada |
| Variáveis de Env | ✅ SIM | Cada cliente tem seu próprio `.env` |

**Resultado:** Mesmo que um cliente tenha problema, outro não é afetado.

---

### 2️⃣ CAMADA 2: Isolamento de Dados
| Nível | Descrição | Garantia |
|------|-----------|----------|
| **Schema** | Cada cliente em seu próprio PostgreSQL | DATABASE_URL diferente |
| **Tabelas** | Sem tenancy column (cada cliente tem seu próprio banco) | Não é possível SQL injection cruzar clientes |
| **Queries** | `SELECT * FROM clients` retorna só dados do próprio cliente | Porque é um banco diferente |

**Resultado:** Não existe "cliente compartilhado" — impossível acontecer.

---

### 3️⃣ CAMADA 3: Isolamento de Autenticação
| Autenticação | Tipo | Escopo |
|--------------|------|--------|
| `VITE_APP_PASSWORD` | Senha de login | 1 cliente |
| `INTERNAL_API_KEY` | Chave de API | 1 cliente (server-side) |
| `NUKE_KEY` | Chave de destruição | 1 cliente (admin) |

**Fluxo:**
1. Usuário entra senha em `https://law-sovereign-joao.vercel.app`
2. Frontend valida contra `VITE_APP_PASSWORD_A` (hardcoded no Vercel)
3. Se correto, acessa `/clients` com header `x-api-key: INTERNAL_API_KEY_A`
4. Backend valida a chave (Vercel env var)
5. Query ao banco **específico de A** (`DATABASE_URL_A`)
6. Retorna SÓ dados de A

**Resultado:** Mesmo que senha vaze, só acessa o banco daquele cliente.

---

## MATRIZ DE RISCO

### Cenários de Falha & Mitigação

| Cenário | Risco | Mitigation | Status |
|---------|-------|-----------|--------|
| **Mesmo DATABASE_URL pra 2 clientes** | 🔴 CRÍTICO | Deploy script força novo banco no Railway | ✅ IMPLEMENTADO |
| | | test-isolation.sh valida que não acontece | ✅ IMPLEMENTADO |
| | | ISOLAMENTO_MONO_TENANT.md com instruções | ✅ IMPLEMENTADO |
| **PASSWORD compartilhada** | 🟡 ALTO | Cada cliente tem VITE_APP_PASSWORD diferente | ✅ IMPLEMENTADO |
| **API Key vaza** | 🟡 ALTO | Chave só acessa banco específico do cliente | ✅ MITIGADO |
| | | Se vazar, hacker acessa UM cliente, não todos | ✅ MITIGADO |
| **Hacker consegue acesso Vercel** | 🔴 CRÍTICO | Usa 2FA no Vercel, senhas fortes | ✅ RESPONSABILIDADE OPERACIONAL |
| **Dados em trânsito** | 🟡 MÉDIO | HTTPS obrigatório (Vercel + Railway) | ✅ AUTOMÁTICO |
| **Backup desprotegido** | 🟡 ALTO | Railway maneja, você não toca | ✅ RESPONSABILIDADE DO PROVIDER |

---

## PROCEDIMENTO DE AUDITORIA

### Auditoria Pós-Deploy (Checklist de Davi)

```bash
# 1. Verificar que DATABASE_URL foi setada corretamente
curl -H "x-api-key: $API_KEY" https://law-sovereign-cliente.vercel.app/health
# Esperado: "db": "connected" ✅

# 2. Verificar que cliente consegue fazer login
curl -X POST https://law-sovereign-cliente.vercel.app/login \
  -d '{"password": "VITE_APP_PASSWORD_DAQUELE_CLIENTE"}'
# Esperado: HTTP 200 (ou erro específico se password errada)

# 3. Inserir dado de teste
curl -H "x-api-key: $API_KEY" \
  -X POST https://law-sovereign-cliente.vercel.app/clients \
  -d '{"name": "Teste", "status": "TESTE"}'
# Esperado: HTTP 201, retorna com ID

# 4. Validar isolamento (crítico!)
bash ~/Projetos/law-sovereign-web/test-isolation.sh \
  "cliente-1" "cliente-2" "$API_KEY"
# Esperado: ✅ ISOLAMENTO VALIDADO COM SUCESSO!
```

---

### Auditoria Periódica (Mensal)

**O que checar:**
1. Logs de acesso no Vercel (Analytics)
2. Consumo de CPU/Memory no Railway
3. Tamanho do banco (crescimento normal?)
4. Nenhum cliente reportou dados de outro cliente

**Como checar:**

```bash
# Ver logs de erro recentes (últimos 7 dias)
vercel logs law-sovereign-cliente --follow

# Ver status do banco Railway
railway logs --tail

# Checklist: nenhum acesso cruzado
bash ~/Projetos/law-sovereign-web/test-isolation.sh \
  "cliente-1" "cliente-2" "$API_KEY"
```

---

## PROCEDIMENTO EM CASO DE INCIDENTE

### Se Cliente A Reportar: "Vejo dados de Cliente B"

**Ação imediata:**

1. **PARAR TUDO (não fazer mais nada)**
   ```bash
   # Não faça nada que piore a situação
   # Não deletar dados
   # Não fazer deploy
   ```

2. **Coletar evidência**
   ```bash
   # Confirmar com cliente A:
   # "Qual é o name do cliente que você vê mas não criou?"
   # Exemplo: "Vejo 'Empresa João Silva' mas só criei 'Meus Clientes'"
   
   # Coletar output:
   curl -H "x-api-key: $API_KEY_A" \
     https://law-sovereign-a.vercel.app/clients > evidencia-a.json
   ```

3. **Verificar isolamento**
   ```bash
   # Se A vê dados de B, qual é o B?
   # Rodar teste de isolamento
   bash test-isolation.sh "cliente-a" "cliente-b" "$API_KEY"
   # Se falhar: CONFIRMADO que há vazamento
   ```

4. **Diagnosticar raiz do problema**

   **Hipótese A:** Same DATABASE_URL
   ```bash
   # Verificar env vars no Vercel
   vercel env ls law-sovereign-a
   vercel env ls law-sovereign-b
   
   # Se DATABASE_URL é igual → PROBLEMA ENCONTRADO
   # Solução: Criar novo PostgreSQL no Railway pra B
   ```

   **Hipótese B:** Mesmo backend/container rodando código de outro cliente
   ```bash
   # Improvável, mas checar:
   curl -H "x-api-key: $API_KEY_A" \
     https://law-sovereign-a.vercel.app/debug
   # Não deve mostrar nada de "b" na resposta
   ```

5. **Comunicar com cliente A**
   ```
   Dr. João,
   
   Investigamos seu relato e encontramos uma situação.
   [Explicar o que foi feito]
   
   A partir de agora, seus dados estão 100% isolados.
   Sua senha foi resetada por segurança.
   Nova senha: [gerar]
   
   Deixa eu saber se vê algo estranho de novo.
   ```

6. **Implementar checkpoint**
   - Adicione teste automático mensal
   - `test-isolation.sh` deve rodar antes de qualquer release
   - Documente o incidente no CHANGELOG

---

## CONFORMIDADE & COMPLIANCE

### LGPD (Lei Geral de Proteção de Dados)
- ✅ Dados isolados por cliente
- ✅ Sem compartilhamento entre clientes
- ✅ Possibilidade de backup/restore por cliente
- ✅ Direito ao esquecimento implementável (DELETE)

### Responsabilidades
| Item | Responsável | Frequência |
|------|-------------|-----------|
| Isolamento de dados | Você (Davi) | Pré-deploy (test-isolation.sh) |
| Backup do banco | Railway | Automático (backups diários) |
| Acesso Vercel | Você | 2FA sempre ativo |
| Monitoramento | Você | 1x/mês |
| Segurança de senha | Cliente | Dever do cliente |

---

## OPERAÇÕES DE ADMIN

### Resetar Senha de Cliente (Se Cliente Esqueceu)

```bash
# 1. Gerar nova senha
NEW_PASSWORD="segura123"

# 2. No Vercel Dashboard
# → Selecione law-sovereign-cliente
# → Settings → Environment Variables
# → VITE_APP_PASSWORD = $NEW_PASSWORD
# → Save (vai fazer redeploy)

# 3. Comunicar cliente
# "Dr. João, sua senha foi resetada. Acesse com: $NEW_PASSWORD"
```

### Deletar Todos os Dados de Um Cliente (NUKE)

```bash
# ⚠️ IRREVERSÍVEL! Fazer backup antes!

NUKE_KEY=$(cat ~/law-sovereign-clients/credentials-cliente.txt | grep "Nuke Key" | cut -d: -f2)

curl -X POST \
  -H "x-nuke-key: $NUKE_KEY" \
  https://law-sovereign-cliente.vercel.app/admin/nuke

# Esperado:
# {
#   "success": true,
#   "deleted": 15,  ← Quantos clientes foram deletados
#   "message": "☢️ All data nuked"
# }
```

### Fazer Backup de Um Cliente

```bash
# Railway: Backups automáticos (diários)
# Você não precisa fazer nada
# Se precisar restore: contact Railway support

# Alternativa: Exportar dados
curl -H "x-api-key: $API_KEY" \
  https://law-sovereign-cliente.vercel.app/clients > backup-$(date +%Y%m%d).json

# Isso cria um JSON com todos os clientes
```

---

## TESTES AUTOMATIZADOS

### Teste 1: Health Check (Executar 1x/dia)
```bash
for client in joao-silva maria-santos pedro-oliveira; do
  STATUS=$(curl -s https://law-sovereign-$client.vercel.app/health | grep -o '"status":"[^"]*"')
  echo "$client: $STATUS"
done
```

### Teste 2: Isolamento (Executar antes de cada release)
```bash
bash ~/Projetos/law-sovereign-web/test-isolation.sh \
  "cliente-1" "cliente-2" "$API_KEY"
# Deve retornar: ✅ ISOLAMENTO VALIDADO COM SUCESSO!
```

### Teste 3: Performance (Executar 1x/mês)
```bash
# Medir tempo de resposta
time curl -H "x-api-key: $API_KEY" \
  https://law-sovereign-cliente.vercel.app/clients > /dev/null

# Deve ser < 500ms
```

---

## ROADMAP FUTURO

### Fase 1 (AGORA): Mono-Tenant
- ✅ Cada cliente = seu PostgreSQL
- ✅ Isolamento garantido
- ✅ Deploy via script
- ✅ Teste automático de isolamento

### Fase 2 (5+ clientes): Multi-Tenant com Schema
- 📋 1 PostgreSQL compartilhado
- 📋 Cada cliente em seu "schema" PostgreSQL
- 📋 Economia: R$20/mês por cliente
- 📋 Complexidade: Agregador de tenant_id em queries

### Fase 3 (50+ clientes): Multi-Tenant Enterprise
- 📋 Replicação de dados entre data centers
- 📋 High availability + DR
- 📋 Billing automatizado
- 📋 Self-service customer portal

---

## CONTATO DE SEGURANÇA

Se você descobrir uma brecha de segurança:

1. **Pare tudo** (não faça deploy)
2. **Documente** (o que aconteceu, como descobriu)
3. **Avise clientes afetados** (transparência)
4. **Procure ajuda** (pode contactar Mimir ou especialista)

**Confidentiality > Feature Velocity**

---

**Desenvolvido para proteger dados de clientes.**
**Sem paranoia. Com precisão técnica.**
