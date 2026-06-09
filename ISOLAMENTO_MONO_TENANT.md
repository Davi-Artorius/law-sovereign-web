# 🔐 ISOLAMENTO MONO-TENANT — GUIA CRÍTICO

## DIAGNÓSTICO: O RISCO ENCONTRADO

### Problema Identificado
O script `deploy-client.sh` **não garante isolamento de dados** entre clientes.

**Cenário de Falha:**
```
Cliente A (João)     → https://law-sovereign-joao.vercel.app     → ?
Cliente B (Maria)    → https://law-sovereign-maria.vercel.app    → ?
                           ↑ ↑
                    AMBOS APONTAM PARA O MESMO DATABASE_URL?
                    → Cliente A vê dados de Cliente B ✗ VAZAMENTO
```

### Por Que Acontece?
1. Deploy script **pede manualmente** o `DATABASE_URL` (linhas 111-118)
2. Se o operador (você) **colar o mesmo URL** em 2 clientes diferentes
3. Ambos compartilham o **mesmo banco PostgreSQL**
4. Não há isolamento no nível de aplicação (sem schema/tenant_id)
5. **Resultado**: Cliente A consulta `SELECT * FROM clients` → vê TUDO, inclusive dados de B

### Verificação Rápida (Como Saber Se Está Furado)
```bash
# Cliente A
curl -H "x-api-key: $API_KEY_A" https://law-sovereign-joao.vercel.app/clients
# Retorna: [{"id": "uuid-joao", "name": "Empresa João", ...}]

# Cliente B (com API key diferente)
curl -H "x-api-key: $API_KEY_B" https://law-sovereign-maria.vercel.app/clients
# Retorna: [
#   {"id": "uuid-joao", "name": "Empresa João", ...},    ← Não deveria estar aqui!
#   {"id": "uuid-maria", "name": "Empresa Maria", ...}
# ]
# ✗ VAZAMENTO CONFIRMADO
```

---

## SOLUÇÃO: ISOLAMENTO GARANTIDO

### Princípio
**Cada cliente = seu próprio banco PostgreSQL** (não compartilhado)

```
Cliente A (João)     → law-sovereign-joao.vercel.app     → DATABASE_URL_A (banco A)
Cliente B (Maria)    → law-sovereign-maria.vercel.app    → DATABASE_URL_B (banco B)
Cliente C (Pedro)    → law-sovereign-pedro.vercel.app    → DATABASE_URL_C (banco C)

Resultado: A não acessa dados de B ou C ✓ ISOLADO
```

### Tecnicamente: Por Que Funciona
- PostgreSQL **não suporta multi-tenancy nativo** em um banco único
- Solution: **Cada cliente recebe sua própria instância PostgreSQL**
- O Railway (provider atual) permite criar múltiplos bancos facilmente
- Custo: ~R$5/cliente/mês (depois do trial de 30 dias)

---

## PROCEDIMENTO PASSO-A-PASSO: DEPLOY SEGURO

### Antes de Começar
- [ ] Cliente fechou contrato e pagou R$750
- [ ] Você tem acesso ao Railway.app
- [ ] Vercel CLI está configurado (`vercel login`)
- [ ] Você tem as credenciais do cliente (nome, email)

---

### PASSO 1: Criar Banco PostgreSQL NO RAILWAY (para o cliente)

**Local:** https://railway.app

1. **Acesse seu dashboard Railway**
   ```
   https://railway.app/dashboard
   ```

2. **Clique em "+ Create"** (botão azul, canto superior direito)

3. **Selecione "PostgreSQL"**
   - Vai criar um banco novo
   - Aguarde 30 segundos

4. **Abra o banco recém-criado**
   - Clique em "PostgreSQL"
   - Vá em "Connect"
   - Copie a URL inteira (começa com `postgresql://`)
   - **Guarde em lugar seguro** — você vai precisar disso

   Exemplo:
   ```
   postgresql://postgres:xYz123abc...@containers.railway.app:5432/railroad
   ```

5. **Teste a conexão** (opcional, mas recomendado)
   ```bash
   psql "postgresql://postgres:xYz123abc...@containers.railway.app:5432/railroad"
   # Deve conectar sem erro
   ```

**Resultado esperado:**
- 1 novo PostgreSQL no Railway
- 1 `DATABASE_URL` copiado na clipboard
- Pronto para o próximo passo

---

### PASSO 2: Executar o Deploy Script

**Local:** Sua máquina (onde clonou o repositório)

```bash
cd ~/Projetos/law-sovereign-web

# Exemplo: Você vai deployar pra "João Silva"
./deploy-client.sh "joao-silva" "joao@example.com"
```

**O script vai:**
1. ✅ Clonar o repositório
2. ✅ Gerar `INTERNAL_API_KEY` e `NUKE_KEY` únicos
3. ⚠️ Pedir `DATABASE_URL` (IMPORTANTE: Cole aqui!)
4. ✅ Criar `.env.local`
5. ✅ Fazer deploy no Vercel
6. ✅ Salvar credenciais em arquivo

**Quando o script pedir `DATABASE_URL`:**
```
⚠️  DATABASE_URL não definida. Você precisa configurar manualmente no Vercel.
Cole a DATABASE_URL do Railway (ou deixe em branco para skipped):
```

→ **Cole a URL que você copiou do Railway no Passo 1**

Exemplo:
```
postgresql://postgres:xYz123abc...@containers.railway.app:5432/railroad
```

**Pronto! O script vai continuar.**

---

### PASSO 3: Configurar Variáveis no Vercel

**Local:** https://vercel.com/dashboard

1. **Selecione o novo projeto**
   - Nome: `law-sovereign-joao-silva`

2. **Vá em Settings → Environment Variables**

3. **Adicione as seguintes variáveis:**

   | Variável | Valor | Obs |
   |----------|-------|-----|
   | `DATABASE_URL` | `postgresql://...` | Cole a do Railway |
   | `INTERNAL_API_KEY` | Ver em `credentials-joao-silva.txt` | Já foi gerado |
   | `NUKE_KEY` | Ver em `credentials-joao-silva.txt` | Já foi gerado |
   | `VITE_APP_PASSWORD` | Escolha uma senha | Ex: "123456" (mude depois!) |
   | `GEMINI_API_KEY` | Sua chave Gemini | Opcional, para OCR |
   | `OCR_MODEL` | `gemini-2.5-flash` | Deixar como está |

4. **Depois que adicionar todas, Vercel vai fazer redeploy automaticamente**
   - Aguarde 2-3 minutos
   - Status deve ficar verde (✅ Production)

5. **Teste a conexão:**
   ```bash
   # Verificar que o banco está conectado
   curl https://law-sovereign-joao-silva.vercel.app/health
   
   # Esperado:
   # {
   #   "status": "ok",
   #   "db": "connected",
   #   "env": {
   #     "DATABASE_URL": "✓ defined",
   #     "NODE_ENV": "production"
   #   }
   # }
   ```

**Resultado esperado:**
- Vercel mostra ✅ Deployment successful
- `/health` retorna `"db": "connected"`

---

### PASSO 4: Testar Login e Funções Básicas

**Local:** https://law-sovereign-joao-silva.vercel.app

1. **Acesse a URL do cliente**

2. **Faça login**
   - Senha: A que você configurou em `VITE_APP_PASSWORD`

3. **Teste as funções críticas:**
   - [ ] Adicionar um cliente (botão "+ Novo Cliente")
   - [ ] Preencher formulário (nome, status, etc)
   - [ ] Salvar
   - [ ] Verificar que aparece na lista

4. **Teste OCR** (se `GEMINI_API_KEY` foi configurada)
   - Tira uma foto de um documento
   - Faz upload
   - Deve reconhecer texto

**Resultado esperado:**
- Login funciona
- Dados salvos aparecem na lista
- OCR extrai texto (se testado)

---

### PASSO 5: Validar Isolamento (CRÍTICO!)

**Local:** Seu terminal

Execute o script de teste:
```bash
bash ~/Projetos/law-sovereign-web/test-isolation.sh \
  "joao-silva" \
  "maria-santos" \
  "seu-api-key-para-admin"
```

**Exemplo real:**
```bash
bash test-isolation.sh joao-silva maria-santos abc123def456
```

**O script vai:**
1. Deploy cliente João com 1 cliente de teste
2. Deploy cliente Maria com 1 cliente diferente
3. Testar que João não vê dados de Maria
4. Testar que Maria não vê dados de João
5. Mostrar "✅ ISOLAMENTO VALIDADO" ou "❌ VAZAMENTO DETECTADO"

**Se falhar:** algo está errado. Pare e checa os `DATABASE_URL`.

---

### PASSO 6: Entregar Pro Cliente

**Envie uma mensagem:**

```
Dr. João,

Seu sistema Law Sovereign está 100% pronto e seguro! 🎉

🔗 URL de acesso: https://law-sovereign-joao-silva.vercel.app
🔐 Senha de login: [a senha que você configurou]

Próximos passos:
1. Clique no link acima
2. Faça login com a senha
3. Agende uma call comigo pra te treinar (30 min)
4. Importamos seus clientes antigos
5. Pronto pra usar!

Algo não funciona? Me chama no WhatsApp.

Abraço!
```

---

## CHECKLIST CRÍTICO PRÉ-ENTREGA

Antes de liberar pra qualquer cliente, **TODOS** os itens abaixo devem estar ✅:

- [ ] **Isolamento:** Script de teste passou (`test-isolation.sh` retornou ✅)
- [ ] **Banco separado:** Cada cliente tem seu próprio `DATABASE_URL` do Railway
- [ ] **Vercel configurado:** Todas as env vars estão em `Settings → Environment Variables`
- [ ] **Redeploy feito:** Vercel fez redeploy automático após configurar env vars
- [ ] **Login funciona:** Você conseguiu fazer login com a senha
- [ ] **Dados persisted:** Você adicionou um cliente e ele aparece na lista
- [ ] **OCR testado:** (se aplicável) Upload de documento funciona
- [ ] **Zero vazamentos:** Você rodou `test-isolation.sh` e passou

**Se algum item falhar, não libera pro cliente. Volta ao passo que falhou.**

---

## TROUBLESHOOTING

### Erro: "DATABASE_URL não configurada no Vercel"
```bash
# Sintoma: /health retorna:
# "DATABASE_URL": "✗ missing"

# Solução:
1. Vercel Dashboard
2. Project → Settings → Environment Variables
3. DATABASE_URL deve estar lá
4. Se não estiver, adiciona e faz redeploy
5. Espera 2-3 min
6. Testa novamente: curl https://law-sovereign-xxx.vercel.app/health
```

### Erro: "Login não funciona"
```bash
# Sintoma: Tela de login rejeita a senha

# Solução:
1. Checar VITE_APP_PASSWORD em Vercel
2. Confirmar que é exatamente a que você configurou
3. Se duvidoso, reseta:
   - Vercel Dashboard
   - Project → Settings → Environment Variables
   - Remove VITE_APP_PASSWORD
   - Adiciona de novo com a senha correta
   - Redeploy
   - Tenta login novamente
```

### Erro: "Banco vazio no cliente B (dados de A não aparecem)"
```bash
# ✅ ISSO NÃO É ERRO — É O CORRETO!
# Cliente B não deve ver dados de Cliente A
# Isso significa isolamento está funcionando
```

### Erro: "Cliente B vê dados de Cliente A"
```bash
# ❌ VAZAMENTO DETECTADO

# Solução:
1. Checar que DATABASE_URL_A ≠ DATABASE_URL_B
2. Se forem iguais, Railway errou ou você colou a mesma URL 2x
3. Cria um novo banco PostgreSQL no Railway pra Cliente B
4. Copia a URL nova
5. Atualiza em Vercel → Settings → Environment Variables
6. Redeploy
7. Testa novamente com test-isolation.sh
```

---

## ARQUITETURA DE DADOS: Por Que Funciona

### Estrutura Atual (Railway)
```
Railway (provedor)
├── PostgreSQL instância A
│   ├── schema "public"
│   └── tabelas: clients, timeline_events
│
├── PostgreSQL instância B
│   ├── schema "public"
│   └── tabelas: clients, timeline_events
│
└── PostgreSQL instância C
    ├── schema "public"
    └── tabelas: clients, timeline_events
```

**Isolamento:** Cada cliente aponta para sua instância PostgreSQL.
**Segurança:** Mesmo que um `INTERNAL_API_KEY` vaze, ele só acessa o banco daquele cliente.

### Alternativa Futura (Multi-Tenant)
Quando tiver 5+ clientes, pode economizar migrando pra **schema-based tenancy**:
```
1 PostgreSQL compartilhado
├── schema "joao"
│   └── tabelas: clients, timeline_events
├── schema "maria"
│   └── tabelas: clients, timeline_events
└── schema "pedro"
    └── tabelas: clients, timeline_events
```

**Economiza:** De ~R$5/cliente/mês para ~R$0 (dentro da quota free tier)
**Custo de migração:** ~1 dia de trabalho

---

## CUSTOS: Isolamento vs Multi-Tenant

### Mono-Tenant (AGORA)
| Item | Custo |
|------|-------|
| Vercel (frontend) | FREE |
| Railway PostgreSQL × 1 cliente | R$5/mês |
| 10 clientes | R$50/mês |
| **Receita: 10 × R$297/mês** | **R$2.970/mês** |
| **Margem líquida** | **+R$2.920/mês** |

### Multi-Tenant (DEPOIS)
| Item | Custo |
|------|-------|
| Vercel (frontend) | FREE |
| Railway PostgreSQL (1 compartilhado) | R$5/mês |
| 100 clientes | R$5/mês (mesmo custo!) |
| **Receita: 100 × R$297/mês** | **R$29.700/mês** |
| **Margem líquida** | **+R$29.695/mês** |

**Decisão:** Mono-tenant agora (1-2 clientes), multi-tenant quando tiver 5+.

---

## PRÓXIMOS PASSOS

1. ✅ **Hoje:** Deploy do Cliente A com isolamento garantido
2. ✅ **Semana 1:** Cliente B com banco separado
3. ✅ **Semana 2:** Cliente C com banco separado
4. 📋 **Semana 4:** Revisar se merge pra multi-tenant faz sentido

---

## CONTATO COM MIMIR (SE DER RUIM)

Se algo não funciona como esperado:
1. Rode: `bash test-isolation.sh`
2. Cole o output aqui
3. Eu debugo e te retorno com solução

**Garantido:** Nenhum cliente vaza dados para outro.

---

**Desenvolvido com ácido e precisão.**
**Zero rodeios. Zero vazamentos.**
