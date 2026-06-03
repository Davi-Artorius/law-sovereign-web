import { useState } from 'react';
import { ShieldCheck } from 'lucide-react';

interface Props {
  onAuth: () => void;
}

export function LoginScreen({ onAuth }: Props) {
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [shaking, setShaking] = useState(false);

  const expected = import.meta.env.VITE_APP_PASSWORD as string | undefined;

  const attempt = () => {
    if (!expected || password === expected) {
      onAuth();
      return;
    }
    setError(true);
    setShaking(true);
    setTimeout(() => setShaking(false), 500);
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-[#020507]">
      <div className={`w-full max-w-sm bg-[#06101a] border border-[#ffffff12] rounded-2xl p-10 shadow-2xl flex flex-col items-center gap-8 ${shaking ? 'animate-shake' : ''}`}>
        <div className="flex flex-col items-center gap-3">
          <div className="w-14 h-14 rounded-2xl bg-gold/10 border border-gold/30 flex items-center justify-center">
            <ShieldCheck size={28} className="text-gold" />
          </div>
          <h1 className="font-serif text-2xl font-semibold text-slate-100 tracking-wide">LAW SOVEREIGN</h1>
          <p className="text-[10px] text-slate-500 uppercase tracking-[0.3em]">Acesso Restrito</p>
        </div>

        <div className="w-full space-y-3">
          <input
            type="password"
            autoFocus
            placeholder="Senha de acesso"
            className={`w-full h-12 px-4 rounded-xl bg-slate-900/50 border text-sm text-slate-100 focus:outline-none transition-all placeholder:text-slate-600 ${
              error ? 'border-red-500/60 focus:border-red-500/80' : 'border-[#ffffff12] focus:border-gold/40'
            }`}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            onKeyDown={e => e.key === 'Enter' && attempt()}
          />
          {error && (
            <p className="text-[11px] text-red-400/80 text-center">Senha incorreta.</p>
          )}
          <button
            onClick={attempt}
            className="w-full h-12 rounded-xl bg-gold/10 border border-gold/30 text-gold font-bold text-xs uppercase tracking-[0.2em] hover:bg-gold/20 transition-all active:scale-[0.98]"
          >
            Entrar
          </button>
        </div>
      </div>

      <style>{`
        @keyframes shake {
          0%, 100% { transform: translateX(0); }
          20% { transform: translateX(-8px); }
          40% { transform: translateX(8px); }
          60% { transform: translateX(-6px); }
          80% { transform: translateX(6px); }
        }
        .animate-shake { animation: shake 0.4s ease-in-out; }
      `}</style>
    </div>
  );
}
