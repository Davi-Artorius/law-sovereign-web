import { Scale, StickyNote, AlertTriangle, ArrowUpRight } from 'lucide-react';
import type { EventType } from '../domain';

export const AREAS = ['Civil', 'Trabalhista', 'Penal', 'Família', 'Empresarial'] as const;

export const AREA_STYLE: Record<string, { bg: string; text: string; border: string }> = {
  Civil:       { bg: 'rgba(59,130,246,0.08)',  text: '#93c5fd', border: 'rgba(59,130,246,0.25)'  },
  Trabalhista: { bg: 'rgba(168,85,247,0.08)',  text: '#c084fc', border: 'rgba(168,85,247,0.25)'  },
  Penal:       { bg: 'rgba(239,68,68,0.08)',   text: '#fca5a5', border: 'rgba(239,68,68,0.25)'   },
  Família:     { bg: 'rgba(236,72,153,0.08)',  text: '#f9a8d4', border: 'rgba(236,72,153,0.25)'  },
  Empresarial: { bg: 'rgba(200,169,110,0.08)', text: '#c8a96e', border: 'rgba(200,169,110,0.25)' },
};

export const EVENT_META: Record<EventType, { icon: any; color: string; border: string; bg: string }> = {
  Consulta:       { icon: Scale,         color: '#60a5fa', border: 'rgba(59,130,246,0.3)',   bg: 'rgba(59,130,246,0.08)'  },
  Nota:           { icon: StickyNote,    color: '#c8a96e', border: 'rgba(200,169,110,0.3)',  bg: 'rgba(200,169,110,0.08)' },
  Alerta:         { icon: AlertTriangle, color: '#fbbf24', border: 'rgba(251,191,36,0.3)',   bg: 'rgba(251,191,36,0.08)'  },
  Encaminhamento: { icon: ArrowUpRight,  color: '#c084fc', border: 'rgba(168,85,247,0.3)',   bg: 'rgba(168,85,247,0.08)'  },
};

export const AVATAR_PALETTES = [
  { bg: 'rgba(59,130,246,0.12)',  border: 'rgba(59,130,246,0.3)',  text: '#93c5fd' },
  { bg: 'rgba(16,185,129,0.12)', border: 'rgba(16,185,129,0.3)',  text: '#6ee7b7' },
  { bg: 'rgba(200,169,110,0.12)',border: 'rgba(200,169,110,0.3)', text: '#c8a96e' },
  { bg: 'rgba(168,85,247,0.12)', border: 'rgba(168,85,247,0.3)',  text: '#c084fc' },
];
