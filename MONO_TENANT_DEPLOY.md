# 🚀 LAW SOVEREIGN — MONO-TENANT DEPLOYMENT GUIDE

## O QUE É ISSO?

Script que clona e deploya **Law Sovereign para cada cliente** como um ambiente separado.

Cada cliente recebe sua própria URL:
- Cliente 1: `https://law-sovereign-joao-silva.vercel.app`
- Cliente 2: `https://law-sovereign-lima-torres.vercel.app`
- Cliente 3: `https://law-sovereign-gustavo-chaves.vercel.app`

Isolamento total. Dados de cada cliente em banco separado.

---

## ⚙️ PRÉ-REQUISITOS

### Instalações obrigatórias:

1. **Git**
   ```bash
   git --version  # verificar se tá instalado
   ```

2. **Node.js** (14+)
   ```bash
   node --version
   npm --version
   ```

3. **Vercel CLI**
   ```bash
   npm install -g vercel
   vercel login  # autenticar com sua conta Vercel
   ```

4. **Acesso ao Railway**
   - Conta criada em railway.app
   - PostgreSQL provisionado
   - `DATABASE_URL` à mão

5. **Gemini API Key** (opcional, para OCR)
   - Gere em: console.cloud.google.com
   - Salve em sua máquina

### Verificar tudo:
```bash
git --version
node --version
vercel --version
vercel whoami  # confirmar que está logged in
```

---

## 🎯 COMO USAR

### Uso básico:
```bash
./deploy-client.sh "nome-cliente" "email@example.com"
```

### Exemplos:
```bash
# Cliente 1
./deploy-client.sh "joao-silva" "joao@example.com"

# Cliente 2
./deploy-client.sh "lima-torres" "lima@example.com"

# Cliente 3
./deploy-client.sh "gustavo-chaves" "gustavo@example.com"
```

### O que o script faz:
1. ✅ Clone do repositório completo
2. ✅ Configuração de variáveis de ambiente únicas
3. ✅ Instalação de dependências
4. ✅ Build da aplicação
5. ✅ Deploy no Vercel (cria nova URL)
6. ✅ Geração de credenciais de segurança
7. ✅ Registro em arquivo de log

---

## 📋 FLUXO COMPLETO (Passo a Passo)

### ANTES DO SCRIPT (10 min)

1. **Cliente fecha contrato**
   - Setup: R$750
   - Mensalidade: R$297/mês
   - Contrato assinado

2. **Você recebe PIX (R$750)**
   - Confirma o valor
   - Anota data

3. **Pergunta do cliente**
   - "Quando começa?"
   - "Como faço pra acessar?"

### EXECUTAR O SCRIPT (30 min)

```bash
cd ~/Projetos/law-sovereign-web

# Substitua com dados reais
./deploy-client.sh "joao-silva" "joao@example.com"
```

**O script vai:**
- Clonar tudo
- Pedir confirmação de login Vercel (pode abrir navegador)
- Fazer deploy
- Mostrar a URL nova

**Tempo:** ~5-10 minutos, dependendo da conexão.

### DEPOIS DO SCRIPT (5 min)

1. **Abra Vercel Dashboard**
   ```
   https://vercel.com/dashboard
   ```

2. **Selecione o novo projeto**
   - Ex: `law-sovereign-joao-silva`

3. **Vá em Settings → Environment Variables**

4. **Adicione as variáveis obrigatórias:**

   ```
   DATABASE_URL = postgres://[cole aqui o URL do Railway]
   INTERNAL_API_KEY = [já foi gerado, está no arquivo de credenciais]
   NUKE_KEY = [já foi gerado, está no arquivo de credenciais]
   VITE_APP_PASSWORD = [escolha uma senha simples, ex: "123456"]
   GEMINI_API_KEY = [opcional, para OCR funcionar]
   OCR_MODEL = gemini-2.5-flash
   ```

5. **Clique em "Deploy" (para aplicar as variáveis)**
   - Vercel vai fazer rebuild automático
   - Espere ~2-3 min

6. **Teste o login**
   - Acesse: `https://law-sovereign-joao-silva.vercel.app`
   - Use a senha que configurou
   - Deve funcionar!

### ENTREGAR PRO CLIENTE (5 min)

Envie uma mensagem:

```
Dr. João,

Seu sistema Law Sovereign está pronto! 🎉

🔗 Acesse aqui: https://law-sovereign-joao-silva.vercel.app
🔐 Senha: [a senha que você configurou]

Próximos passos:
1. Faça login acima
2. Agende uma call comigo pra importar seus clientes
3. Treinamento (1h)
4. Pronto pra usar!

Algo errado? Me chama no WhatsApp.
```

---

## 📁 ESTRUTURA DE ARQUIVOS

Após rodar o script, você terá:

```
~/law-sovereign-clients/
├── law-sovereign-joao-silva/          ← Clone completo pra joao
│   ├── src/
│   ├── server/
│   ├── .env.local                     ← Variáveis únicas
│   └── package.json
│
├── law-sovereign-lima-torres/         ← Clone completo pra lima
│   ├── src/
│   ├── server/
│   ├── .env.local                     ← Variáveis únicas
│   └── package.json
│
├── deployments.log                    ← Log de todos os deploys
├── credentials-joao-silva.txt         ← Credenciais de joao
└── credentials-lima-torres.txt        ← Credenciais de lima
```

---

## 🔐 SEGURANÇA

### O que cada cliente NÃO vê:

- ❌ Dados de outros clientes (banco isolado)
- ❌ Código-fonte (Vercel só publica o build)
- ❌ Variáveis de ambiente (server-side only)
- ❌ API Keys (GEMINI_API_KEY não trafega pro front)

### O que você (dono) vê:

- ✅ Arquivo `.env.local` de cada cliente
- ✅ `INTERNAL_API_KEY` único por cliente
- ✅ `NUKE_KEY` pra deletar dados se necessário
- ✅ Todos os logs em `deployments.log`

---

## 🚨 TROUBLESHOOTING

### Erro: "vercel not found"
```bash
npm install -g vercel
vercel login
```

### Erro: "Not authenticated"
```bash
vercel logout
vercel login
# Confirme no navegador
```

### Erro: "DATABASE_URL missing"
O script vai avisar. Você precisa configurar manualmente no Vercel:
1. Vercel Dashboard
2. Project → Settings → Environment Variables
3. Adicione `DATABASE_URL`
4. Deploy novamente

### URL mostra erro 500
Geralmente é porque `DATABASE_URL` ou `VITE_APP_PASSWORD` não está configurado.
- Verifique as variáveis no Vercel
- Faça redeploy
- Espere 1-2 min
- Tente novamente

### Cliente não consegue fazer login
1. Verifique a `VITE_APP_PASSWORD` no Vercel
2. Tente a senha que você configurou
3. Se ainda não funcionar, resete:
   ```bash
   # Volte ao diretório do cliente
   cd ~/law-sovereign-clients/law-sovereign-joao-silva
   vercel env add VITE_APP_PASSWORD
   vercel --prod  # redeploy
   ```

---

## 📊 MONITORAMENTO

### Ver todos os deploys:
```bash
cat ~/law-sovereign-clients/deployments.log
```

### Ver credenciais de um cliente:
```bash
cat ~/law-sovereign-clients/credentials-joao-silva.txt
```

### Checar status no Vercel:
```bash
vercel projects list
```

---

## 💰 CUSTOS

### Vercel (Frontend)
- Hobby Plan: **FREE**
- Bandwidth: até 100 GB/mês
- Deployments: unlimited

### Railway (Backend + Database)
- Por cliente: ~**R$5/mês** (depois que trial acabar)
- 10 clientes: ~R$50/mês
- Você ganha: R$2.970/mês (10 × R$297)
- **Margem: +R$2.920/mês**

### Quando escalar pra Multi-Tenant?
Quando tiver 5+ clientes. Aí refatora pra compartilhar banco, economiza R$20/mês de infra.

---

## 🔄 REFATOR PRO MULTI-TENANT (Semana 4+)

Quando tiver 3-4 clientes pagando, você pode:

1. Mover todos os bancos pro compartilhado
2. Atualizar as URLs
3. Economizar em infra
4. Onboarding automático

Esse refator leva ~1-2 dias. Para então.

---

## 📞 SUPORTE PRO CLIENTE

Quando cliente tiver dúvida, você responde:

**Problema: "Esqueci a senha"**
```
Dr., sem problema. Deixa comigo.
[Você]
- Vai no Vercel
- Reseta VITE_APP_PASSWORD
- Manda nova senha
- Cliente tenta novamente
```

**Problema: "Está lento"**
```
Dr., pode ser o banco. Deixa eu checar.
[Você]
- Verifica Railway (CPU/Memory)
- Se full, upg plano
- Se vazio, pode ser rede
```

**Problema: "OCR não funciona"**
```
Dr., tá funcionando aqui. Pode ser a imagem.
Tira uma foto de frente, bem clara, sem sombra.
[Cliente tira nova foto]
Pronto! Funcionou?
```

---

## ✅ CHECKLIST PRÉ-ENTREGA

Antes de liberar pro cliente:

- [ ] Script rodou sem erro
- [ ] Vercel mostrou nova URL
- [ ] Variáveis de ambiente configuradas no Vercel
- [ ] Vercel fez redeploy
- [ ] Testei login com a senha
- [ ] OCR testado (se aplicável)
- [ ] Documento armazenado
- [ ] Cliente consegue acessar de outro navegador
- [ ] Credenciais salvas em arquivo
- [ ] Log atualizado

---

## 📝 EXEMPLO REAL

```bash
# Você recebe PIX de Gustavo Chaves
# Email: gustavo@advchaves.com
# Setup: R$750 ✓
# Período: 2026-06-08

# Você roda:
./deploy-client.sh "gustavo-chaves" "gustavo@advchaves.com"

# Script mostra:
# ✅ DEPLOYMENT CONCLUÍDO COM SUCESSO!
# Nome: gustavo-chaves
# Email: gustavo@advchaves.com
# URL: https://law-sovereign-gustavo-chaves.vercel.app

# Você configura no Vercel:
# - DATABASE_URL ✓
# - VITE_APP_PASSWORD ✓
# - GEMINI_API_KEY ✓

# Você testa:
# - Login funciona ✓
# - Adicionar cliente funciona ✓
# - OCR funciona ✓

# Você envia pra Gustavo:
# "Dr. Gustavo, seu sistema está pronto!
#  URL: https://law-sovereign-gustavo-chaves.vercel.app
#  Senha: [senha]"

# Gustavo testa e manda uma mensagem:
# "Funcionou!! Quando você pode treinar a gente?"

# Pronto! ✅
```

---

## 🎯 FOCO

**Objetivo:** Vender 1 cliente por semana nos próximos 4 semanas.

**Semana 1:** 1 cliente (Gustavo ou Lima)  
**Semana 2:** +1 cliente (indicação de Gustavo)  
**Semana 3:** +1 cliente (indicação de Lima)  
**Semana 4:** +1 cliente (indicação de Junior ou prospectado)  

**Total em 1 mês:** 4 clientes = **R$1.188/mês recorrente** 💰

Depois, refatora pra multi-tenant, margem sobe, vida melhora.

---

**Sucesso! 🚀**
