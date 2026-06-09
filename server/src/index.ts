import express, { Request, Response, NextFunction } from 'express';
import { createClientSchema, updateClientSchema, createEventSchema, registerSchema, loginSchema, uuidParamSchema } from './validation';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import OpenAI from 'openai';
import bcryptjs from 'bcryptjs';
import jwt from 'jsonwebtoken';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

const prisma = new PrismaClient({
  log: ['error', 'warn'],
});

// ─── VERIFY DATABASE HEALTH ─────────────────────────────────────────────
async function verifyDatabaseHealth() {
  try {
    console.log('⚡ Verificando integridade do banco...');

    // Test basic connectivity
    await prisma.$queryRaw`SELECT 1`;

    // Verify critical tables exist
    const tables = await prisma.$queryRaw`
      SELECT table_name
      FROM information_schema.tables
      WHERE table_schema = 'public'
      AND table_name IN ('Tenant', 'Client', 'TimelineEvent', 'AuditLog')
    ` as any[];

    const tableNames = tables.map((t: any) => t.table_name);
    const required = ['Tenant', 'Client', 'TimelineEvent', 'AuditLog'];
    const missing = required.filter(t => !tableNames.includes(t));

    if (missing.length > 0) {
      console.error(`❌ ERRO CRÍTICO: Tabelas faltando: ${missing.join(', ')}`);
      console.error('   Execute: npx prisma migrate deploy');
      throw new Error(`Missing tables: ${missing.join(', ')}`);
    }

    console.log('✓ Banco OK - todas as tabelas presentes');
  } catch (error) {
    console.error('❌ Falha na verificação do banco:');
    console.error((error as any)?.message || error);
    throw error; // Falha fatal - não continua com servidor quebrado
  }
}

// Run health check on startup
verifyDatabaseHealth().catch((e) => {
  console.error('🔴 Falha ao iniciar: banco de dados não está pronto');
  console.error(e);
  process.exit(1);
});

// ─── AUDIT LOGGING ────────────────────────────────────────────────────────
async function logAudit(tenantId: string, email: string, action: string, resourceType: string, resourceId: string, success: boolean, error?: string) {
  try {
    await prisma.auditLog.create({
      data: {
        tenantId,
        email,
        action,
        resourceType,
        resourceId,
        success,
        error
      }
    });
  } catch (e) {
    console.error('Erro ao registrar audit log:', e);
  }
}

// ─── TIPOS ────────────────────────────────────────────────────────────────
interface AuthPayload {
  id: string;
  email: string;
  role: string;
}

interface AuthRequest extends Request {
  tenant?: AuthPayload;
}

// Rate limiting em memória: { ip: { count, timestamp } }
const rateLimitStore: Record<string, { count: number; timestamp: number }> = {};
const RATE_LIMIT_WINDOW = 5 * 60 * 1000; // 5 minutos
const RATE_LIMIT_MAX = 5; // 5 tentativas

// Rate limiting para OCR por tenant: { tenantId: { count, timestamp } }
const ocrRateLimitStore: Record<string, { count: number; timestamp: number }> = {};
const OCR_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const OCR_RATE_LIMIT_MAX = 5; // 5 requisições por minuto

// Rate limiting global por IP: { ip: { count, timestamp } }
const globalRateLimitStore: Record<string, { count: number; timestamp: number }> = {};
const GLOBAL_RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const GLOBAL_RATE_LIMIT_MAX = 100; // 100 requisições por minuto por IP

// ─── OCR via Gemini ────────────────────────────────────────────────────
const OCR_MODEL = process.env.OCR_MODEL || 'gemini-2.5-flash';
const ocrClient = process.env.GEMINI_API_KEY
  ? new OpenAI({ apiKey: process.env.GEMINI_API_KEY, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })
  : null;

// ─── CORS ────────────────────────────────────────────────────────────────
const allowedOrigins = [
  'http://localhost:9090',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  'https://law-sovereign.vercel.app',
  'https://law-sovereign-web.vercel.app',
  'https://law-sovereign-f8am19xn7-davi-artorius-projects.vercel.app',
  process.env.ALLOWED_ORIGIN
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    if (!origin) return callback(null, true);
    if (allowedOrigins.includes(origin)) return callback(null, true);
    if (origin?.startsWith('http://localhost') || origin?.startsWith('http://127.0.0.1')) return callback(null, true);
    callback(new Error(`Origem bloqueada pelo CORS: ${origin}`));
  }
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── JWT SECRET ────────────────────────────────────────────────────────────
const JWT_SECRET_RAW = process.env.JWT_SECRET || process.env.INTERNAL_API_KEY;
if (!JWT_SECRET_RAW || JWT_SECRET_RAW === 'dev-secret-insecure') {
  console.error('❌ ERRO CRÍTICO: JWT_SECRET não configurado em produção!');
  if (process.env.NODE_ENV === 'production') {
    process.exit(1);
  }
}
const JWT_SECRET: string = JWT_SECRET_RAW || 'dev-secret';
const JWT_EXPIRY = '7d';

// ─── MIDDLEWARE: JWT VALIDATION ────────────────────────────────────────────
const verifyJWT = (req: AuthRequest, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'Token não fornecido ou inválido' }) as any;
  }

  const token = authHeader.slice(7); // Remove "Bearer "
  try {
    const payload = jwt.verify(token, JWT_SECRET) as AuthPayload;
    req.tenant = payload;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Token expirado ou inválido' }) as any;
  }
};

// ─── MIDDLEWARE: REQUIRE ADMIN ROLE ────────────────────────────────────────
const requireAdmin = (req: AuthRequest, res: Response, next: NextFunction) => {
  verifyJWT(req, res, () => {
    if (req.tenant?.role !== 'ADMIN') {
      return res.status(403).json({ error: 'Acesso negado: privilégios de admin requeridos' }) as any;
    }
    next();
  });
};

// ─── MIDDLEWARE: RATE LIMITING (IP-based) ──────────────────────────────────
const rateLimitLogin = (req: AuthRequest, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const record = rateLimitStore[ip];

  if (record && now - record.timestamp < RATE_LIMIT_WINDOW) {
    record.count++;
    if (record.count > RATE_LIMIT_MAX) {
      return res.status(429).json({ error: 'Muitas tentativas de login. Tente novamente em 5 minutos.' }) as any;
    }
  } else {
    rateLimitStore[ip] = { count: 1, timestamp: now };
  }

  next();
};

// ─── MIDDLEWARE: RATE LIMITING OCR (por tenant) ────────────────────────────
const rateLimitOCR = (req: AuthRequest, res: Response, next: NextFunction) => {
  if (!req.tenant) return res.status(401).json({ error: 'Não autenticado' }) as any;

  const tenantId = req.tenant.id;
  const now = Date.now();
  const record = ocrRateLimitStore[tenantId];

  if (record && now - record.timestamp < OCR_RATE_LIMIT_WINDOW) {
    record.count++;
    if (record.count > OCR_RATE_LIMIT_MAX) {
      return res.status(429).json({ error: `Limite de OCR excedido. Máximo ${OCR_RATE_LIMIT_MAX} requisições por minuto.` }) as any;
    }
  } else {
    ocrRateLimitStore[tenantId] = { count: 1, timestamp: now };
  }

  next();
};

// ─── MIDDLEWARE: RATE LIMITING GLOBAL (por IP) ────────────────────────────
const rateLimitGlobal = (req: AuthRequest, res: Response, next: NextFunction) => {
  const ip = req.ip || 'unknown';
  const now = Date.now();
  const record = globalRateLimitStore[ip];

  if (record && now - record.timestamp < GLOBAL_RATE_LIMIT_WINDOW) {
    record.count++;
    if (record.count > GLOBAL_RATE_LIMIT_MAX) {
      return res.status(429).json({ error: 'Muitas requisições. Tente novamente em 1 minuto.' }) as any;
    }
  } else {
    globalRateLimitStore[ip] = { count: 1, timestamp: now };
  }

  next();
};

// ─── SECURITY HEADERS ─────────────────────────────────────────────────────
app.use((req, res, next) => {
  // HSTS: força HTTPS por 1 ano
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  // Previne clickjacking
  res.setHeader('X-Frame-Options', 'DENY');
  // Desabilita MIME type sniffing
  res.setHeader('X-Content-Type-Options', 'nosniff');
  // XSS Protection (para navegadores antigos)
  res.setHeader('X-XSS-Protection', '1; mode=block');
  // Referrer Policy
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Aplicar rate limit global (executa ANTES de tudo)
app.use(rateLimitGlobal);

// ─── DEBUG MIDDLEWARE ──────────────────────────────────────────────────────
app.use((req: AuthRequest, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}${req.tenant ? ` (tenant: ${req.tenant.email})` : ''}`);
  if ((req.method === 'POST' || req.method === 'PATCH') && req.body) {
    const { attachment, password, passwordHash, ...rest } = req.body;
    console.log('Payload:', rest, attachment ? '(com anexo)' : '(sem anexo)');
  }
  next();
});

// ─── ROTAS PÚBLICAS ───────────────────────────────────────────────────────
const PUBLIC_PATHS = ['/auth/login', '/auth/register', '/capture', '/health', '/debug'];

app.use((req: AuthRequest, res, next) => {
  const isPublic = PUBLIC_PATHS.includes(req.path) || req.path.startsWith('/portal/');
  if (isPublic) return next();

  // Protege rotas privadas com JWT
  verifyJWT(req, res, next);
});

// ─── HEALTH & DEBUG ───────────────────────────────────────────────────────
app.get('/health', async (req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;
    res.json({
      status: 'ok',
      db: 'connected',
      env: {
        DATABASE_URL: process.env.DATABASE_URL ? '✓ defined' : '✗ missing',
        NODE_ENV: process.env.NODE_ENV || 'undefined'
      }
    });
  } catch (error) {
    res.status(500).json({
      status: 'error',
      db: String(error),
      DATABASE_URL: process.env.DATABASE_URL ? '✓ defined' : '✗ missing'
    });
  }
});

app.get('/debug', async (req, res) => {
  try {
    const tables = await prisma.$queryRaw`
      SELECT table_name FROM information_schema.tables WHERE table_schema = 'public'
    `;
    res.json({ tables, db_connected: true });
  } catch (error) {
    res.json({ error: String(error), db_connected: false });
  }
});

// ─── AUTH: REGISTRO (ADMIN ONLY) ─────────────────────────────────────────────────────────
// Requer header x-api-key para criar novos users (protege auto-registro público)
app.post('/auth/register', async (req: AuthRequest, res) => {
  const apiKey = req.headers['x-api-key'];
  if (apiKey !== process.env.INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Não autorizado — use ./register-user.sh' }) as any;
  }

  // Validação com Zod
  const validation = registerSchema.safeParse(req.body);
  if (!validation.success) {
    const errors = validation.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({ error: `Validação falhou: ${errors}` }) as any;
  }

  const { email, password, name } = validation.data;

  try {
    // Verifica email duplicado
    const existing = await prisma.tenant.findUnique({ where: { email } });
    if (existing) {
      return res.status(409).json({ error: 'Email já registrado' }) as any;
    }

    // Cria tenant com senha hashada
    const passwordHash = await bcryptjs.hash(password, 10);
    const role = email === 'daviambr2@gmail.com' ? 'ADMIN' : 'USER';
    const tenant = await prisma.tenant.create({
      data: { email, passwordHash, name, role }
    });

    // Gera JWT com role
    const token = jwt.sign({ id: tenant.id, email: tenant.email, role: tenant.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    res.status(201).json({ token, tenantId: tenant.id, email: tenant.email });
  } catch (error) {
    console.error('[REGISTER ERROR]', error);
    res.status(500).json({ error: 'Erro ao registrar conta' });
  }
});

// ─── AUTH: LOGIN ───────────────────────────────────────────────────────────
app.post('/auth/login', rateLimitLogin, async (req: AuthRequest, res) => {
  // Validação com Zod
  const validation = loginSchema.safeParse(req.body);
  if (!validation.success) {
    const errors = validation.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({ error: `Validação falhou: ${errors}` }) as any;
  }

  const { email, password } = validation.data;

  try {
    const tenant = await prisma.tenant.findUnique({ where: { email } });

    // Erro genérico: não diz se email existe ou não
    if (!tenant || !(await bcryptjs.compare(password, tenant.passwordHash))) {
      await logAudit('unknown', email, 'LOGIN', 'Tenant', email, false, 'Invalid credentials');
      return res.status(401).json({ error: 'Email ou senha inválidos' }) as any;
    }

    // Log sucesso
    await logAudit(tenant.id, tenant.email, 'LOGIN', 'Tenant', tenant.id, true);

    // Gera JWT com role
    const token = jwt.sign({ id: tenant.id, email: tenant.email, role: tenant.role }, JWT_SECRET, { expiresIn: JWT_EXPIRY });

    res.json({ token, tenantId: tenant.id, email: tenant.email });
  } catch (error) {
    console.error('[LOGIN ERROR]', error);
    res.status(500).json({ error: 'Erro ao fazer login' });
  }
});

// ─── ADMIN: NUKE ──────────────────────────────────────────────────────────
app.post('/admin/nuke', requireAdmin, async (req: AuthRequest, res) => {
  const adminEmail = req.tenant!.email;
  const adminTenantId = req.tenant!.id;

  try {
    // Log ANTES de deletar (para manter o registro)
    await logAudit(adminTenantId, adminEmail, 'NUKE', 'SYSTEM', 'all_data', true);

    // Agora deleta tudo
    await prisma.timelineEvent.deleteMany({});
    await prisma.client.deleteMany({});
    await prisma.tenant.deleteMany({});

    res.json({ success: true, message: '☢️ All data nuked' });
  } catch (error) {
    console.error('[NUKE ERROR]', error);
    res.status(500).json({ error: 'Erro ao executar operação. Contate o administrador.' });
  }
});

// ─── CLIENTS: CRUD COM ISOLAMENTO POR TENANT ──────────────────────────────
app.get('/clients', async (req: AuthRequest, res) => {
  try {
    if (!req.tenant) return res.status(401).json({ error: 'Não autenticado' }) as any;

    // Busca clientes sem eventos na lista (eventos carregam sob demanda via /clients/:id/events)
    // Evita N+1 e reduz payload ao cliente
    // Filtra deletados (soft delete): mostra apenas clientes com deletedAt = null
    const clients = await prisma.client.findMany({
      where: { tenantId: req.tenant.id, deletedAt: null },
      orderBy: { createdAt: 'desc' }
    });
    res.json(clients);
  } catch (error) {
    console.error('ERROR fetching clients:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

app.get('/clients/:id/events', async (req: AuthRequest, res) => {
  const { id } = req.params as { id: string };
  try {
    if (!req.tenant) return res.status(401).json({ error: 'Não autenticado' }) as any;

    const events = await prisma.timelineEvent.findMany({
      where: { clientId: id, tenantId: req.tenant.id }
    });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar eventos' });
  }
});

app.post('/clients', async (req: AuthRequest, res) => {
  if (!req.tenant) return res.status(401).json({ error: 'Não autenticado' }) as any;

  // Validação com Zod
  const validation = createClientSchema.safeParse(req.body);
  if (!validation.success) {
    const errors = validation.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({ error: `Validação falhou: ${errors}` }) as any;
  }

  try {
    const data = validation.data;
    const client = await prisma.client.create({
      data: {
        tenantId: req.tenant.id,
        name: data.name,
        status: data.status,
        case: data.case,
        area: data.area,
        lastAction: data.lastAction,
        phone: data.phone || null,
        chanceOfSuccess: data.chanceOfSuccess,
        costOfWaiting: data.costOfWaiting,
        missingProofs: data.missingProofs,
        isPaperLead: data.isPaperLead,
        isEncaminhado: data.isEncaminhado
      }
    });
    await logAudit(req.tenant.id, req.tenant.email, 'CREATE', 'Client', client.id, true);
    res.status(201).json(client);
  } catch (error) {
    await logAudit(req.tenant.id, req.tenant.email, 'CREATE', 'Client', 'unknown', false, String(error));
    console.error('ERROR creating client:', error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
  }
});

app.patch('/clients/:id', async (req: AuthRequest, res) => {
  if (!req.tenant) return res.status(401).json({ error: 'Não autenticado' }) as any;

  // Validação UUID do path param
  const paramValidation = uuidParamSchema.safeParse(req.params);
  if (!paramValidation.success) {
    return res.status(400).json({ error: 'ID inválido' }) as any;
  }
  const { id } = paramValidation.data;

  // Validação com Zod (partial)
  const validation = updateClientSchema.safeParse(req.body);
  if (!validation.success) {
    const errors = validation.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({ error: `Validação falhou: ${errors}` }) as any;
  }

  try {
    // Usa transação para evitar race condition: verifica acesso e atualiza atomicamente
    const updated = await prisma.$transaction(async (tx) => {
      const client = await tx.client.findUnique({ where: { id } });
      if (!client || client.tenantId !== req.tenant!.id) {
        throw new Error('Acesso negado');
      }
      return tx.client.update({
        where: { id },
        data: validation.data
      });
    });
    await logAudit(req.tenant.id, req.tenant.email, 'UPDATE', 'Client', id, true);
    res.json(updated);
  } catch (error: any) {
    if (error.message === 'Acesso negado') {
      return res.status(403).json({ error: 'Acesso negado' }) as any;
    }
    await logAudit(req.tenant.id, req.tenant.email, 'UPDATE', 'Client', id, false, String(error));
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

app.delete('/clients/:id', async (req: AuthRequest, res) => {
  if (!req.tenant) return res.status(401).json({ error: 'Não autenticado' }) as any;

  // Validação UUID do path param
  const paramValidation = uuidParamSchema.safeParse(req.params);
  if (!paramValidation.success) {
    return res.status(400).json({ error: 'ID inválido' }) as any;
  }
  const { id } = paramValidation.data;

  try {

    // Verifica se cliente pertence ao tenant
    const client = await prisma.client.findUnique({ where: { id } });
    if (!client || client.tenantId !== req.tenant.id) {
      return res.status(403).json({ error: 'Acesso negado' }) as any;
    }

    // Soft delete: marca como deletado mas mantém dados para auditoria
    await prisma.client.update({
      where: { id },
      data: { deletedAt: new Date() }
    });
    await logAudit(req.tenant.id, req.tenant.email, 'DELETE', 'Client', id, true);
    res.json({ success: true });
  } catch (error) {
    await logAudit(req.tenant!.id, req.tenant!.email, 'DELETE', 'Client', id, false, String(error));
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});

// ─── TIMELINE EVENTS ────────────────────────────────────────────────────────
app.post('/events', async (req: AuthRequest, res) => {
  if (!req.tenant) return res.status(401).json({ error: 'Não autenticado' }) as any;

  // Validação com Zod
  const validation = createEventSchema.safeParse(req.body);
  if (!validation.success) {
    const errors = validation.error.issues.map((e: any) => `${e.path.join('.')}: ${e.message}`).join(', ');
    return res.status(400).json({ error: `Validação falhou: ${errors}` }) as any;
  }

  try {
    const data = validation.data;
    // Verifica se cliente pertence ao tenant
    const client = await prisma.client.findUnique({ where: { id: data.clientId } });
    if (!client || client.tenantId !== req.tenant.id) {
      return res.status(403).json({ error: 'Acesso negado' }) as any;
    }

    const event = await prisma.timelineEvent.create({
      data: { tenantId: req.tenant.id, clientId: data.clientId, type: data.type, content: data.content, date: data.date, attachment: data.attachment }
    });
    res.status(201).json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar evento' });
  }
});

app.delete('/events/:id', async (req: AuthRequest, res) => {
  const { id } = req.params as { id: string };
  try {
    if (!req.tenant) return res.status(401).json({ error: 'Não autenticado' }) as any;

    // Verifica se evento pertence ao tenant
    const event = await prisma.timelineEvent.findUnique({ where: { id } });
    if (!event || event.tenantId !== req.tenant.id) {
      return res.status(403).json({ error: 'Acesso negado' }) as any;
    }

    await prisma.timelineEvent.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar evento' });
  }
});

// ─── CAPTURA DE LEAD (PÚBLICA) ──────────────────────────────────────────────
// NOTA: Leads capturados via site são "órfãos" — sem tenantId associado.
// Eles entram numa fila e um admin (com JWT) os reclama mais tarde.
app.post('/capture', async (req, res) => {
  const { name, phone, area, case: caseDesc } = req.body;
  if (!name || !area) return res.status(400).json({ error: 'Nome e área são obrigatórios' }) as any;
  try {
    const today = new Date().toLocaleDateString('pt-BR');

    // Cria cliente sem tenantId (é um lead órfão)
    // Em produção, criaria uma fila separada (model Lead)
    // Por enquanto, deixamos como null e admin "reclama" depois
    const client = await prisma.client.create({
      data: {
        // Maelstrom: Lead órfão — sem tenantId. Será reivindicado por um admin depois.
        tenantId: 'ORPHAN', // Placeholder para não quebrar constraint NOT NULL
        name: name.trim(),
        status: 'TRIAGEM',
        case: caseDesc?.trim() || 'Captado via site',
        area,
        lastAction: today,
        phone: phone?.trim() || null,
        isPaperLead: false
      }
    });
    res.status(201).json(client);
  } catch (error) {
    console.error('[CAPTURE ERROR]', error);
    res.status(500).json({ error: 'Erro ao registrar lead' });
  }
});

// ─── PORTAL DO CLIENTE (PÚBLICO) ────────────────────────────────────────────
app.get('/portal/:id', async (req, res) => {
  const { id } = req.params as { id: string };
  try {
    const client = await prisma.client.findUnique({
      where: { id }
    });
    if (!client) return res.status(404).json({ error: 'Dossier não encontrado' }) as any;

    const events = await prisma.timelineEvent.findMany({
      where: { clientId: id },
      orderBy: { date: 'desc' },
      take: 5
    });

    res.json({
      name: client.name,
      area: client.area,
      status: client.status,
      lastAction: client.lastAction,
      createdAt: client.createdAt,
      events: events.map(e => ({ date: e.date, type: e.type, content: e.content }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dossier' });
  }
});

// ─── OCR (PROTEGIDO) ────────────────────────────────────────────────────────
app.post('/ocr', rateLimitOCR, async (req: AuthRequest, res) => {
  if (!ocrClient) return res.status(503).json({ error: 'OCR não configurado' }) as any;

  const { image, mimeType } = req.body;
  if (!image) return res.status(400).json({ error: 'Imagem não fornecida' }) as any;

  // Validação MIME type: apenas imagens aceitas
  const allowedMimeTypes = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];
  const mime = mimeType || 'image/jpeg';
  if (!allowedMimeTypes.includes(mime)) {
    return res.status(400).json({ error: `Tipo de arquivo não suportado. Aceitos: ${allowedMimeTypes.join(', ')}` }) as any;
  }

  try {
    const response = await ocrClient.chat.completions.create({
      model: OCR_MODEL,
      messages: [{
        role: 'user',
        content: [
          {
            type: 'text',
            text: `Você é um assistente que extrai informações de fichas de atendimento jurídico ou documentos brasileiros.
Extraia os seguintes campos:
- name: Nome completo do cliente
- phone: Telefone/WhatsApp (qualquer formato)
- area: Área jurídica — EXATAMENTE uma de: Civil, Trabalhista, Previdenciário, Criminal, Família, Imobiliário, Empresarial, Consumidor, Tributário, Administrativo
- case: Descrição breve do caso em 1-2 frases em português

Responda APENAS com JSON válido, sem markdown. Use null para campos não identificados.`
          },
          {
            type: 'image_url',
            image_url: { url: `data:${mimeType || 'image/jpeg'};base64,${image}` }
          }
        ]
      }],
      max_tokens: 500
    });

    const text = response.choices[0]?.message?.content || '{}';
    const extracted = JSON.parse(text.replace(/```json\n?|\n?```/g, ''));
    res.json(extracted);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao processar imagem' });
  }
});

app.listen(port, () => {
  console.log(`🚀 Maelstrom API online na porta ${port}`);
  console.log(`🔐 JWT Secret: ${JWT_SECRET.slice(0, 10)}...`);
});
