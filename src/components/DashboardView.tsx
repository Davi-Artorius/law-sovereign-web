import type { Client, TimelineEvent } from '../domain';
import { Layers, LayoutGrid, Stethoscope, AlertTriangle, ChevronRight } from 'lucide-react';
import { AREA_STYLE, AREAS } from '../constants';

const SERIF = "'Cormorant Garamond', Georgia, serif";

interface BarChartProps {
  data: { day: string; count: number }[];
}

function BarChart({ data }: BarChartProps) {
  const max = Math.max(...data.map(d => d.count), 1);
  const W = 340, H = 100, BAR_W = 32, GAP = (W - data.length * BAR_W) / (data.length + 1);
  return (
    <svg viewBox={`0 0 ${W} ${H + 28}`} width="100%" style={{ overflow: 'visible' }}>
      <line x1={0} y1={H} x2={W} y2={H} stroke="rgba(120,160,210,0.10)" strokeWidth={1} />
      {data.map((d, i) => {
        const x   = GAP + i * (BAR_W + GAP);
        const barH = d.count > 0 ? Math.max((d.count / max) * H * 0.85, 6) : 0;
        const y   = H - barH;
        const isToday = i === data.length - 1;
        return (
          <g key={d.day}>
            <rect x={x} y={y} width={BAR_W} height={barH} rx={5} fill={isToday ? 'rgba(201,162,39,0.55)' : 'rgba(59,130,246,0.28)'} stroke={isToday ? 'rgba(201,162,39,0.85)' : 'rgba(59,130,246,0.45)'} strokeWidth={1} />
            {d.count > 0 && <text x={x + BAR_W / 2} y={y - 5} textAnchor="middle" fill={isToday ? '#ddc063' : '#60a5fa'} fontSize={12} fontWeight={600}>{d.count}</text>}
            <text x={x + BAR_W / 2} y={H + 16} textAnchor="middle" fill="#8295ad" fontSize={11} style={{ textTransform: 'uppercase' }}>{d.day}</text>
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
          style={{ background: 'transparent', border: 'none', color: '#33485f', fontSize: 10, cursor: 'pointer', textTransform: 'uppercase', letterSpacing: '0.1em' }}
          onMouseEnter={e => (e.currentTarget.style.color = '#ef4444')}
          onMouseLeave={e => (e.currentTarget.style.color = '#33485f')}
        >
          Purga de Emergência
        </button>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 16 }}>
        {[
          { label: 'Fluxo de Triagem', value: counts.triagem, icon: Layers, color: '#60a5fa', sub: 'Aguardando Aprovação' },
          { label: 'Acompanhamento Ativo', value: counts.evolucao, icon: LayoutGrid, color: '#10b981', sub: 'Hub de Evolução' },
          { label: 'Intervenções Externas', value: counts.enc, icon: Stethoscope, color: '#c084fc', sub: 'Encaminhamentos' },
        ].map(k => (
          <div key={k.label} style={{ background: '#0e1827', border: '1px solid rgba(120,160,210,0.10)', padding: 24, borderRadius: 20 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 12 }}>
              <k.icon size={17} color={k.color} />
              <span style={{ fontSize: 11, color: '#8295ad', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.04em' }}>{k.label}</span>
            </div>
            <div style={{ fontFamily: SERIF, fontSize: 40, fontWeight: 600, color: '#eef2f7', lineHeight: 1 }}>{k.value}</div>
            <div style={{ fontSize: 12, color: '#8295ad', marginTop: 6 }}>{k.sub}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: 20 }}>
        <div style={{ background: '#0e1827', border: '1px solid rgba(120,160,210,0.10)', padding: 24, borderRadius: 20 }}>
          <div style={{ fontSize: 11, color: '#aebcce', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20, fontWeight: 600 }}>Casos por dia — últimos 7 dias</div>
          <BarChart data={weekData} />
        </div>
        <div style={{ background: '#0e1827', border: '1px solid rgba(120,160,210,0.10)', padding: 24, borderRadius: 20 }}>
           <div style={{ fontSize: 11, color: '#aebcce', textTransform: 'uppercase', letterSpacing: '0.12em', marginBottom: 20, fontWeight: 600 }}>Distribuição por Área</div>
           {AREAS.map(a => {
             const count = clients.filter((c) => c.area === a).length;
             const pct = clients.length ? Math.round(count / clients.length * 100) : 0;
             return count > 0 && (
               <div key={a} style={{ marginBottom: 12 }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 13, marginBottom: 5 }}>
                    <span style={{color: AREA_STYLE[a].text}}>{a}</span>
                    <span style={{color: '#8295ad'}}>{count}</span>
                 </div>
                 <div style={{ height: 5, background: 'rgba(255,255,255,0.06)', borderRadius: 3 }}>
                    <div style={{ height: '100%', background: AREA_STYLE[a].text, width: `${pct}%`, borderRadius: 3, opacity: 0.75 }} />
                 </div>
               </div>
             );
           })}
        </div>
      </div>

      {forgotten.length > 0 && (
        <div style={{ background: 'rgba(239,68,68,0.04)', border: '1px solid rgba(239,68,68,0.25)', padding: 24, borderRadius: 20 }}>
           <div style={{ display: 'flex', alignItems: 'center', gap: 10, color: '#fca5a5', fontSize: 13, fontWeight: 'bold', marginBottom: 16, letterSpacing: '0.04em' }}>
              <AlertTriangle size={16}/> ALERTAS DE INÉRCIA (+15 DIAS)
           </div>
           {forgotten.map((c) => (
             <div key={c.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '13px 16px', background: 'rgba(239,68,68,0.05)', borderRadius: 12, marginBottom: 8, cursor: 'pointer' }} onClick={() => {}}>
                <div style={{ fontSize: 14, fontWeight: 600, color: '#eef2f7' }}>{c.name}</div>
                <ChevronRight size={16} color="#8295ad" />
             </div>
           ))}
        </div>
      )}
    </div>
  );
}
