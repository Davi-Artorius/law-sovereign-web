import { useState } from 'react';
import axios from 'axios';
import { AlertCircle, Eye, EyeOff } from 'lucide-react';

interface LoginScreenProps {
  onAuth: (token: string, email: string) => void;
}

export function LoginScreen({ onAuth }: LoginScreenProps) {
  const [mode, setMode] = useState<'login' | 'register'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:4000';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const endpoint = mode === 'login' ? '/auth/login' : '/auth/register';
      const payload = mode === 'login'
        ? { email, password }
        : { email, password, name };

      const response = await axios.post(`${API_URL}${endpoint}`, payload);
      const { token, email: responseEmail } = response.data;

      // Salva token e email no localStorage
      localStorage.setItem('auth', JSON.stringify({ token, email: responseEmail }));

      // Configura axios para usar token em requisições futuras
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;

      onAuth(token, responseEmail);
    } catch (err: any) {
      const msg = err.response?.data?.error || 'Erro ao processar requisição';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-full flex items-center justify-center bg-gradient-to-br from-[#0a121e] via-[#0e1827] to-[#0a121e] overflow-hidden relative">
      {/* Background decoration */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-gold/5 rounded-full blur-3xl opacity-20" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-500/5 rounded-full blur-3xl opacity-20" />
      </div>

      {/* Card */}
      <div className="relative w-full max-w-md mx-4 px-8 py-12 bg-[#111c2e]/80 backdrop-blur-xl rounded-2xl border border-[#ffffff12] shadow-2xl">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <div className="w-16 h-16 rounded-full border-2 border-gold bg-gold/5 grid place-items-center font-serif text-3xl text-gold font-bold">§</div>
          </div>
          <h1 className="font-serif text-3xl font-bold text-slate-50 tracking-wide">
            LAW <span className="text-gold">SOVEREIGN</span>
          </h1>
          <p className="text-[11px] text-slate-400 uppercase tracking-[0.2em] mt-2">Gestão de Elite</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex gap-2 mb-8 bg-slate-900/50 rounded-full p-1">
          <button
            onClick={() => {
              setMode('login');
              setError('');
            }}
            className={`flex-1 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest transition-all ${
              mode === 'login'
                ? 'bg-gold/20 text-gold border border-gold/30'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Entrar
          </button>
          <button
            onClick={() => {
              setMode('register');
              setError('');
            }}
            className={`flex-1 py-2.5 rounded-full text-sm font-bold uppercase tracking-widest transition-all ${
              mode === 'register'
                ? 'bg-gold/20 text-gold border border-gold/30'
                : 'text-slate-400 hover:text-slate-300'
            }`}
          >
            Registrar
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Name (register only) */}
          {mode === 'register' && (
            <div>
              <label className="text-[11px] text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Seu nome"
                className="w-full h-11 px-4 rounded-xl bg-slate-900/50 border border-[#ffffff12] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-all"
                disabled={loading}
              />
            </div>
          )}

          {/* Email */}
          <div>
            <label className="text-[11px] text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">
              Email
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="seu@email.com"
              className="w-full h-11 px-4 rounded-xl bg-slate-900/50 border border-[#ffffff12] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-all"
              disabled={loading}
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="text-[11px] text-slate-400 uppercase tracking-widest ml-1 block mb-1.5">
              Senha
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={mode === 'register' ? 'Mínimo 8 caracteres' : '••••••••'}
                className="w-full h-11 px-4 pr-11 rounded-xl bg-slate-900/50 border border-[#ffffff12] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-all"
                disabled={loading}
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 transition-colors"
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="flex items-start gap-3 p-3 rounded-xl bg-red-500/10 border border-red-500/30">
              <AlertCircle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <p className="text-xs text-red-300">{error}</p>
            </div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 mt-6 rounded-xl bg-gold/10 border border-gold/30 text-gold font-bold text-xs uppercase tracking-[0.2em] hover:bg-gold/20 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-lg active:scale-[0.98]"
          >
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <div className="w-3.5 h-3.5 border border-gold/30 border-t-gold rounded-full animate-spin" />
                Processando...
              </span>
            ) : mode === 'login' ? (
              'Entrar Agora'
            ) : (
              'Criar Conta'
            )}
          </button>
        </form>

        {/* Footer */}
        <p className="text-[10px] text-slate-500 text-center mt-6 uppercase tracking-widest">
          {mode === 'login'
            ? 'Sem acesso? Crie sua conta abaixo.'
            : 'Já tem acesso? Faça login acima.'}
        </p>
      </div>
    </div>
  );
}
