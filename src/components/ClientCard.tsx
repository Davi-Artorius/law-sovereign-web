import { useState } from 'react';
import { Clock, Trash2, ChevronRight, Phone } from 'lucide-react';
import type { Client } from '../domain';
import { AREA_STYLE } from '../constants';
import { getInitials, avatarPalette } from '../utils/helpers';

interface ClientCardProps {
  client: Client;
  selected: boolean;
  onSelect: (c: Client) => void;
  onPromote: (id: string) => void;
  onDelete: (id: string) => void;
}

const SERIF = "'Cormorant Garamond', Georgia, serif";

export function ClientCard({ client: c, selected, onSelect, onPromote, onDelete }: ClientCardProps) {
  const [hov, setHov] = useState(false);
  const pal = avatarPalette(c.id);

  // Sage: Fallback preventivo contra áreas não mapeadas ou erro de acentuação
  const areaStyle = (c.area && AREA_STYLE[c.area]) ? AREA_STYLE[c.area] : AREA_STYLE['Civil'];

  return (
    <div
      onClick={() => onSelect(c)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        padding: '18px 20px',
        borderRadius: 14,
        cursor: 'pointer',
        background: selected ? '#16273d' : hov ? '#13202f' : '#101a2a',
        border: selected ? '1px solid rgba(201,162,39,0.40)' : hov ? '1px solid rgba(120,160,210,0.18)' : '1px solid rgba(120,160,210,0.10)',
        transform: hov ? 'translateY(-2px)' : 'translateY(0)',
        transition: 'all 0.22s',
        display: 'flex',
        flexDirection: 'column',
        gap: 12,
        position: 'relative'
      }}
    >

      {hov && (
        <button
          onClick={e => { e.stopPropagation(); onDelete(c.id); }}
          style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', borderRadius: 6, padding: 5, cursor: 'pointer', color: '#fca5a5', display: 'flex', zIndex: 10 }}
        >
          <Trash2 size={13} />
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 38, height: 38, borderRadius: 10, flexShrink: 0, background: pal.bg, border: `1px solid ${pal.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: SERIF, fontSize: 15, fontWeight: 700, color: pal.text }}>{getInitials(c.name)}</div>
          <div>
            <div style={{ fontFamily: SERIF, fontSize: 17, fontWeight: 600, color: '#eef2f7', lineHeight: 1.2 }}>{c.name}</div>
            {c.area && <span style={{ display: 'inline-block', marginTop: 5, padding: '2px 9px', borderRadius: 99, fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', background: areaStyle.bg, border: `1px solid ${areaStyle.border}`, color: areaStyle.text }}>{c.area}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 500, letterSpacing: '0.04em', background: c.status === 'Triagem' ? 'rgba(234,179,8,0.10)' : 'rgba(16,185,129,0.10)', border: c.status === 'Triagem' ? '1px solid rgba(234,179,8,0.28)' : '1px solid rgba(16,185,129,0.28)', color: c.status === 'Triagem' ? '#eab308' : '#10b981' }}>{c.status}</span>
          {c.isEncaminhado && <span style={{ padding: '3px 9px', borderRadius: 99, fontSize: 11, fontWeight: 500, background: 'rgba(168,85,247,0.10)', border: '1px solid rgba(168,85,247,0.28)', color: '#c084fc' }}>↗ Encaminhado</span>}
        </div>
      </div>
      <p style={{ fontSize: 13, color: '#9fb1c6', lineHeight: 1.6, margin: 0, fontStyle: 'italic', borderLeft: '2px solid rgba(201,162,39,0.25)', paddingLeft: 11 }}>{c.case}</p>
      {c.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 13, color: '#ddc063' }}><Phone size={12}/> {c.phone}</div>}

      {/* --- LAW SOVEREIGN v3.5: INDICADORES ESTRATÉGICOS --- */}
      {(c.chanceOfSuccess || c.costOfWaiting || c.isPaperLead) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {c.isPaperLead && <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, background: 'rgba(168,85,247,0.12)', border: '1px solid rgba(168,85,247,0.25)', color: '#c084fc', fontWeight: 600 }}>📄 Lead de Papel</span>}
          {c.chanceOfSuccess !== null && c.chanceOfSuccess !== undefined && <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, background: c.chanceOfSuccess >= 80 ? 'rgba(52,211,153,0.12)' : 'rgba(234,179,8,0.12)', border: c.chanceOfSuccess >= 80 ? '1px solid rgba(52,211,153,0.25)' : '1px solid rgba(234,179,8,0.25)', color: c.chanceOfSuccess >= 80 ? '#34d399' : '#facc15', fontWeight: 600 }}>🎯 Êxito: {c.chanceOfSuccess}%</span>}
          {c.costOfWaiting !== null && c.costOfWaiting !== undefined && <span style={{ padding: '3px 8px', borderRadius: 5, fontSize: 11, background: 'rgba(239,68,68,0.12)', border: '1px solid rgba(239,68,68,0.25)', color: '#fca5a5', fontWeight: 600 }}>💸 Custo de Esperar: R${c.costOfWaiting}/mês</span>}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(120,160,210,0.08)', paddingTop: 11 }}>
        <div style={{ fontSize: 12, color: '#8295ad', display: 'flex', alignItems: 'center', gap: 5 }}><Clock size={12}/> {c.lastAction}</div>
        {c.status === 'Triagem'
          ? <button onClick={e => { e.stopPropagation(); onPromote(c.id); }} style={{ padding: '5px 15px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.35)', background: 'rgba(16,185,129,0.10)', color: '#10b981', fontSize: 11, fontWeight: 600, letterSpacing: '0.05em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}>Promover →</button>
          : <ChevronRight size={18} color={hov ? '#c9a227' : '#6b8099'} style={{ transition: 'color 0.2s' }} />
        }
      </div>
    </div>
  );
}
