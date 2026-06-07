import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 4000;

// OCR via Gemini — usa o endpoint compatível com OpenAI, então reaproveita o mesmo SDK.
// Modelo configurável por env (OCR_MODEL) caso o nome mude. Chave: GEMINI_API_KEY.
const OCR_MODEL = process.env.OCR_MODEL || 'gemini-2.5-flash';
const ocrClient = process.env.GEMINI_API_KEY
  ? new OpenAI({ apiKey: process.env.GEMINI_API_KEY, baseURL: 'https://generativelanguage.googleapis.com/v1beta/openai/' })
  : null;

// ─── CORS: APENAS A ORIGEM AUTORIZADA ────────────────────────────────────────
// Whitelist: localhost (dev) + Vercel (prod) + custom env var
const allowedOrigins = [
  // Dev local
  'http://localhost:9090',
  'http://localhost:5173',
  'http://127.0.0.1:5173',
  // Vercel (prod) — alias + deployment URLs
  'https://law-sovereign.vercel.app',
  'https://law-sovereign-web.vercel.app',
  'https://law-sovereign-f8am19xn7-davi-artorius-projects.vercel.app',
  // Custom env var (e.g., ALLOWED_ORIGIN=https://custom-domain.com)
  process.env.ALLOWED_ORIGIN
].filter(Boolean) as string[];

app.use(cors({
  origin: (origin, callback) => {
    // Permite chamadas sem origin (ex: Postman, Railway health checks, curl)
    if (!origin) return callback(null, true);
    // Verifica whitelist específica
    if (allowedOrigins.includes(origin)) return callback(null, true);
    // Permite qualquer *.vercel.app (deployment dinâmico do Vercel)
    if (origin?.includes('.vercel.app')) return callback(null, true);
    // Permite localhost em qualquer porta (dev)
    if (origin?.startsWith('http://localhost') || origin?.startsWith('http://127.0.0.1')) return callback(null, true);
    callback(new Error(`Origem bloqueada pelo CORS: ${origin}`));
  }
}));

app.use(express.json({ limit: '50mb' })); // Maelstrom: Aumentando para 50mb para suportar anexos reais
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── API KEY: GUARDA DA PORTA ─────────────────────────────────────────────────
// Todas as rotas internas exigem o header 'x-api-key' com o valor de INTERNAL_API_KEY.
// Rotas públicas (portal do cliente e captura de lead) ficam abertas — sem autenticação.
// Para gerar uma chave segura: node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
const INTERNAL_API_KEY = process.env.INTERNAL_API_KEY;
const PUBLIC_PATHS = ['/capture', '/health', '/debug'];

app.use((req, res, next) => {
  // Rotas públicas: /capture (form de lead) e /portal/:id (consulta do cliente)
  const isPublic = PUBLIC_PATHS.some(p => req.path === p) || req.path.startsWith('/portal/');
  if (isPublic) return next();

  // Sem API Key configurada no Railway: bloqueia em produção, avisa em dev
  if (!INTERNAL_API_KEY) {
    if (process.env.NODE_ENV === 'production') {
      return res.status(500).json({ error: 'INTERNAL_API_KEY não configurada no servidor.' }) as any;
    }
    // Dev sem chave configurada: passa com aviso no log
    console.warn('[AVISO] INTERNAL_API_KEY não definida — modo dev sem autenticação.');
    return next();
  }

  const provided = req.headers['x-api-key'];
  if (provided !== INTERNAL_API_KEY) {
    return res.status(401).json({ error: 'Não autorizado.' }) as any;
  }
  next();
});

// ─── DEBUG MIDDLEWARE ───────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PATCH') {
    const { attachment, ...rest } = req.body;
    console.log('Payload:', rest, attachment ? '(com anexo)' : '(sem anexo)');
  }
  next();
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

// ⚠️ ADMIN: Nuclear reset — apaga TUDO (use com cuidado!)
app.post('/admin/nuke', async (req, res) => {
  const key = req.headers['x-nuke-key'];
  if (key !== process.env.NUKE_KEY) return res.status(401).json({ error: 'Unauthorized' }) as any;
  try {
    const deleted = await prisma.client.deleteMany({});
    await prisma.timelineEvent.deleteMany({});
    res.json({ success: true, deleted: deleted.count, message: '☢️ All data nuked' });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

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

app.get('/clients', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: { events: { select: { id: true, clientId: true, type: true, content: true, date: true } } },
      orderBy: { createdAt: 'desc' }
    });
    res.json(clients);
  } catch (error) {
    console.error('ERROR fetching clients:', error);
    res.status(500).json({ error: 'Erro ao buscar clientes', details: String(error) });
  }
});

// Eventos COMPLETOS de um cliente (com anexos) — carregados sob demanda ao abrir o dossiê
app.get('/clients/:id/events', async (req, res) => {
  const { id } = req.params;
  try {
    const events = await prisma.timelineEvent.findMany({ where: { clientId: id } });
    res.json(events);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar eventos do cliente' });
  }
});

app.post('/clients', async (req, res) => {
  const { name, status, case: caseDesc, area, lastAction, phone } = req.body;
  try {
    const today = new Date().toISOString().split('T')[0];
    const client = await prisma.client.create({
      data: {
        name,
        status: status || 'TRIAGEM',
        case: caseDesc || 'Novo caso',
        area,
        lastAction: lastAction || today,
        phone: phone || null
      }
    });
    res.json(client);
  } catch (error) {
    console.error('ERROR creating client:', error);
    res.status(500).json({ error: 'Erro ao criar cliente', details: String(error) });
  }
});

app.patch('/clients/:id', async (req, res) => {
  const { id } = req.params;
  const data = req.body;
  try {
    const client = await prisma.client.update({
      where: { id },
      data
    });
    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao atualizar cliente' });
  }
});

app.delete('/clients/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.client.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar cliente' });
  }
});

app.post('/events', async (req, res) => {
  const { clientId, type, content, date, attachment } = req.body;
  try {
    const event = await prisma.timelineEvent.create({
      data: { clientId, type, content, date, attachment }
    });
    res.json(event);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar evento' });
  }
});

app.delete('/events/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.timelineEvent.delete({ where: { id } });
    res.json({ success: true });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao deletar evento' });
  }
});

// ─── CAPTURA DE LEAD PELO SITE ──────────────────────────────────────────────
app.post('/capture', async (req, res) => {
  const { name, phone, area, case: caseDesc } = req.body;
  if (!name || !area) return res.status(400).json({ error: 'Nome e área são obrigatórios' }) as any;
  try {
    const today = new Date().toLocaleDateString('pt-BR');
    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        status: 'TRIAGEM',
        case: caseDesc?.trim() || 'Captado via site do escritório',
        area,
        lastAction: today,
        phone: phone?.trim() || null,
        isPaperLead: false
      }
    });
    res.json(client);
  } catch (error) {
    console.error('[CAPTURE ERROR]', error instanceof Error ? error.message : String(error));
    res.status(500).json({ error: 'Erro ao registrar lead', details: error instanceof Error ? error.message : String(error) });
  }
});

// ─── PORTAL DO CLIENTE ───────────────────────────────────────────────────────
app.get('/portal/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const client = await prisma.client.findUnique({
      where: { id },
      include: { events: { orderBy: { date: 'desc' }, take: 5 } }
    });
    if (!client) return res.status(404).json({ error: 'Dossier não encontrado' }) as any;
    res.json({
      name: client.name,
      area: client.area,
      status: client.status,
      lastAction: client.lastAction,
      createdAt: client.createdAt,
      events: client.events.map(e => ({ date: e.date, type: e.type, content: e.content }))
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar dossier' });
  }
});

// ─── GRAMPEADOR INTELIGENTE (OCR) ────────────────────────────────────────────
app.post('/ocr', async (req, res) => {
  if (!ocrClient) return res.status(503).json({ error: 'OCR não configurado — adicione GEMINI_API_KEY no Railway' }) as any;
  const { image, mimeType } = req.body;
  if (!image) return res.status(400).json({ error: 'Imagem não fornecida' }) as any;
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
});
