import React, { useRef, useState } from 'react';
import { X, Trash2, Stethoscope, Paperclip, Briefcase, Calculator, FileText, Phone, Share2 } from 'lucide-react';
import type { Client, TimelineEvent, Attachment } from '../domain';
import { EVENT_META } from '../constants';
import { getInitials, avatarPalette } from '../utils/helpers';

interface DetailPanelProps {
  client: Client;
  events: TimelineEvent[];
  newEvent: string;
  pendingAttachment: Attachment | null;
  onEventChange: (v: string) => void;
  onAddEvent: () => void;
  onClose: () => void;
  onToggleEnc: (id: string) => void;
  onAttachFile: (file: File) => void;
  onClearAttachment: () => void;
  onDelete: (id: string) => void;
  onUpdateClient?: (id: string, data: Partial<Client>) => void;
  isMobile?: boolean;
}

export function DetailPanel({
  client: c,
  events,
  newEvent,
  pendingAttachment,
  onEventChange,
  onAddEvent,
  onClose,
  onToggleEnc,
  onAttachFile,
  onClearAttachment,
  onDelete,
  onUpdateClient,
  isMobile
}: DetailPanelProps) {
  const pal = avatarPalette(c.id);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [copied, setCopied] = useState(false);
  const [editingCost, setEditingCost] = useState(false);
  const [costVal, setCostVal] = useState('');
  const [editingChance, setEditingChance] = useState(false);
  const [chanceVal, setChanceVal] = useState('');
  const [editingPhone, setEditingPhone] = useState(false);
  const [phoneVal, setPhoneVal] = useState('');
  const [editingCase, setEditingCase] = useState(false);
  const [caseVal, setCaseVal] = useState('');
  
  // Maelstrom: Helper para converter Base64 em Blob (Necessário para visualizar PDFs/Arquivos em nova aba)
  const b64toBlob = (b64Data: string, contentType = '', sliceSize = 512) => {
    const byteCharacters = atob(b64Data);
    const byteArrays = [];
    for (let offset = 0; offset < byteCharacters.length; offset += sliceSize) {
      const slice = byteCharacters.slice(offset, offset + sliceSize);
      const byteNumbers = new Array(slice.length);
      for (let i = 0; i < slice.length; i++) {
        byteNumbers[i] = slice.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      byteArrays.push(byteArray);
    }
    return new Blob(byteArrays, { type: contentType });
  };

  const openAttachment = (att: Attachment) => { 
    const url = `data:${att.type};base64,${att.data}`; 
    const a = document.createElement('a'); 
    a.href = url; 
    a.download = att.name; 
    a.click(); 
  };

  const panelStyle: React.CSSProperties = isMobile
    ? { position: 'fixed', inset: 0, zIndex: 50, background: '#0a1520', display: 'flex', flexDirection: 'column', overflowY: 'auto' }
    : { width: 420, flexShrink: 0, background: '#0a1520', borderLeft: '1px solid rgba(100,160,220,0.08)', display: 'flex', flexDirection: 'column', overflowY: 'auto' };

  return (
    <aside style={panelStyle}>
      <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid rgba(100,160,220,0.06)', background: '#06101a' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', marginBottom: 14 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{ width: 44, height: 44, borderRadius: 12, background: pal.bg, border: `1px solid ${pal.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', fontFamily: 'Georgia,serif', fontSize: 16, fontWeight: 700, color: pal.text }}>{getInitials(c.name)}</div>
            <div>
              <div style={{ fontFamily: 'Georgia,serif', fontSize: 17, fontWeight: 500, color: '#e8edf2' }}>{c.name}</div>
              <div style={{ fontSize: 10, color: '#3d5570', marginTop: 2 }}>ID-{c.id.slice(-4).toUpperCase()} · {c.area || c.status}</div>
              {editingPhone ? (
                <input
                  autoFocus
                  type="tel"
                  value={phoneVal}
                  onChange={e => setPhoneVal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') { onUpdateClient?.(c.id, { phone: phoneVal || undefined }); setEditingPhone(false); }
                    if (e.key === 'Escape') setEditingPhone(false);
                  }}
                  onBlur={() => { onUpdateClient?.(c.id, { phone: phoneVal || undefined }); setEditingPhone(false); }}
                  placeholder="(11) 99999-9999"
                  style={{ marginTop: 4, padding: '3px 8px', borderRadius: 6, border: '1px solid rgba(200,169,110,0.4)', background: 'rgba(200,169,110,0.08)', color: '#c8a96e', fontSize: 11, outline: 'none', width: 160 }}
                />
              ) : (
                <div
                  onClick={() => { setPhoneVal(c.phone || ''); setEditingPhone(true); }}
                  style={{ marginTop: 4, display: 'flex', alignItems: 'center', gap: 4, cursor: 'pointer', fontSize: 11, color: c.phone ? '#c8a96e' : '#3d5570' }}
                >
                  <Phone size={11} /> {c.phone || 'Adicionar telefone'}
                </div>
              )}
              {editingCase ? (
                <textarea
                  autoFocus
                  value={caseVal}
                  onChange={e => setCaseVal(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Escape') setEditingCase(false);
                    if (e.key === 'Enter' && e.ctrlKey) { onUpdateClient?.(c.id, { case: caseVal.trim() || c.case }); setEditingCase(false); }
                  }}
                  onBlur={() => { onUpdateClient?.(c.id, { case: caseVal.trim() || c.case }); setEditingCase(false); }}
                  rows={3}
                  style={{ marginTop: 6, width: '100%', padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(100,160,220,0.3)', background: 'rgba(100,160,220,0.05)', color: '#8a9fb5', fontSize: 11, outline: 'none', resize: 'none' }}
                />
              ) : (
                <div
                  onClick={() => { setCaseVal(c.case || ''); setEditingCase(true); }}
                  style={{ marginTop: 6, fontSize: 11, color: '#3d5570', cursor: 'pointer', lineHeight: 1.4 }}
                  title="Clique para editar"
                >
                  {c.case || 'Adicionar descrição do caso'}
                </div>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <button
              onClick={() => {
                const url = `${window.location.origin}/portal/${c.id}`;
                navigator.clipboard.writeText(url);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              style={{ background: copied ? 'rgba(16,185,129,0.1)' : 'rgba(100,160,220,0.06)', border: copied ? '1px solid rgba(16,185,129,0.3)' : '1px solid rgba(100,160,220,0.1)', borderRadius: 8, padding: 6, cursor: 'pointer', color: copied ? '#10b981' : '#8a9fb5', display: 'flex', transition: 'all 0.2s' }}
              title="Copiar link do Portal do Cliente"
            >
              <Share2 size={16} />
            </button>
            <button onClick={() => onDelete(c.id)} style={{ background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#fca5a5', display: 'flex' }} title="Excluir Dossier"><Trash2 size={16} /></button>
            <button onClick={onClose} style={{ background: 'rgba(100,160,220,0.06)', border: '1px solid rgba(100,160,220,0.1)', borderRadius: 8, padding: 6, cursor: 'pointer', color: '#8a9fb5', display: 'flex' }}><X size={16} /></button>
          </div>
        </div>
        
        {/* --- LAW SOVEREIGN v3.5: CONTROLES ESTRATÉGICOS --- */}
        {onUpdateClient && (
          <div style={{ display: 'flex', gap: 6, marginBottom: 14, flexWrap: 'wrap' }}>
            <button 
              onClick={() => onUpdateClient(c.id, { isPaperLead: !c.isPaperLead })}
              style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: c.isPaperLead ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(100,160,220,0.2)', background: c.isPaperLead ? 'rgba(168,85,247,0.12)' : 'rgba(100,160,220,0.04)', color: c.isPaperLead ? '#c084fc' : '#8a9fb5', fontSize: 9, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
            >
              <FileText size={12}/> {c.isPaperLead ? 'LEAD DIGITALIZADO' : 'MARCAR COMO PAPEL'}
            </button>
            {editingCost ? (
              <input
                autoFocus
                type="number"
                value={costVal}
                onChange={e => setCostVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { onUpdateClient!(c.id, { costOfWaiting: costVal ? parseFloat(costVal) : undefined }); setEditingCost(false); }
                  if (e.key === 'Escape') setEditingCost(false);
                }}
                onBlur={() => { onUpdateClient!(c.id, { costOfWaiting: costVal ? parseFloat(costVal) : undefined }); setEditingCost(false); }}
                placeholder="R$/mês"
                style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(239,68,68,0.5)', background: 'rgba(239,68,68,0.08)', color: '#fca5a5', fontSize: 11, fontWeight: 600, outline: 'none', minWidth: 0 }}
              />
            ) : (
              <button
                onClick={() => { setCostVal(c.costOfWaiting?.toString() || ''); setEditingCost(true); }}
                style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: c.costOfWaiting ? '1px solid rgba(239,68,68,0.4)' : '1px solid rgba(100,160,220,0.2)', background: c.costOfWaiting ? 'rgba(239,68,68,0.12)' : 'rgba(100,160,220,0.04)', color: c.costOfWaiting ? '#fca5a5' : '#8a9fb5', fontSize: 9, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                <Calculator size={12}/> {c.costOfWaiting ? `R$${c.costOfWaiting}/mês` : 'CUSTO DE ESPERAR'}
              </button>
            )}
            {editingChance ? (
              <input
                autoFocus
                type="number"
                min="0"
                max="100"
                value={chanceVal}
                onChange={e => setChanceVal(e.target.value)}
                onKeyDown={e => {
                  if (e.key === 'Enter') { onUpdateClient!(c.id, { chanceOfSuccess: chanceVal ? parseInt(chanceVal, 10) : undefined }); setEditingChance(false); }
                  if (e.key === 'Escape') setEditingChance(false);
                }}
                onBlur={() => { onUpdateClient!(c.id, { chanceOfSuccess: chanceVal ? parseInt(chanceVal, 10) : undefined }); setEditingChance(false); }}
                placeholder="0–100%"
                style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: '1px solid rgba(52,211,153,0.5)', background: 'rgba(52,211,153,0.08)', color: '#34d399', fontSize: 11, fontWeight: 600, outline: 'none', minWidth: 0 }}
              />
            ) : (
              <button
                onClick={() => { setChanceVal(c.chanceOfSuccess?.toString() || ''); setEditingChance(true); }}
                style={{ flex: 1, padding: '6px 8px', borderRadius: 6, border: c.chanceOfSuccess ? '1px solid rgba(52,211,153,0.4)' : '1px solid rgba(100,160,220,0.2)', background: c.chanceOfSuccess ? 'rgba(52,211,153,0.12)' : 'rgba(100,160,220,0.04)', color: c.chanceOfSuccess ? '#34d399' : '#8a9fb5', fontSize: 9, fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 4 }}
              >
                <Briefcase size={12}/> {c.chanceOfSuccess ? `${c.chanceOfSuccess}% ÊXITO` : 'RANKING DE ÊXITO'}
              </button>
            )}
          </div>
        )}

        {c.status === 'Evolução' && (
          <button onClick={() => onToggleEnc(c.id)} style={{ width: '100%', padding: '9px 16px', borderRadius: 8, border: c.isEncaminhado ? '1px solid rgba(168,85,247,0.4)' : '1px solid rgba(168,85,247,0.2)', background: c.isEncaminhado ? 'rgba(168,85,247,0.12)' : 'rgba(168,85,247,0.05)', color: '#c084fc', fontSize: 11, fontWeight: 600, textTransform: 'uppercase', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
            <Stethoscope size={14}/> {c.isEncaminhado ? 'Encerrar Intervenção' : 'Solicitar Especialista'}
          </button>
        )}
      </div>
      <div style={{ flex: 1, padding: '18px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
        {events.map((ev: TimelineEvent) => {
          const meta = EVENT_META[ev.type] || EVENT_META['Nota'];
          return (
            <div key={ev.id} style={{ display: 'flex', gap: 12 }}>
              <div style={{ width: 28, height: 28, borderRadius: 8, background: meta.bg, border: `1px solid ${meta.border}`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}><meta.icon size={13} color={meta.color} /></div>
              <div style={{ flex: 1, padding: '10px 12px', borderRadius: 8, background: 'rgba(12,21,32,0.8)', border: '1px solid rgba(100,160,220,0.07)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 9, marginBottom: 5 }}>
                  <span style={{ color: meta.color, fontWeight: 600 }}>{ev.type}</span>
                  <span style={{ color: '#3d5570' }}>{ev.date}</span>
                </div>
                <p style={{ fontSize: 12, color: '#8a9fb5', margin: 0 }}>{ev.content}</p>
                {ev.attachment && (
                  <div style={{ marginTop: 10, borderRadius: 8, overflow: 'hidden', border: '1px solid rgba(100,160,220,0.1)', background: 'rgba(0,0,0,0.2)' }}>
                    {ev.attachment.type.startsWith('image/') ? (
                      <img 
                        src={`data:${ev.attachment.type};base64,${ev.attachment.data}`} 
                        alt={ev.attachment.name}
                        style={{ width: '100%', height: 'auto', display: 'block', cursor: 'zoom-in' }}
                        onClick={() => {
                          const win = window.open();
                          win?.document.write(`<img src="data:${ev.attachment?.type};base64,${ev.attachment?.data}" style="max-width:100%">`);
                        }}
                      />
                    ) : (
                      <div style={{ padding: 12, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ fontSize: 10, color: '#8a9fb5', display: 'flex', alignItems: 'center', gap: 6 }}>
                          <Paperclip size={12} /> {ev.attachment.name}
                        </div>
                        <div style={{ display: 'flex', gap: 8 }}>
                          <button 
                            onClick={() => {
                              const blob = b64toBlob(ev.attachment!.data, ev.attachment!.type);
                              const url = URL.createObjectURL(blob);
                              const win = window.open(url, '_blank');
                              // Maelstrom: Revogando URL após abertura para liberar memória
                              if (win) {
                                win.onload = () => URL.revokeObjectURL(url);
                              }

                            }} 
                            style={{ fontSize: 9, color: '#60a5fa', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                          >
                            VISUALIZAR
                          </button>
                          <button 
                            onClick={() => openAttachment(ev.attachment!)} 
                            style={{ fontSize: 9, color: '#3d5570', background: 'none', border: 'none', cursor: 'pointer' }}
                          >
                            BAIXAR
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>
      <div style={{ padding: '12px 16px 16px', borderTop: '1px solid rgba(100,160,220,0.06)', background: '#06101a' }}>
        <textarea placeholder="Registrar evolução..." style={{ width: '100%', padding: '10px 12px', borderRadius: 8, background: 'rgba(10,21,32,0.8)', border: '1px solid rgba(100,160,220,0.08)', color: '#e8edf2', fontSize: 12, height: 68, outline: 'none', resize: 'none' }} value={newEvent} onChange={e => onEventChange(e.target.value)} />
        {pendingAttachment && <div style={{ fontSize: 10, color: '#10b981', marginTop: 5 }}>📎 {pendingAttachment.name} <button onClick={onClearAttachment} style={{ color: '#3d5570', background: 'none', border: 'none', cursor: 'pointer' }}>[X]</button></div>}
        <div style={{ display: 'flex', gap: 6, marginTop: 8 }}>
           <button onClick={() => fileInputRef.current?.click()} style={{ padding: '0 14px', height: 36, borderRadius: 8, border: '1px solid rgba(100,160,220,0.1)', background: 'rgba(100,160,220,0.04)', color: '#3d5570', cursor: 'pointer' }}><Paperclip size={14}/></button>
           <input ref={fileInputRef} type="file" style={{ display: 'none' }} onChange={e => e.target.files?.[0] && onAttachFile(e.target.files[0])} />
           <button 
             onClick={onAddEvent} 
             disabled={!newEvent.trim() && !pendingAttachment}
             style={{ 
               flex: 1, 
               height: 36, 
               borderRadius: 8, 
               background: 'rgba(200,169,110,0.1)', 
               color: '#c8a96e', 
               border: '1px solid rgba(200,169,110,0.25)', 
               fontWeight: 600, 
               fontSize: 10,
               cursor: (!newEvent.trim() && !pendingAttachment) ? 'not-allowed' : 'pointer',
               opacity: (!newEvent.trim() && !pendingAttachment) ? 0.5 : 1,
               transition: 'all 0.2s'
             }}
           >
             INCORPORAR REGISTRO
           </button>
        </div>
      </div>
    </aside>
  );
}
