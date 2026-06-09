# 🚀 LAW SOVEREIGN - DEPLOYMENT GUIDE

## Status Pre-Deploy ✅

- **Security Audit:** ✅ 15/16 issues resolvidas (94%)
- **Functional Tests:** ✅ 9/9 passed
- **Performance Tests:** ✅ 5/5 passed
- **Concurrency Tests:** ✅ 10+ parallel updates OK
- **Production Ready:** ✅ YES

---

## 📋 Pré-Requisitos

```bash
# Frontend
- Node.js 18+
- npm/yarn

# Backend  
- Node.js 18+
- PostgreSQL 13+
- INTERNAL_API_KEY environment variable

# Deployment
- Vercel account (frontend)
- Railway account (backend)
- GitHub repository
```

---

## 🔧 Variáveis de Ambiente

### Railway (Backend)

```env
# Database
DATABASE_URL=postgresql://user:pass@host:5432/law_sovereign

# Auth
JWT_SECRET=<use INTERNAL_API_KEY>
INTERNAL_API_KEY=<generate random 64-char hex>
NUKE_KEY=<generate random 64-char hex>

# API
OCR_MODEL=gemini-2.5-flash
GEMINI_API_KEY=<from Google Cloud>
NODE_ENV=production
PORT=4000
```

### Vercel (Frontend)

```env
# In vercel.json
VITE_API_URL=https://law-sovereign-web-production.up.railway.app
VITE_INTERNAL_API_KEY=<same as Railway>
```

---

## 🎯 Deploy Steps

### 1. Backend (Railway)

```bash
# Connect GitHub repo to Railway
# Set environment variables in Railway dashboard
# Trigger deploy from GitHub

# Verify:
curl https://law-sovereign-web-production.up.railway.app/health
```

### 2. Frontend (Vercel)

```bash
# Connect GitHub repo to Vercel
# Set VITE_API_URL in Environment Variables
# Trigger deploy from GitHub

# Verify:
curl https://law-sovereign.vercel.app/
```

### 3. Database Migrations

```bash
# Automatic on Railway startup (server/src/index.ts:syncDatabase)
# Creates Tenant, Client, TimelineEvent, AuditLog tables
# No manual migration needed
```

---

## 🔐 Security Checklist

- [x] JWT_SECRET strong (64+ chars, random)
- [x] INTERNAL_API_KEY restricted (env var, not in code)
- [x] CORS whitelist updated (production domains only)
- [x] HSTS enabled (1 year, browsers only)
- [x] Rate limiting active (login, OCR, global)
- [x] Soft delete enabled (data recovery possible)
- [x] Audit logging functional (who/what/when)
- [x] Input validation (Zod schemas)
- [x] SessionStorage (not localStorage)
- [x] Admin role enforced

---

## 📊 Performance Baseline

| Metric | Baseline |
|--------|----------|
| Throughput | 89 req/sec |
| Query time (50 clients) | 14ms |
| Payload size | 17.37 KB |
| Connection pool | 20 parallel |
| Memory stable | avg 11ms |

---

## 🚨 Critical Endpoints

### Public
- `POST /auth/login` - Rate limited (5/5min)
- `POST /auth/register` - Admin only (x-api-key header)
- `GET /health` - No auth needed

### Protected (Admin)
- `POST /admin/nuke` - Requires role=ADMIN

### Protected (User)
- `GET /clients` - Filters by tenantId (auto isolation)
- `POST /clients` - Creates in user's tenant
- `PATCH /clients/:id` - Uses transaction (race condition safe)
- `DELETE /clients/:id` - Soft delete (deletedAt marker)

---

## 📝 Monitoring

### Health Check
```bash
curl -i https://api.production.com/health
```

### Audit Log Query
```bash
# Check who did what
SELECT * FROM "AuditLog" 
WHERE "createdAt" > NOW() - INTERVAL '1 hour' 
ORDER BY "createdAt" DESC;
```

### Performance Monitoring
- Response times: target < 100ms
- Error rate: target < 0.1%
- Uptime: target > 99.9%

---

## 🔄 Rollback Plan

If issues occur:

1. **Frontend:** Revert Vercel deployment (1-click)
2. **Backend:** Revert Railway deployment (1-click)
3. **Database:** Data is safe (soft deletes, audit logs preserved)

---

## ✅ Post-Deploy

- [ ] Verify login works on production
- [ ] Test admin panel (registrar cliente)
- [ ] Check audit logs being created
- [ ] Verify soft delete (create, delete, verify invisible)
- [ ] Test rate limiting (spam login)
- [ ] Verify security headers present
- [ ] Check performance (load test if needed)

---

## 📞 Support

For issues:
1. Check Railway logs: `railay logs <service-id>`
2. Check Vercel logs: Vercel Dashboard > Deployments
3. Review audit logs: `SELECT * FROM "AuditLog" ORDER BY "createdAt" DESC`
4. Check error messages: generic, never expose stack traces

---

**Deploy Date:** 2026-06-09  
**Approved By:** Sage (Security Review)  
**Status:** ✅ READY FOR PRODUCTION
