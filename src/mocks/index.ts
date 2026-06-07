import type { Client, TimelineEvent } from '../domain';

const NOW = new Date();

export const INITIAL_CLIENTS: Client[] = [
  { 
    id: 'c1', 
    name: 'Ricardo Fonseca', 
    status: 'TRIAGEM', 
    isEncaminhado: false, 
    lastAction: '12 Mai 2026', 
    case: 'Inventário e Partilha de Bens', 
    area: 'Família', 
    createdAt: new Date(NOW.getTime() - 2*24*3600*1000).toISOString() 
  },
  { 
    id: 'c2', 
    name: 'Maria Helena Oliveira', 
    status: 'PROPOSTA', 
    isEncaminhado: true, 
    lastAction: '27 Mai 2026', 
    case: 'Rescisão Indevida e Horas Extras', 
    area: 'Trabalhista', 
    createdAt: new Date(NOW.getTime() - 5*24*3600*1000).toISOString() 
  },
  { 
    id: 'c3', 
    name: 'João Pedro Santos', 
    status: 'PROPOSTA', 
    isEncaminhado: false, 
    lastAction: '29 Mai 2026', 
    case: 'Fusão & Aquisição — Contrato Societário', 
    area: 'Empresarial', 
    createdAt: new Date(NOW.getTime() - 18*24*3600*1000).toISOString() 
  },
  { 
    id: 'c4', 
    name: 'Carla Mendes', 
    status: 'PROPOSTA', 
    isEncaminhado: false, 
    lastAction: '01 Abr 2026', 
    case: 'Guarda Compartilhada — Menor', 
    area: 'Família', 
    createdAt: new Date(NOW.getTime() - 20*24*3600*1000).toISOString() 
  },
];

export const INITIAL_EVENTS: TimelineEvent[] = [
  { id: 'e101', clientId: 'c2', date: '27/05/2026 14:30', type: 'Consulta',       content: 'Audiência de conciliação. Proposta de acordo apresentada. Prosseguimento ao mérito.' },
  { id: 'e102', clientId: 'c2', date: '15/05/2026 10:00', type: 'Nota',           content: 'Início do acompanhamento. Perfil cooperativo. Documentação completa.' },
  { id: 'e103', clientId: 'c2', date: '10/05/2026 09:00', type: 'Encaminhamento', content: 'Encaminhada para especialista trabalhista. Dr. Carvalho assumiu análise pericial.' },
  { id: 'e104', clientId: 'c3', date: '29/05/2026 11:00', type: 'Consulta',       content: 'Revisão dos contratos societários. Cláusula 14-B identificada como favorável.' },
  { id: 'e105', clientId: 'c1', date: '12/05/2026 09:30', type: 'Nota',           content: 'Documentação de inventário entregue. Aguardando avaliação dos bens.' },
];
