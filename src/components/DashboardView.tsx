import type { Client, TimelineEvent } from '../domain';
import { Layers, LayoutGrid, Stethoscope, AlertTriangle, ChevronRight } from 'lucide-react';
import { AREA_STYLE, AREAS } from '../constants';

interface BarChartProps {
  data: { day: string; count: number }[];
}

function BarChart({ data }: BarChartProps) {
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 340, H = 100, BAR_W = 32, GAP = (W - data.length * BAR_W) / (data.length + 1);
  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} width="100%" style={{ overflow: 'visible' }}>
      <line x1={0} y1={H} x2={W} y2={H} stroke="rgba(100,160,220,0.08)" strokeWidth={1} />
      {data.map((d, i) => {
        const x   = GAP + i * (BAR_W + GAP);
        const barH = d.count > 0 ? Math.max((d.count / max) * H * 0.85, 6) : 0;
        const y   = H - barH;
        const isToday = i === data.length - 1;
        return (
          <g key={d.day}>
            <rect x={x} y={y} width={BAR_W} height={barH} rx={5} fill={isToday ? 'rgba(200,169,110,0.5)' : 'rgba(59,130,246,0.25)'} stroke={isToday ? 'rgba(200,169,110,0.8)' : 'rgba(59,130,246,0.4)'} strokeWidth={1} />
            {d.count > 0 && <text x={x + BAR_W / 2} y={y - 5} textAnchor="middle" fill={isToday ? '#c8a96e' : '#60a5fa'} fontSize={10} fontWeight={600}>{d.count}</text>}
            <text x={x + BAR_W / 2} y={H + 16} textAnchor="middle" fill="#3d5570" fontSize={9} style={{ textTransform: 'uppercase' }}>{d.day}</text>
          </g>
        );
      })}
    </svg>
  );
}

interface DashboardViewProps {
  clients: Client[];
  events: TimelineEvent[];
  counts: { triagem: number; evolucao: number; enc: number };
  weekData: { day: string; count: number }[];
  forgotten: Client[];
  onReset?: () => void;
}

export function DashboardView({ clients, counts, weekData, forgotten, onReset }: DashboardViewProps) {
  return (
    <div style={{ maxWidth: 1000, margin: '0 auto', display: 'flex', flexDirection: 'column', gap: 32 }}>
      
      {/* Botão de Emergência */}
      <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: -20 }}>
        <button 
          onClick={onReset} 
          style={{ background: 'transparent', border: 'none', color: '#1a2b3c', fontSize: 9, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }} 
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')} 
          onMouseLeave={e => (e.currentTarget.style.color = '#1a2b3c')}
        >
          Purga de Emergência
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 20 }}>
        {[
          { label: 'Fluxo de Triagem', value: counts.triagem, icon: Layers, color: '#60a5fa', sub: 'Aguardando Aprovação' },
          { label: 'Acompanhamento Ativo', value: counts.evolucao, icon: LayoutGrid, color: '#10b981', sub: 'Hub de Evolução' },
          { label: 'Intervenções Externas', value: counts.enc, icon: Stethoscope, color: '#c084fc', sub: 'Encaminhamentos' },
        ].map(k => (
          <div key={k.label} style={{ background: '#06101a', border: '1px solid rgba(100,160,220,0.08)', padding: 24, borderRadius: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <k.icon size={16} color={k.color} />
              <span style={{ fontSize: 9, color: '#3d5570', textTransform: 'uppercase', fontWeight: 'bold' }}>{k.label}</span>
            </div>
            <div style={{ fontFamily: 'Georgia,serif', fontSize: 36, fontWeight: 500, color: '#e8edf2' }}>{k.value}</div>
            <div style={{ fontSize: 10, color: '#3d5570', marginTop: 5 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        <div style={{ background: '#06101a', border: '1px solid rgba(100,160,220,0.08)', padding: 24, borderRadius: 20 }}>
          <div style={{ fontSize: 10, color: '#8a9fb5', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20 }}>Casos por dia — últimos 7 dias</div>
          <BarChart data={weekData} />
        </div>
        <div style={{ background: '#06101a', border: '1px solid rgba(100,160,220,0.08)', padding: 24, borderRadius: 20 }}>
           <div style={{ fontSize: 10, color: '#8a9fb5', textTransform: 'uppercase', marginBottom: 20 }}>Distribuição por Área</div>
           {AREAS.map(a => {
             const count = clients.filter((c) => c.area === a).length;
             const pct = clients.length ? Math.round(count / clients.length * 100) : 0;
             return count > 0 && (
               <div key={a} style={{ marginBottom: 12 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 11, marginBottom: 4 }}>
                    <span style={{color: AREA_STYLE[a].text}}>{a}</span>
                    <span style={{color: '#3d5570'}}>{count}</span>
                 </div>
                 <div style={{ height: 4, background: 'rgba(255,255,255,0.05)', borderRadius: 2 }}>
                    <div style={{ height: '100%', background: AREA_STYLE[a].text, width: `${pct}%`, borderRadius: 2, opacity: 0.7 }} />
                 </div>
               </div>
             );
           })}
        </div>
      </div>

      {forgotten.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.03)', border: '1px solid rgba(239,68,68,0.2)', padding: 24, borderRadius: 20 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fca5a5', fontSize: 11, fontWeight: 'bold', marginBottom: 16 }}>
              <AlertTriangle size={14}/> ALERTAS DE INÉRCIA (+15 DIAS)
           </div>
           {forgotten.map((c) => (
             <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', background: 'rgba(239,68,68,0.04)', borderRadius: 12, marginBottom: 8, cursor: 'pointer' }} onClick={() => {}}>
                <div style={{ fontSize: 13, fontWeight: 600 }}>{c.name}</div>
                <ChevronRight size={14} color="#3d5570" />
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
