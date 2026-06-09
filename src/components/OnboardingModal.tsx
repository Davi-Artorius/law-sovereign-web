import { useState } from 'react';
import { ChevronRight, X, CheckCircle } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onComplete: () => void;
}

export function OnboardingModal({ isOpen, onComplete }: OnboardingModalProps) {
  const [step, setStep] = useState(0);

  const steps = [
    {
      title: '👋 Bem-vindo ao Law Sovereign',
      description: 'Sua central para gerenciar leads jurídicos e fechar contatos.',
      highlight: 'Vamos aprender o básico em 3 passos.'
    },
    {
      title: '📋 Crie um Dossiê',
      description: 'Clique no botão "Novo Dossiê" para adicionar um novo cliente à sua carteira.',
      highlight: 'Nome, área de atuação e descrição do caso.'
    },
    {
      title: '⚡ Acompanhe a Timeline',
      description: 'Registre anotações, anexe documentos e marque eventos importantes no dossiê.',
      highlight: 'Tudo fica salvo automaticamente no banco de dados.'
    },
    {
      title: '🎯 Pronto para começar!',
      description: 'Você agora tem tudo que precisa para gerenciar seus leads com maestria.',
      highlight: 'Boa sorte na sua próxima venda! 💪'
    }
  ];

  if (!isOpen) return null;

  const current = steps[step];
  const isLastStep = step === steps.length - 1;

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      background: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        background: '#0e1827',
        border: '1px solid rgba(120,160,210,0.15)',
        borderRadius: 20,
        padding: 48,
        maxWidth: 500,
        width: '90%',
        position: 'relative'
      }}>
        {/* Close button */}
        <button
          onClick={onComplete}
          style={{
            position: 'absolute',
            top: 16,
            right: 16,
            background: 'transparent',
            border: 'none',
            color: '#8295ad',
            cursor: 'pointer',
            padding: 8
          }}
          onMouseEnter={e => (e.currentTarget.style.color = '#eef2f7')}
          onMouseLeave={e => (e.currentTarget.style.color = '#8295ad')}
        >
          <X size={24} />
        </button>

        {/* Content */}
        <div style={{ textAlign: 'center', marginBottom: 32 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>
            {current.title.split(' ')[0]}
          </div>
          <h2 style={{ fontSize: 24, fontWeight: 600, color: '#eef2f7', marginBottom: 12 }}>
            {current.title.substring(current.title.indexOf(' ') + 1)}
          </h2>
          <p style={{ fontSize: 14, color: '#aebcce', marginBottom: 16, lineHeight: 1.6 }}>
            {current.description}
          </p>
          <div style={{
            background: 'rgba(59,130,246,0.1)',
            border: '1px solid rgba(59,130,246,0.25)',
            borderRadius: 12,
            padding: 16,
            fontSize: 13,
            color: '#60a5fa',
            fontWeight: 500
          }}>
            {current.highlight}
          </div>
        </div>

        {/* Progress dots */}
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          gap: 8,
          marginBottom: 32
        }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: 8,
                height: 8,
                borderRadius: '50%',
                background: i === step ? '#60a5fa' : 'rgba(120,160,210,0.2)',
                cursor: 'pointer'
              }}
              onClick={() => setStep(i)}
            />
          ))}
        </div>

        {/* Buttons */}
        <div style={{ display: 'flex', gap: 12 }}>
          <button
            onClick={() => setStep(Math.max(0, step - 1))}
            disabled={step === 0}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: 'transparent',
              border: '1px solid rgba(120,160,210,0.15)',
              color: step === 0 ? '#4a5f7d' : '#aebcce',
              borderRadius: 12,
              cursor: step === 0 ? 'not-allowed' : 'pointer',
              fontSize: 14,
              fontWeight: 500,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              if (step > 0) {
                (e.currentTarget as any).style.borderColor = 'rgba(120,160,210,0.4)';
              }
            }}
            onMouseLeave={e => {
              (e.currentTarget as any).style.borderColor = 'rgba(120,160,210,0.15)';
            }}
          >
            Voltar
          </button>
          <button
            onClick={() => {
              if (isLastStep) {
                onComplete();
              } else {
                setStep(step + 1);
              }
            }}
            style={{
              flex: 1,
              padding: '12px 16px',
              background: '#60a5fa',
              border: 'none',
              color: '#fff',
              borderRadius: 12,
              cursor: 'pointer',
              fontSize: 14,
              fontWeight: 600,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              transition: 'all 0.2s'
            }}
            onMouseEnter={e => {
              (e.currentTarget as any).style.background = '#3b82f6';
            }}
            onMouseLeave={e => {
              (e.currentTarget as any).style.background = '#60a5fa';
            }}
          >
            {isLastStep ? (
              <>
                <CheckCircle size={18} />
                Começar
              </>
            ) : (
              <>
                Próximo
                <ChevronRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
