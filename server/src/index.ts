import express from 'express';
import cors from 'cors';
import { PrismaClient } from '@prisma/client';
import dotenv from 'dotenv';

dotenv.config();

const app = express();
const prisma = new PrismaClient();
const port = process.env.PORT || 4000;

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

app.listen(port, () => {
  console.log(`🚀 Maelstrom API online na porta ${port}`);
});
