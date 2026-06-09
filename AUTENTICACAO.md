# Autenticação JWT — Law Sovereign

## Como Funciona

Law Sovereign usa **JWT (JSON Web Tokens)** para autenticação com multi-tenancy total:

- Cada usuário (tenant) tem **email + senha bcryptada**
- Login retorna um **JWT com expiração de 7 dias**
- Todas as requisições protegidas precisam do token no header `Authorization: Bearer <token>`
- Cada tenant vê **apenas seus dados** — isolamento garantido por `tenantId` em todas as queries

## Endpoints de Autenticação

### Registrar Nova Conta

```bash
POST /auth/register
Content-Type: application/json

{
  "email": "seu@email.com",
  "password": "SenhaSegura123",  # Mínimo 8 caracteres
  "name": "Dr. Nome"
}

Response (201):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "seu@email.com"
}
```

**Validações:**
- Email deve ser único
- Senha mínimo 8 caracteres
- Todos os campos são obrigatórios

**Erros:**
- `409 Conflict` — Email já registrado
- `400 Bad Request` — Campos inválidos ou missing

---

### Fazer Login

```bash
POST /auth/login
Content-Type: application/json

{
  "email": "seu@email.com",
  "password": "SenhaSegura123"
}

Response (200):
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "tenantId": "550e8400-e29b-41d4-a716-446655440000",
  "email": "seu@email.com"
}
```

**Validações:**
- Email e senha obrigatórios

**Erros:**
- `401 Unauthorized` — Email ou senha inválidos (mensagem genérica)
- `429 Too Many Requests` — Mais de 5 tentativas em 5 minutos (rate limiting por IP)

---

## Usando o Token

Depois de login, o token é salvo no `localStorage`:

```javascript
// Armazenado automaticamente em localStorage
{
  "auth": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "email": "seu@email.com"
  }
}
```

**Em requisições HTTP, envie:**

```bash
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**Exemplo com curl:**

```bash
curl -H "Authorization: Bearer TOKEN_AQUI" \
  https://api.law-sovereign.io/clients
```

**Exemplo com axios (React):**

```javascript
import axios from 'axios';

// Automaticamente configurado por storage.setToken()
axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

// Agora todas as requisições incluem o token
const clients = await axios.get('/clients');
```

---

## Ciclo de Vida do Token

- **Gerado em:** `/auth/register` ou `/auth/login`
- **Expiração:** 7 dias (604.800 segundos)
- **Sem refresh:** Token expirado requer novo login
- **Armazenamento:** localStorage (cliente) + JWT_SECRET (servidor)

**Quando o token expira:**

```bash
curl -H "Authorization: Bearer TOKEN_EXPIRADO" \
  https://api.law-sovereign.io/clients

Response (401):
{
  "error": "Token expirado ou inválido"
}
```

---

## Fazer Logout

Há duas formas:

### 1. Via JavaScript (React)

```javascript
import { storage } from './api/storage';

// Remove token do localStorage e redireciona para login
storage.logout();
```

### 2. Manual

```javascript
localStorage.removeItem('auth');
delete axios.defaults.headers.common['Authorization'];
window.location.reload();
```

---

## Rate Limiting

Proteção contra força bruta em `/auth/login`:

- **Limite:** 5 tentativas por IP
- **Janela:** 5 minutos
- **Armazenamento:** Memória do servidor (reseta ao reiniciar)

**Quando bloqueado:**

```bash
HTTP 429 Too Many Requests

{
  "error": "Muitas tentativas de login. Tente novamente em 5 minutos."
}
```

---

## Multi-Tenancy & Isolamento

Cada tenant vê **apenas seus dados**:

```javascript
// Tenant A com token A
GET /clients
Response: [{ id: "client-1", tenantId: "tenant-A", name: "Cliente 1" }]

// Tenant B com token B (que era token A)
GET /clients
Response: [{ id: "client-2", tenantId: "tenant-B", name: "Cliente B" }]
// Tenant A's data é invisível para Tenant B
```

**Proteção implementada:**

1. **Query filtering:** Todas as queries filtram por `tenantId` do token
2. **Authorization checks:** Antes de atualizar/deletar, verifica se `tenantId` coincide
3. **Token payload:** JWT contém `{ id, email }` (tenantId derivado de `id`)

**Exemplo de brecha (já fechada):**

```bash
# Tenant B tenta acessar dados de Tenant A
PATCH /clients/client-1 { status: "PROPOSTA" }
Authorization: Bearer TOKEN_TENANT_B

Response (403):
{
  "error": "Acesso negado"
}
```

---

## Rotas Públicas (sem autenticação)

As seguintes rotas **não requerem** JWT:

| Rota | Método | Uso |
|------|--------|-----|
| `/auth/register` | POST | Criar conta |
| `/auth/login` | POST | Fazer login |
| `/capture` | POST | Capturar lead do site público |
| `/portal/:id` | GET | Cliente ver seu próprio dossier |
| `/health` | GET | Health check |
| `/debug` | GET | Debug (use com cuidado) |

---

## Variáveis de Ambiente

### Server (Railway)

```bash
# Gerada automaticamente:
DATABASE_URL=postgresql://user:pass@host/db

# Defina uma chave JWT segura:
# Node.js: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
INTERNAL_API_KEY=seu_jwt_secret_super_seguro_aqui

# Opcional:
NODE_ENV=production
PORT=4000
OCR_MODEL=gemini-2.5-flash
GEMINI_API_KEY=sua_chave_gemini
NUKE_KEY=sua_chave_de_reset_perigosa
```

### Client (Vercel)

```bash
VITE_API_URL=https://seu-api.railway.app
```

---

## Troubleshooting

### "Token não fornecido ou inválido"

Causas:
- Header `Authorization` não enviado
- Sintaxe errada: use `Bearer TOKEN`, não `Token TOKEN`
- Token vazio

Solução:
```javascript
const auth = JSON.parse(localStorage.getItem('auth') || '{}');
axios.defaults.headers.common['Authorization'] = `Bearer ${auth.token}`;
```

### "Token expirado ou inválido"

Causas:
- Token venceu (7 dias)
- Token foi corrompido/alterado
- Servidor rodando com `INTERNAL_API_KEY` diferente

Solução:
- Faça login novamente
- Verifique `INTERNAL_API_KEY` no servidor

### "Muitas tentativas de login"

Causas:
- Mais de 5 tentativas em 5 minutos do mesmo IP

Solução:
- Aguarde 5 minutos
- Verifique IP (se VPN/proxy, pode estar bloqueado)
- Verifique email/senha

### Tenant vendo dados de outro tenant

Causas:
- Bug no isolamento (reporte imediatamente)

Verificar:
```javascript
// Confirme que tenantId está no JWT:
const payload = JSON.parse(atob(token.split('.')[1]));
console.log(payload); // { id: "tenant-id", email: "..." }
```

---

## Deploy & Segurança

### Checklist

- [ ] `INTERNAL_API_KEY` definida e segura (32+ caracteres aleatórios)
- [ ] `VITE_API_URL` aponta para URL de produção do servidor
- [ ] CORS whitelist inclui domínio do frontend
- [ ] Banco de dados PostgreSQL online e acessível
- [ ] Senhas bcryptadas (nunca plaintext)
- [ ] JWT_EXPIRY é 7 dias
- [ ] Rate limiting ativo em `/auth/login`

### Em Produção

```bash
# Gere uma chave JWT segura:
openssl rand -base64 32

# Configure no Railway:
INTERNAL_API_KEY=<output do comando acima>

# Verifique no Vercel:
VITE_API_URL=https://seu-api.railway.app
```

---

## Próximos Passos

- [ ] Trocar senha (endpoint `/auth/change-password`)
- [ ] Reset de senha via email
- [ ] Refresh tokens (para senhas de longa duração)
- [ ] 2FA (autenticação de dois fatores)
- [ ] OAuth2 / SSO (Google, Microsoft)

---

**Última atualização:** 2026-06-09
**Versão:** 1.0
**Autor:** Maelstrom
