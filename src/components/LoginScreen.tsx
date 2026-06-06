import { useState } from 'react';

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
    <div
      className="h-screen w-full flex items-center justify-center bg-[#0a121e]"
      style={{ backgroundImage: 'radial-gradient(700px 320px at 50% -10%, rgba(201,162,39,0.10), transparent)' }}
    >
      <div className={`w-full max-w-sm bg-[#0e1827] border border-[#ffffff14] rounded-2xl p-10 shadow-2xl flex flex-col items-center gap-8 ${shaking ? 'animate-shake' : ''}`}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-16 h-16 rounded-full border-2 border-gold grid place-items-center font-serif text-3xl text-gold font-bold">§</div>
          <div className="text-center">
            <h1 className="font-serif text-3xl font-bold tracking-wide text-slate-50">LAW <span className="text-gold">SOVEREIGN</span></h1>
            <p className="text-[11px] text-slate-400 uppercase tracking-[0.35em] mt-1.5">Acesso Restrito</p>
          </div>
        </div>

        <div className="w-full space-y-3">
          <input
            type="password"
            autoFocus
            placeholder="Senha de acesso"
            className={`w-full h-12 px-4 rounded-xl bg-[#0a121e] border text-base text-slate-100 focus:outline-none transition-all placeholder:text-slate-500 ${
              error ? 'border-red-500/60 focus:border-red-500/80' : 'border-[#ffffff14] focus:border-gold/50'
            }`}
            value={password}
            onChange={e => { setPassword(e.target.value); setError(false); }}
            onKeyDown={e => e.key === 'Enter' && attempt()}
          />
          {error && (
            <p className="text-sm text-red-400 text-center">Senha incorreta.</p>
          )}
          <button
            onClick={attempt}
            className="w-full h-12 rounded-xl bg-gold text-[#0a121e] font-bold text-sm uppercase tracking-[0.2em] hover:brightness-110 transition-all active:scale-[0.98]"
          >
            Entrar
          </button>
        </div>

        <p className="text-[10px] text-slate-600 uppercase tracking-[0.3em]">Soberania de Dados</p>
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
