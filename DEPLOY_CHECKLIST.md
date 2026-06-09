# 📋 DEPLOY MONO-TENANT — CHECKLIST RÁPIDO

## ANTES DE COMEÇAR
- [ ] Cliente fechou contrato (R$750)
- [ ] Você está em `/home/mimir/Projetos/law-sovereign-web`
- [ ] Você tem acesso ao Railway.app
- [ ] Vercel CLI está instalado (`vercel login`)

---

## FLUXO EM 3 PASSOS

### PASSO 1: CRIAR BANCO NO RAILWAY (10 min)

```bash
# 1. Acesse https://railway.app/dashboard
# 2. Clique "+ Create"
# 3. Selecione "PostgreSQL"
# 4. Aguarde 30 seg
# 5. Clique no banco novo
# 6. Vá em "Connect"
# 7. Copie a URL inteira (começa com postgresql://)
```

**Guardar:** `postgresql://postgres:xYz123abc...@containers.railway.app:5432/railroad`

---

### PASSO 2: EXECUTAR DEPLOY SCRIPT (10 min)

```bash
cd ~/Projetos/law-sovereign-web

./deploy-client.sh "nome-cliente" "email@example.com"
```

**Quando o script pedir DATABASE_URL:**
→ Cole a que você copiou do Railway

**Resultado esperado:**
```
✅ DEPLOYMENT CONCLUÍDO!
URL: https://law-sovereign-nome-cliente.vercel.app
```

---

### PASSO 3: CONFIGURAR VERCEL & VALIDAR (10 min)

```bash
# 1. Acesse https://vercel.com/dashboard
# 2. Selecione law-sovereign-nome-cliente
# 3. Settings → Environment Variables
# 4. Adicione:
#    - DATABASE_URL = postgresql://...
#    - VITE_APP_PASSWORD = [escolha uma]
#    - INTERNAL_API_KEY = [está no arquivo credentials]
#    - NUKE_KEY = [está no arquivo credentials]
#    - GEMINI_API_KEY = [sua chave]
# 5. Clique em cada variável para confirmar
# 6. Vercel vai fazer redeploy automaticamente
# 7. Aguarde 2-3 min até ficar verde (✅ Deployment successful)
```

---

## TESTES DE VALIDAÇÃO (OBRIGATÓRIO)

### Teste 1: Health Check
```bash
curl https://law-sovereign-nome-cliente.vercel.app/health

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

### Teste 2: Login
Acesse no navegador:
```
https://law-sovereign-nome-cliente.vercel.app
```
- [ ] Página carrega
- [ ] Form de login aparece
- [ ] Digite a senha (VITE_APP_PASSWORD)
- [ ] Clique em "Entrar"
- [ ] **Deve entrar** ✅

### Teste 3: Adicionar Cliente de Teste
- [ ] Clique "+ Novo Cliente"
- [ ] Preencha: Nome = "Teste", Status = "TRIAGEM"
- [ ] Clique "Salvar"
- [ ] Deve aparecer na lista ✅

### Teste 4: Isolamento (SE TIVER OUTRO CLIENTE JÁ DEPLOYED)
```bash
# Obtenha a INTERNAL_API_KEY do arquivo de credentials
API_KEY=$(grep "API Key:" ~/law-sovereign-clients/credentials-nome-cliente.txt | cut -d: -f2 | xargs)

# Execute o teste
bash ~/Projetos/law-sovereign-web/test-isolation.sh \
  "cliente-novo" \
  "cliente-antigo" \
  "$API_KEY"

# Esperado:
# ✅ ISOLAMENTO VALIDADO COM SUCESSO!
```

---

## ENTREGÁVEIS

### Para o Cliente (Envie por WhatsApp/Email):
```
Dr. João,

Seu sistema está pronto! 🎉

🔗 Acesse aqui: https://law-sovereign-joao-silva.vercel.app
🔐 Senha: [VITE_APP_PASSWORD que você configurou]

Próximos passos:
1. Clique no link acima
2. Faça login com a senha
3. Teste adicionando um cliente
4. Agende comigo para importar clientes antigos
5. Treinamento (30 min)

Algo errado? Me avisa no WhatsApp.
```

### Para Você (Arquive):
- [ ] Credenciais salvas: `~/law-sovereign-clients/credentials-joao-silva.txt`
- [ ] Log de deploy: `~/law-sovereign-clients/deployments.log`
- [ ] Cliente adicionado à memória seu (planilha de clientes)

---

## TROUBLESHOOTING RÁPIDO

| Problema | Solução |
|----------|---------|
| "Health retorna db: disconnected" | Verifica DATABASE_URL em Vercel |
| "Login rejeitado" | Verifica VITE_APP_PASSWORD em Vercel |
| "Erro 404" | Aguarda 2-3 min (redeploy em andamento) |
| "Database does not exist" | Railway pode estar em restart, aguarda 1 min |
| "Vejo dados de outro cliente" | **PARAR TUDO** → Rodar test-isolation.sh |

---

## LEITURA COMPLETA (Se Algo Não Estiver Claro)

| Documento | Para Quem | Quando Ler |
|-----------|-----------|-----------|
| `ISOLAMENTO_MONO_TENANT.md` | Você (Davi) | Antes do 1º deploy |
| `SEGURANCA_ISOLAMENTO.md` | Você (se der problema) | Se houver incidente |
| `DEPLOY_CHECKLIST.md` | Você (referência rápida) | Cada novo deploy |
| `test-isolation.sh` | Você (script de teste) | Sempre rodar após deploy |

---

## RECAP DOS 3 PASSOS

```
1. Railway: Criar novo PostgreSQL
   ↓
2. Deploy: ./deploy-client.sh "nome" "email"
   ↓
3. Vercel: Adicionar env vars + redeploy
   ↓
4. Teste: curl /health + login + test-isolation.sh
   ↓
✅ Pronto pra entregar!
```

---

## DÚVIDAS?

Leia primeiro o doc. Se não resolver:

1. **Técnica:** SEGURANCA_ISOLAMENTO.md (Troubleshooting)
2. **Procedimento:** ISOLAMENTO_MONO_TENANT.md (Passo-a-passo)
3. **Rápido:** Este documento (Checklist)

**Não complique. Siga a ordem.**

---

*Desenvolvido para você não perder tempo nem dados de clientes.*
