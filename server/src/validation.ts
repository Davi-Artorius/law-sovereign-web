import { z } from 'zod';

export const createClientSchema = z.object({
  name: z.string().min(1, 'Nome é obrigatório').max(255),
  status: z.enum(['TRIAGEM', 'PROPOSTA', 'CONTRATO', 'ATIVO', 'DESFECHO', 'ENCAMINHADOS', 'INATIVOS']).default('TRIAGEM'),
  lastAction: z.string().max(255).default(''),
  case: z.string().max(5000).default(''),
  area: z.enum(['Civil', 'Trabalhista', 'Criminal', 'Comercial', 'Tributário', 'Imobiliário']),
  chanceOfSuccess: z.number().int().min(0).max(100).optional(),
  costOfWaiting: z.number().min(0).optional(),
  missingProofs: z.string().max(1000).optional(),
  isPaperLead: z.boolean().default(false),
  isEncaminhado: z.boolean().default(false),
  phone: z.string().regex(/^[0-9+\-() ]*$/, 'Phone contém caracteres inválidos').max(20).optional(),
});

export const updateClientSchema = createClientSchema.partial();

export const createEventSchema = z.object({
  clientId: z.string().uuid('clientId deve ser um UUID válido'),
  type: z.string().min(1).max(50),
  content: z.string().min(1, 'Conteúdo é obrigatório').max(5000),
  date: z.string().min(1).max(50),
  attachment: z.object({
    type: z.string(),
    name: z.string().max(255),
    data: z.string(),
  }).optional(),
});

export const registerSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(8, 'Senha deve ter no mínimo 8 caracteres'),
  name: z.string().min(1, 'Nome é obrigatório').max(255),
});

export const loginSchema = z.object({
  email: z.string().email('Email inválido'),
  password: z.string().min(1, 'Senha é obrigatória'),
});

// Validação de UUIDs em path params
export const uuidParamSchema = z.object({
  id: z.string().uuid('ID inválido')
});
