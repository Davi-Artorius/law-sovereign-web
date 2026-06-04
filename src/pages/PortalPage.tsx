import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { Clock, AlertCircle } from 'lucide-react';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

const STATUS_MAP: Record<string, { label: string; color: string; description: string }> = {
  Triagem: {
    label: 'Em Análise Inicial',
    color: '#60a5fa',
    description: 'Seu caso está sendo avaliado pelo advogado.'
  },
  Evolução: {
    label: 'Em Acompanhamento Ativo',
    color: '#10b981',
    description: 'Seu processo está em andamento.'
  }
};

const EVENT_LABEL: Record<string, string> = {
  Consulta: 'Consulta realizada',
  Nota: 'Atualização',
  Alerta: 'Alerta',
  Encaminhamento: 'Encaminhamento'
};

interface PortalClient {
  name: string;
  area: string;
  status: string;
  isEncaminhado: boolean;
  lastAction: string;
  createdAt: string;
  events: { date: string; type: string; content: string }[];
}

export function PortalPage() {
  const { id } = useParams<{ id: string }>();
  const [client, setClient] = useState<PortalClient | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    fetch(`${API_URL}/portal/${id}`)
      .then(r => { if (!r.ok) throw new Error(); return r.json(); })
      .then(data => { setClient(data); setLoading(false); })
      .catch(() => { setNotFound(true); setLoading(false); });
  }, [id]);

  if (loading) return (
    <div className="min-h-screen bg-[#020507] flex items-center justify-center">
      <div className="w-10 h-10 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
    </div>
  );

  if (notFound || !client) return (
    <div className="min-h-screen bg-[#020507] flex items-center justify-center p-6 text-center">
      <div>
        <AlertCircle size={48} className="text-slate-600 mx-auto mb-4" />
        <p className="font-serif text-xl text-slate-400">Dossier não encontrado</p>
        <p className="text-xs text-slate-600 mt-2">Verifique o link recebido do escritório.</p>
      </div>
    </div>
  );

  const statusInfo = client.isEncaminhado
    ? { label: 'Encaminhado para Especialista', color: '#c084fc', description: 'Seu caso foi direcionado a um especialista.' }
    : (STATUS_MAP[client.status] || { label: client.status, color: '#8a9fb5', description: '' });

  return (
    <div className="min-h-screen bg-[#020507] p-6 text-[#e8edf2] font-sans">
      <div className="max-w-lg mx-auto space-y-5">

        <div className="text-center pt-4 pb-2">
          <div className="w-10 h-10 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center font-serif text-gold font-bold italic mx-auto mb-3">Ł</div>
          <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em]">Portal do Cliente · Law Sovereign</p>
        </div>

        <div className="bg-[#06101a] border border-[#ffffff12] rounded-2xl p-6">
          <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-1">{client.area}</p>
          <h1 className="font-serif text-2xl text-slate-100 mb-5">{client.name}</h1>

          <div className="flex items-center gap-3">
            <div className="w-2.5 h-2.5 rounded-full animate-pulse flex-shrink-0" style={{ background: statusInfo.color }} />
            <div>
              <p className="text-sm font-semibold" style={{ color: statusInfo.color }}>{statusInfo.label}</p>
              <p className="text-xs text-slate-500">{statusInfo.description}</p>
            </div>
          </div>
        </div>

        {client.events.length > 0 && (
          <div className="bg-[#06101a] border border-[#ffffff12] rounded-2xl p-6">
            <p className="text-[9px] text-slate-500 uppercase tracking-widest mb-5 flex items-center gap-2">
              <Clock size={11} /> Últimas Atualizações
            </p>
            <div className="space-y-0">
              {client.events.map((e, i) => (
                <div key={i} className="flex gap-3">
                  <div className="flex flex-col items-center">
                    <div className="w-1.5 h-1.5 rounded-full bg-gold/50 mt-1.5 flex-shrink-0" />
                    {i < client.events.length - 1 && <div className="w-px flex-1 bg-[#ffffff08] my-1" />}
                  </div>
                  <div className="pb-4">
                    <p className="text-[10px] text-slate-500 mb-1">{e.date} · {EVENT_LABEL[e.type] || e.type}</p>
                    <p className="text-sm text-slate-300">{e.content}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <p className="text-center text-[9px] text-slate-700 uppercase tracking-widest pb-4">
          Sigilo Profissional Garantido · OAB
        </p>
      </div>
    </div>
  );
}
