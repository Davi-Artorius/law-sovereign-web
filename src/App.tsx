import { useState, useEffect, useCallback, useMemo } from 'react';
import {
  Search, PlusCircle, Layers, LayoutGrid, Stethoscope,
  X, ShieldCheck, BarChart2, Menu
} from 'lucide-react';

// Tipos e Constantes
import type { Client, TimelineEvent, Attachment } from './domain';
import { storage } from './api/storage';
import { AREAS } from './constants';
import { formatBRDate, formatBRDateTime, parseDate, daysSince } from './utils/helpers';

// Componentes
import { DashboardView } from './components/DashboardView';
import { ClientCard } from './components/ClientCard';
import { DetailPanel } from './components/DetailPanel';
import { LoginScreen } from './components/LoginScreen';

// ─── HOOKS CUSTOMIZADOS ──────────────────────────────────────────────────────
function useToast() {
  const [msg, setMsg] = useState('');
  const [visible, setVisible] = useState(false);
  const show = useCallback((m: string) => {
    setMsg(m);
    setVisible(true);
    setTimeout(() => setVisible(false), 3000);
  }, []);
  return { msg, visible, show };
}

// ─── APP PRINCIPAL ───────────────────────────────────────────────────────────
function AppInner() {
  const [isMobile, setIsMobile] = useState(() => window.innerWidth < 768);
  const [sidebarOpen, setSidebarOpen] = useState(false);

  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth < 768);
    window.addEventListener('resize', handler);
    return () => window.removeEventListener('resize', handler);
  }, []);

  const [clients, setClients] = useState<Client[]>([]);
  const [events, setEvents] = useState<TimelineEvent[]>([]);
  const [loading, setLoading] = useState(true);

  // Maelstrom: Sincronização Inicial com o PostgreSQL
  const fetchData = useCallback(async () => {
    setLoading(true);
    const data = await storage.getClients();
    setClients(data);
    
    // Maelstrom: Flatten events dos clientes para o estado local
    const allEvents = data.flatMap(c => (c as any).events || []);
    setEvents(allEvents);
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  // UI State
  const [view, setView] = useState<'Dashboard' | 'Triagem' | 'Evolução' | 'Encaminhamentos'>('Dashboard');
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [search, setSearch] = useState('');
  const [isAddingClient, setIsAddingClient] = useState(false);
  
  // Form State
  const [newClientName, setNewClientName] = useState('');
  const [newClientCase, setNewClientCase] = useState('');
  const [newClientArea, setNewClientArea] = useState<string>('Civil');
  
  // Detail State
  const [newEventContent, setNewEventContent] = useState('');
  const [pendingAttachment, setPendingAttachment] = useState<Attachment | null>(null);
  
  const toast = useToast();

  // ─── ACTIONS (PostgreSQL Sync) ──────────────────────────────────────────────
  
  const addClient = useCallback(async () => {
    if (!newClientName.trim()) return;
    
    try {
      const newClient = await storage.createClient({
        name: newClientName.trim(),
        status: 'Triagem',
        lastAction: formatBRDate(new Date()),
        case: newClientCase.trim() || 'Descrição pendente',
        area: newClientArea
      });

      setClients(prev => [newClient, ...prev]);
      setNewClientName('');
      setNewClientCase('');
      setIsAddingClient(false);
      setView('Triagem');
      toast.show(`${newClient.name} incorporado no PostgreSQL.`);
    } catch (err) {
      toast.show('Erro ao salvar no banco de dados.');
    }
  }, [newClientName, newClientCase, newClientArea, toast]);

  const promoteClient = useCallback(async (clientId: string) => {
    try {
      const updated = await storage.updateClient(clientId, { 
        status: 'Evolução', 
        lastAction: formatBRDate(new Date()) 
      });
      
      setClients(prev => prev.map(c => c.id === clientId ? updated : c));
      
      const event = await storage.createEvent({
        clientId,
        type: 'Nota',
        date: formatBRDateTime(new Date()),
        content: 'Promovido ao Hub de Evolução via API.'
      });
      
      setEvents(prev => [event, ...prev]);
      toast.show('Lead promovido com sucesso.');
    } catch (err) {
      toast.show('Erro na promoção do lead.');
    }
  }, [toast]);

  const deleteClient = useCallback(async (clientId: string) => {
    if (!window.confirm('Confirmar exclusão permanente no PostgreSQL?')) return;
    
    try {
      await storage.deleteClient(clientId);
      setClients(prev => prev.filter(c => c.id !== clientId));
      setEvents(prev => prev.filter(e => e.clientId !== clientId));
      if (selectedClient?.id === clientId) setSelectedClient(null);
      toast.show('Dossier removido permanentemente.');
    } catch (err) {
      toast.show('Erro ao remover do banco.');
    }
  }, [selectedClient, toast]);

  const addTimelineEvent = useCallback(async () => {
    // Maelstrom: Agora permitimos salvar se houver texto OU se houver um anexo
    if (!selectedClient || (!newEventContent.trim() && !pendingAttachment)) return;
    
    try {
      const event = await storage.createEvent({
        clientId: selectedClient.id,
        date: formatBRDateTime(new Date()),
        type: 'Nota',
        // Sage: Se o texto for vazio, salvamos um marcador amigável
        content: newEventContent.trim() || (pendingAttachment ? `Documento anexado: ${pendingAttachment.name}` : ''),
        attachment: pendingAttachment || undefined
      });

      setEvents(prev => [event, ...prev]);
      setNewEventContent('');
      setPendingAttachment(null);
      toast.show('Registro salvo no banco de dados.');
    } catch (err) {
      toast.show('Erro ao salvar evento (verifique tamanho do anexo).');
    }
  }, [selectedClient, newEventContent, pendingAttachment, toast]);

  const toggleEncaminhamento = useCallback(async (clientId: string) => {
    const client = clients.find(c => c.id === clientId);
    if (!client) return;

    try {
      const nextState = !client.isEncaminhado;
      const updated = await storage.updateClient(clientId, { isEncaminhado: nextState });
      
      setClients(prev => prev.map(c => c.id === clientId ? updated : c));
      
      const event = await storage.createEvent({
        clientId,
        type: 'Encaminhamento',
        date: formatBRDateTime(new Date()),
        content: nextState ? 'Encaminhado para especialista.' : 'Retorno de encaminhamento.'
      });
      setEvents(ePrev => [event, ...ePrev]);
    } catch (err) {
      toast.show('Erro ao alterar status de encaminhamento.');
    }
  }, [clients, toast]);

  const updateClientData = useCallback(async (clientId: string, data: Partial<Client>) => {
    try {
      const updated = await storage.updateClient(clientId, data);
      setClients(prev => prev.map(c => c.id === clientId ? updated : c));
      if (selectedClient?.id === clientId) {
        setSelectedClient(updated);
      }
      toast.show('Dados do lead atualizados (PostgreSQL).');
    } catch (err) {
      toast.show('Erro ao atualizar lead.');
    }
  }, [selectedClient, toast]);

  const handleAttachFile = useCallback((file: File) => {
    if (file.size > 5 * 1024 * 1024) { // Maelstrom: Com Postgres, voltamos para 5MB
      toast.show('Arquivo excede limite de 5MB.');
      return;
    }
    const reader = new FileReader();
    reader.onload = e => {
      const data = (e.target?.result as string).split(',')[1];
      setPendingAttachment({
        name: file.name,
        type: file.type,
        data,
        size: file.size
      });
      toast.show('Pronto para persistência no banco.');
    };
    reader.readAsDataURL(file);
  }, [toast]);

  // ─── ANALYTICS (useMemo) ───────────────────────────────────────────────────
  
  const filteredClients = useMemo(() => {
    return clients.filter(c => {
      const matchSearch = c.name.toLowerCase().includes(search.toLowerCase()) || 
                          c.case.toLowerCase().includes(search.toLowerCase());
      if (!matchSearch) return false;

      if (view === 'Triagem') return c.status === 'Triagem';
      if (view === 'Evolução') return c.status === 'Evolução';
      if (view === 'Encaminhamentos') return c.isEncaminhado;
      return true;
    });
  }, [clients, search, view]);

  const counts = useMemo(() => ({
    triagem: clients.filter(c => c.status === 'Triagem').length,
    evolucao: clients.filter(c => c.status === 'Evolução').length,
    enc: clients.filter(c => c.isEncaminhado).length,
  }), [clients]);

  const weekData = useMemo(() => {
    const days = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb'];
    const data = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - (6 - i));
      return { day: days[d.getDay()], date: d, count: 0 };
    });

    clients.forEach(c => {
      const created = parseDate(c.createdAt);
      data.forEach(d => {
        if (created.toDateString() === d.date.toDateString()) d.count++;
      });
    });
    return data;
  }, [clients]);

  const forgotten = useMemo(() => {
    return clients.filter(c => {
      if (c.status !== 'Evolução') return false;
      const cEvents = events.filter(e => e.clientId === c.id);
      if (cEvents.length === 0) return daysSince(c.createdAt) > 15;
      
      const latest = cEvents.reduce((prev, curr) => {
        return parseDate(curr.date) > parseDate(prev.date) ? curr : prev;
      });
      return daysSince(latest.date) > 15;
    });
  }, [clients, events]);

  if (loading) return (
    <div className="h-screen w-full flex items-center justify-center bg-[#020507]">
      <div className="flex flex-col items-center gap-4">
        <div className="w-12 h-12 border-2 border-gold/20 border-t-gold rounded-full animate-spin" />
        <p className="font-serif text-xs text-gold/60 uppercase tracking-widest">Sincronizando com PostgreSQL...</p>
      </div>
    </div>
  );

  const NAV_ITEMS = [
    { id: 'Dashboard', label: 'Dashboard', icon: BarChart2, sub: 'Inteligência' },
    { id: 'Triagem', label: 'Triagem', icon: Layers, count: counts.triagem, sub: 'Entrada' },
    { id: 'Evolução', label: 'Evolução', icon: LayoutGrid, count: counts.evolucao, sub: 'Ativos' },
    { id: 'Encaminhamentos', label: 'Encaminhamentos', icon: Stethoscope, count: counts.enc, sub: 'Externos' },
  ];

  return (
    <div className="flex h-screen bg-[#020507] text-[#e8edf2] font-sans overflow-hidden">

      {/* Backdrop mobile */}
      {isMobile && sidebarOpen && (
        <div className="fixed inset-0 z-40 bg-black/70" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`${isMobile ? 'fixed inset-y-0 left-0 z-50 transition-transform duration-300' : 'relative flex-shrink-0'} w-64 bg-[#06101a] border-r border-[#ffffff12] flex flex-col ${isMobile && !sidebarOpen ? '-translate-x-full' : 'translate-x-0'}`}>
        <div className="p-6 border-b border-[#ffffff0a]">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-8 h-8 rounded-lg bg-gold/10 border border-gold/30 flex items-center justify-center font-serif text-gold font-bold italic">Ł</div>
            <div>
              <h1 className="font-serif text-sm font-semibold tracking-wide">LAW SOVEREIGN</h1>
              <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em]">Gestão de Elite</p>
            </div>
          </div>
          <div className="flex items-center gap-2 pl-11">
            <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
            <span className="text-[9px] text-emerald-500 uppercase tracking-widest">Soberania Ativa</span>
          </div>
        </div>

        <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
          <p className="text-[9px] text-slate-600 uppercase tracking-[0.2em] px-3 mb-2">Navegação</p>
          {NAV_ITEMS.map(item => {
            const active = view === item.id;
            return (
              <button
                key={item.id}
                onClick={() => { setView(item.id as any); setSelectedClient(null); if (isMobile) setSidebarOpen(false); }}
                className={`w-full flex items-center justify-between p-3 rounded-xl transition-all group ${active ? 'bg-gold/10 border-l-2 border-gold' : 'hover:bg-white/5'}`}
              >
                <div className="flex items-center gap-3 text-left">
                  <item.icon size={16} className={active ? 'text-gold' : 'text-slate-500 group-hover:text-slate-300'} />
                  <div>
                    <div className={`text-xs font-medium ${active ? 'text-gold' : 'text-slate-400 group-hover:text-slate-200'}`}>{item.label}</div>
                    <div className="text-[8px] text-slate-600 uppercase">{item.sub}</div>
                  </div>
                </div>
                {item.count !== undefined && (
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${active ? 'bg-gold/20 text-gold border border-gold/30' : 'bg-blue-500/10 text-blue-400 border border-blue-500/20'}`}>
                    {item.count}
                  </span>
                )}
              </button>
            );
          })}
        </nav>

        <div className="p-4 border-t border-[#ffffff0a]">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-gold/10 border border-gold/20 flex items-center justify-center font-serif text-[10px] text-gold font-bold">AR</div>
            <div>
              <p className="text-[11px] font-semibold text-slate-200">Dr. Arquiteto</p>
              <p className="text-[9px] text-slate-500 uppercase tracking-tighter">Sovereign Admin</p>
            </div>
          </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 flex flex-col min-w-0 bg-[#020507]">
        <header className="h-16 flex items-center justify-between px-8 border-b border-[#ffffff0a] bg-[#06101a]/80 backdrop-blur-md flex-shrink-0">
          <div className="flex items-center gap-3">
            {isMobile && (
              <button onClick={() => setSidebarOpen(true)} className="p-1.5 text-slate-400 hover:text-slate-200 transition-colors">
                <Menu size={20} />
              </button>
            )}
            <div>
              <h2 className="font-serif text-xl font-medium text-slate-100">{view}</h2>
              <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em]">{view === 'Dashboard' ? 'Operacional' : 'Protocolo'}</p>
            </div>
          </div>
          
          <div className="flex items-center gap-4">
            {view !== 'Dashboard' && (
              <div className="relative">
                <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-600" />
                <input 
                  type="text" 
                  placeholder="Pesquisar..." 
                  className="pl-9 pr-4 h-9 w-56 rounded-full bg-slate-900/50 border border-[#ffffff12] text-xs focus:outline-none focus:border-gold/30 transition-colors"
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                />
              </div>
            )}
            <button 
              onClick={() => setIsAddingClient(true)}
              className="flex items-center gap-2 h-9 px-4 rounded-full bg-gold/10 border border-gold/20 text-gold text-[10px] font-bold uppercase tracking-wider hover:bg-gold/20 transition-all active:scale-95"
            >
              <PlusCircle size={14} /> {!isMobile && 'Novo Dossier'}
            </button>
          </div>
        </header>

        <div className="flex-1 flex min-h-0">
          {view === 'Dashboard' ? (
            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <DashboardView 
                clients={clients} 
                counts={counts} 
                events={events} 
                weekData={weekData} 
                forgotten={forgotten} 
                onReset={() => storage.nuclearReset()}
              />
            </div>
          ) : (
            <div className="flex-1 flex min-h-0">
              <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {filteredClients.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center opacity-20 gap-4">
                    <ShieldCheck size={64} strokeWidth={1} />
                    <p className="font-serif text-lg tracking-[0.3em] uppercase">Limbo</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
                    {filteredClients.map(c => (
                      <ClientCard 
                        key={c.id} 
                        client={c} 
                        selected={selectedClient?.id === c.id} 
                        onSelect={setSelectedClient} 
                        onPromote={promoteClient} 
                        onDelete={deleteClient} 
                      />
                    ))}
                  </div>
                )}
              </div>
              
              {selectedClient && (
                <DetailPanel
                  client={selectedClient}
                  events={events.filter(e => e.clientId === selectedClient.id)}
                  newEvent={newEventContent}
                  pendingAttachment={pendingAttachment}
                  onEventChange={setNewEventContent}
                  onAddEvent={addTimelineEvent}
                  onClose={() => setSelectedClient(null)}
                  onToggleEnc={toggleEncaminhamento}
                  onAttachFile={handleAttachFile}
                  onClearAttachment={() => setPendingAttachment(null)}
                  onDelete={deleteClient}
                  onUpdateClient={updateClientData}
                  isMobile={isMobile}
                />
              )}
            </div>
          )}
        </div>
      </main>

      {/* Modal Cadastro */}
      {isAddingClient && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/90 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="w-full max-w-md bg-[#0c1520] rounded-2xl border border-[#ffffff12] p-8 shadow-2xl animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="font-serif text-xl text-slate-100">Novo Dossier</h3>
                <p className="text-[10px] text-slate-500 uppercase tracking-widest mt-1">Incorporação de Lead</p>
              </div>
              <button onClick={() => setIsAddingClient(false)} className="p-2 text-slate-500 hover:text-slate-300 transition-colors"><X size={20}/></button>
            </div>
            
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-500 uppercase tracking-widest ml-1">Nome Completo</label>
                <input 
                  autoFocus 
                  className="w-full h-11 px-4 rounded-xl bg-slate-900/50 border border-[#ffffff12] text-sm text-slate-100 focus:outline-none focus:border-gold/40 transition-all"
                  value={newClientName}
                  onChange={e => setNewClientName(e.target.value)}
                />
              </div>
              
              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-500 uppercase tracking-widest ml-1">Descrição do Caso</label>
                <textarea 
                  className="w-full h-24 p-4 rounded-xl bg-slate-900/50 border border-[#ffffff12] text-sm text-slate-400 focus:outline-none focus:border-gold/40 transition-all resize-none"
                  value={newClientCase}
                  onChange={e => setNewClientCase(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-[9px] text-slate-500 uppercase tracking-widest ml-1">Área Atuação</label>
                <select 
                  className="w-full h-11 px-4 rounded-xl bg-slate-900/50 border border-[#ffffff12] text-sm text-slate-200 focus:outline-none focus:border-gold/40 transition-all appearance-none cursor-pointer"
                  value={newClientArea}
                  onChange={e => setNewClientArea(e.target.value)}
                >
                  {AREAS.map(a => <option key={a} value={a} className="bg-[#0c1520]">{a}</option>)}
                </select>
              </div>

              <button 
                onClick={addClient}
                className="w-full h-12 mt-4 rounded-xl bg-gold/10 border border-gold/30 text-gold font-bold text-xs uppercase tracking-[0.2em] hover:bg-gold/20 transition-all shadow-lg active:scale-[0.98]"
              >
                Selar e Arquivar Dossier
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Toast */}
      {toast.visible && (
        <div className="fixed bottom-8 right-8 z-[100] px-6 py-3 rounded-xl bg-[#0c1c14] border border-emerald-500/30 text-emerald-400 text-xs font-medium shadow-2xl animate-in slide-in-from-bottom-4 duration-300">
          {toast.msg}
        </div>
      )}

      <style>{`
        .custom-scrollbar::-webkit-scrollbar { width: 4px; }
        .custom-scrollbar::-webkit-scrollbar-track { background: transparent; }
        .custom-scrollbar::-webkit-scrollbar-thumb { background: rgba(255,215,0,0.05); border-radius: 2px; }
        .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: rgba(255,215,0,0.1); }
      `}</style>
    </div>
  );
}

export default function App() {
  const [authenticated, setAuthenticated] = useState(() => {
    const pw = import.meta.env.VITE_APP_PASSWORD as string | undefined;
    if (!pw) return true;
    return sessionStorage.getItem('ls_auth') === 'true';
  });

  if (!authenticated) {
    return <LoginScreen onAuth={() => {
      sessionStorage.setItem('ls_auth', 'true');
      setAuthenticated(true);
    }} />;
  }

  return <AppInner />;
}
