import { useState } from 'react';
import { X, Plus, Copy, Check } from 'lucide-react';
import axios from 'axios';

interface AdminPanelProps {
  onClose: () => void;
}

export function AdminPanel({ onClose }: AdminPanelProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState<{ email: string; password: string } | null>(null);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState(false);

  const API_URL = import.meta.env.VITE_API_URL ||
    (typeof window !== 'undefined' && window.location.hostname === 'localhost'
      ? 'http://localhost:4000'
      : 'https://law-sovereign-web-production.up.railway.app');

  const generatePassword = () => {
    return Math.random().toString(36).slice(-12);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    if (!email || !name) {
      setError('Preencha email e nome');
      setLoading(false);
      return;
    }

    const password = generatePassword();

    try {
      const response = await axios.post(`${API_URL}/auth/register`, {
        email,
        password,
        name
      }, {
        headers: {
          'x-api-key': import.meta.env.VITE_INTERNAL_API_KEY || ''
        }
      });

      if (response.data.token) {
        setSuccess({ email, password });
        setEmail('');
        setName('');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Erro ao registrar cliente');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
      <div className="w-full max-w-md bg-[#111c2e] rounded-2xl border border-[#ffffff12] shadow-2xl">

        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#ffffff12]">
          <div>
            <h3 className="font-serif text-xl font-semibold text-slate-50">Registrar Cliente</h3>
            <p className="text-[11px] text-slate-400 uppercase tracking-widest mt-1">Novo Advogado</p>
          </div>
          <button onClick={onClose} className="p-2 text-slate-400 hover:text-slate-200">
            <X size={20} />
          </button>
        </div>

        {/* Success Message */}
        {success && (
          <div className="p-6 bg-emerald-500/10 border-b border-emerald-500/30">
            <p className="text-emerald-400 font-semibold mb-4">✓ Cliente registrado com sucesso!</p>
            <div className="space-y-3 bg-[#0e1827] p-4 rounded-xl">
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-widest mb-1">Email</p>
                <div className="flex items-center justify-between">
                  <code className="text-sm text-slate-100">{success.email}</code>
                  <button
                    onClick={() => copyToClipboard(success.email)}
                    className="p-1 text-gold hover:text-gold/80"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
              <div>
                <p className="text-[11px] text-slate-400 uppercase tracking-widest mb-1">Senha</p>
                <div className="flex items-center justify-between">
                  <code className="text-sm text-slate-100 font-mono">{success.password}</code>
                  <button
                    onClick={() => copyToClipboard(success.password)}
                    className="p-1 text-gold hover:text-gold/80"
                  >
                    {copied ? <Check size={16} /> : <Copy size={16} />}
                  </button>
                </div>
              </div>
            </div>
            <button
              onClick={() => setSuccess(null)}
              className="w-full mt-4 h-10 rounded-xl bg-gold/10 border border-gold/30 text-gold font-bold text-xs uppercase tracking-wider hover:bg-gold/20"
            >
              Registrar Outro
            </button>
          </div>
        )}

        {/* Form */}
        {!success && (
          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="text-[11px] text-slate-400 uppercase tracking-widest ml-1 block mb-2">
                Nome Completo
              </label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Dr. João Silva"
                className="w-full h-11 px-4 rounded-xl bg-slate-900/50 border border-[#ffffff12] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-all"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-[11px] text-slate-400 uppercase tracking-widest ml-1 block mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="joao@escritorio.com"
                className="w-full h-11 px-4 rounded-xl bg-slate-900/50 border border-[#ffffff12] text-sm text-slate-100 placeholder:text-slate-500 focus:outline-none focus:border-gold/40 transition-all"
                disabled={loading}
              />
            </div>

            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-xl">
                <p className="text-red-400 text-sm">{error}</p>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full h-12 rounded-xl bg-gold/10 border border-gold/30 text-gold font-bold text-xs uppercase tracking-[0.2em] hover:bg-gold/20 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <Plus size={16} />
              {loading ? 'Registrando...' : 'Registrar Cliente'}
            </button>

            <p className="text-[11px] text-slate-500 text-center">
              A senha será gerada automaticamente e exibida para você copiar
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
