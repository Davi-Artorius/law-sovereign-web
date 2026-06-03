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
        background: selected ? '#142233' : hov ? '#101d28' : '#0c1824', 
        border: selected ? '1px solid rgba(200,169,110,0.3)' : hov ? '1px solid rgba(100,160,220,0.15)' : '1px solid rgba(100,160,220,0.07)', 
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
          style={{ position: 'absolute', top: 12, right: 12, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 6, padding: 4, cursor: 'pointer', color: '#fca5a5', display: 'flex', zIndex: 10 }}
        >
          <Trash2 size={12} />
        </button>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, flexShrink: 0, background: pal.bg, border: `1px solid ${pal.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', fontSize: 13, fontWeight: 700, color: pal.text }}>{getInitials(c.name)}</div>
          <div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 15, fontWeight: 500, color: '#e8edf2', lineHeight: 1.2 }}>{c.name}</div>
            {c.area && <span style={{ display: 'inline-block', marginTop: 4, padding: '1px 8px', borderRadius: 99, fontSize: 9, fontWeight: 500, letterSpacing: '0.06em', background: areaStyle.bg, border: `1px solid ${areaStyle.border}`, color: areaStyle.text }}>{c.area}</span>}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 4 }}>
          <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 9, fontWeight: 500, letterSpacing: '0.06em', background: c.status === 'Triagem' ? 'rgba(234,179,8,0.08)' : 'rgba(16,185,129,0.08)', border: c.status === 'Triagem' ? '1px solid rgba(234,179,8,0.2)' : '1px solid rgba(16,185,129,0.2)', color: c.status === 'Triagem' ? '#eab308' : '#10b981' }}>{c.status}</span>
          {c.isEncaminhado && <span style={{ padding: '2px 8px', borderRadius: 99, fontSize: 9, fontWeight: 500, background: 'rgba(168,85,247,0.08)', border: '1px solid rgba(168,85,247,0.2)', color: '#c084fc' }}>↗ Encaminhado</span>}
        </div>
      </div>
      <p style={{ fontSize: 12, color: '#5a7a94', lineHeight: 1.6, margin: 0, fontStyle: 'italic', borderLeft: '2px solid rgba(100,160,220,0.1)', paddingLeft: 10 }}>{c.case}</p>
      {c.phone && <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 11, color: '#c8a96e' }}><Phone size={11}/> {c.phone}</div>}
      
      {/* --- LAW SOVEREIGN v3.5: INDICADORES ESTRATÉGICOS --- */}
      {(c.chanceOfSuccess || c.costOfWaiting || c.isPaperLead) && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          {c.isPaperLead && <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 9, background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.2)', color: '#c084fc', fontWeight: 600 }}>📄 Lead de Papel</span>}
          {c.chanceOfSuccess !== null && c.chanceOfSuccess !== undefined && <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 9, background: c.chanceOfSuccess >= 80 ? 'rgba(52,211,153,0.1)' : 'rgba(234,179,8,0.1)', border: c.chanceOfSuccess >= 80 ? '1px solid rgba(52,211,153,0.2)' : '1px solid rgba(234,179,8,0.2)', color: c.chanceOfSuccess >= 80 ? '#34d399' : '#facc15', fontWeight: 600 }}>🎯 Êxito: {c.chanceOfSuccess}%</span>}
          {c.costOfWaiting !== null && c.costOfWaiting !== undefined && <span style={{ padding: '2px 6px', borderRadius: 4, fontSize: 9, background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', color: '#fca5a5', fontWeight: 600 }}>💸 Custo de Esperar: R${c.costOfWaiting}/mês</span>}
        </div>
      )}

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid rgba(100,160,220,0.05)', paddingTop: 10 }}>
        <div style={{ fontSize: 10, color: '#3d5570', display: 'flex', alignItems: 'center', gap: 4 }}><Clock size={10}/> {c.lastAction}</div>
        {c.status === 'Triagem'
          ? <button onClick={e => { e.stopPropagation(); onPromote(c.id); }} style={{ padding: '4px 14px', borderRadius: 99, border: '1px solid rgba(16,185,129,0.3)', background: 'rgba(16,185,129,0.08)', color: '#10b981', fontSize: 10, fontWeight: 600, letterSpacing: '0.06em', textTransform: 'uppercase', cursor: 'pointer', fontFamily: 'inherit' }}>Promover →</button>
          : <ChevronRight size={16} color={hov ? '#c8a96e' : '#3d5570'} style={{ transition: 'color 0.2s' }} />
        }
      </div>
    </div>
  );
}
