import { useState } from 'react';
import { Send, CheckCircle } from 'lucide-react';
import { AREAS } from '../constants';

const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

export function CapturePage() {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [area, setArea] = useState('Civil');
  const [caseDesc, setCaseDesc] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) return;
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/capture`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, phone, area, case: caseDesc })
      });

      const data = await res.json();

      if (!res.ok) {
        const errorMsg = data?.error || 'Erro desconhecido';
        throw new Error(errorMsg);
      }

      setSuccess(true);
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erro ao enviar. Tente novamente.';
      setError(message);
      console.error('[CapturePage Error]', message);
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen bg-[#020507] flex items-center justify-center p-6">
        <div className="text-center space-y-6">
          <div className="w-16 h-16 rounded-full bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center mx-auto">
            <CheckCircle size={32} className="text-emerald-400" />
          </div>
          <div>
            <h2 className="font-serif text-2xl text-slate-100 mb-2">Recebido com sucesso</h2>
            <p className="text-slate-400 text-sm max-w-xs mx-auto">Seu contato foi registrado. O escritório entrará em contato em breve.</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#020507] flex items-center justify-center p-6">
      <div className="w-full max-w-md">
        <div className="text-center mb-10">
          <div className="w-12 h-12 rounded-xl bg-gold/10 border border-gold/30 flex items-center justify-center font-serif text-gold font-bold italic text-xl mx-auto mb-4">Ł</div>
          <h1 className="font-serif text-2xl text-slate-100">Fale com o Escritório</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.2em] mt-1">Atendimento Jurídico de Elite</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 bg-[#06101a] border border-[#ffffff12] rounded-2xl p-8">
          <div className="space-y-1.5">
            <label className="text-[9px] text-slate-500 uppercase tracking-widest ml-1">Seu Nome Completo *</label>
            <input
              required
              autoFocus
              className="w-full h-11 px-4 rounded-xl bg-slate-900/50 border border-[#ffffff12] text-sm text-slate-100 focus:outline-none focus:border-gold/40 transition-all"
              value={name}
              onChange={e => setName(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] text-slate-500 uppercase tracking-widest ml-1">WhatsApp / Telefone</label>
            <input
              type="tel"
              placeholder="(61) 9XXXX-XXXX"
              className="w-full h-11 px-4 rounded-xl bg-slate-900/50 border border-[#ffffff12] text-sm text-slate-100 focus:outline-none focus:border-gold/40 transition-all"
              value={phone}
              onChange={e => setPhone(e.target.value)}
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] text-slate-500 uppercase tracking-widest ml-1">Área do Seu Caso</label>
            <select
              className="w-full h-11 px-4 rounded-xl bg-slate-900/50 border border-[#ffffff12] text-sm text-slate-200 focus:outline-none focus:border-gold/40 transition-all appearance-none cursor-pointer"
              value={area}
              onChange={e => setArea(e.target.value)}
            >
              {AREAS.map(a => <option key={a} value={a} className="bg-[#0c1520]">{a}</option>)}
            </select>
          </div>

          <div className="space-y-1.5">
            <label className="text-[9px] text-slate-500 uppercase tracking-widest ml-1">Descreva Brevemente Sua Situação</label>
            <textarea
              placeholder="Ex: Fui demitido sem justa causa e não recebi minha rescisão corretamente..."
              className="w-full h-28 p-4 rounded-xl bg-slate-900/50 border border-[#ffffff12] text-sm text-slate-400 focus:outline-none focus:border-gold/40 transition-all resize-none"
              value={caseDesc}
              onChange={e => setCaseDesc(e.target.value)}
            />
          </div>

          {error && <p className="text-red-400 text-xs text-center">{error}</p>}

          <button
            type="submit"
            disabled={loading || !name.trim()}
            className="w-full h-12 rounded-xl bg-gold/10 border border-gold/30 text-gold font-bold text-xs uppercase tracking-[0.2em] hover:bg-gold/20 transition-all disabled:opacity-40 flex items-center justify-center gap-2"
          >
            {loading
              ? <div className="w-4 h-4 border border-gold/30 border-t-gold rounded-full animate-spin" />
              : <><Send size={14} /> Enviar Contato</>
            }
          </button>

          <p className="text-[9px] text-slate-600 text-center">Suas informações são confidenciais e protegidas por sigilo profissional.</p>
        </form>
      </div>
    </div>
  );
}
