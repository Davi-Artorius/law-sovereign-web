import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';
import OpenAI from 'openai';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 4000;
const openai = process.env.OPENAI_API_KEY ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY }) : null;

app.use(cors());
app.use(express.json({ limit: '50mb' })); // Maelstrom: Aumentando para 50mb para suportar anexos reais
app.use(express.urlencoded({ limit: '50mb', extended: true }));

// ─── DEBUG MIDDLEWARE ───────────────────────────────────────────────────────
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  if (req.method === 'POST' || req.method === 'PATCH') {
    const { attachment, ...rest } = req.body;
    console.log('Payload:', rest, attachment ? '(com anexo)' : '(sem anexo)');
  }
  next();
});

app.get('/clients', async (req, res) => {
  try {
    const clients = await prisma.client.findMany({
      include: { events: true },
      orderBy: { createdAt: 'desc' }
    });
    res.json(clients);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao buscar clientes' });
  }
});

app.post('/clients', async (req, res) => {
  const { name, status, case: caseDesc, area, lastAction } = req.body;
  try {
    const client = await prisma.client.create({
      data: { name, status, case: caseDesc, area, lastAction }
    });
    res.json(client);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao criar cliente' });
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

// ─── CAPTURA DE LEAD PELO SITE ──────────────────────────────────────────────
app.post('/capture', async (req, res) => {
  const { name, phone, area, case: caseDesc } = req.body;
  if (!name || !area) return res.status(400).json({ error: 'Nome e área são obrigatórios' }) as any;
  try {
    const today = new Date().toLocaleDateString('pt-BR');
    const client = await prisma.client.create({
      data: {
        name: name.trim(),
        status: 'Triagem',
        case: caseDesc?.trim() || 'Captado via site do escritório',
        area,
        lastAction: today,
        phone: phone?.trim() || null,
        isPaperLead: false
      }
    });
    res.json({ success: true, id: client.id });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Erro ao registrar lead' });
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
      isEncaminhado: client.isEncaminhado,
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
  if (!openai) return res.status(503).json({ error: 'OCR não configurado — adicione OPENAI_API_KEY no Railway' }) as any;
  const { image, mimeType } = req.body;
  if (!image) return res.status(400).json({ error: 'Imagem não fornecida' }) as any;
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o',
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
