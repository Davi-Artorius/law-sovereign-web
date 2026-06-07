import { useState, useEffect, useRef } from 'react';
import { Menu, X, ArrowRight, Check, Shield, Users, Zap, Lock, Eye } from 'lucide-react';

const COLORS = {
  gold: '#c9a227',
  navy: '#0a121e',
  darkBg: '#020507',
  cardBg: '#0f1823',
  text: '#e9edea',
  textMuted: '#8295ad',
  border: 'rgba(201, 162, 39, 0.15)',
};

const ScrollReveal = ({ children, delay = 0 }: { children: React.ReactNode; delay?: number }) => {
  const [isVisible, setIsVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setTimeout(() => setIsVisible(true), delay);
          observer.unobserve(entry.target);
        }
      },
      { threshold: 0.1 }
    );

    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, [delay]);

  return (
    <div
      ref={ref}
      style={{
        opacity: isVisible ? 1 : 0,
        transform: isVisible ? 'translateY(0)' : 'translateY(30px)',
        transition: 'opacity 0.7s ease-out, transform 0.7s ease-out',
      }}
    >
      {children}
    </div>
  );
};

export function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const scrollToSection = (id: string) => {
    const el = document.getElementById(id);
    el?.scrollIntoView({ behavior: 'smooth' });
    setMobileMenuOpen(false);
  };

  return (
    <div style={{
      background: COLORS.darkBg,
      color: COLORS.text,
      fontFamily: "'Inter', sans-serif",
      scrollBehavior: 'smooth',
    }}>
      <style>{`
        html {
          scroll-behavior: smooth !important;
          overflow-y: scroll !important;
        }
        body {
          scroll-behavior: smooth !important;
        }
        ::-webkit-scrollbar {
          width: 18px !important;
        }
        ::-webkit-scrollbar-track {
          background: ${COLORS.darkBg} !important;
        }
        ::-webkit-scrollbar-thumb {
          background: ${COLORS.gold} !important;
          border-radius: 10px !important;
          border: 3px solid ${COLORS.darkBg} !important;
        }
        ::-webkit-scrollbar-thumb:hover {
          background: #e6d5a8 !important;
        }
      `}</style>
      {/* NAV */}
      <nav style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        zIndex: 100,
        background: 'rgba(2, 5, 7, 0.85)',
        backdropFilter: 'blur(10px)',
        borderBottom: `1px solid ${COLORS.border}`,
      }}>
        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', fontFamily: "'Cormorant Garamond', Georgia, serif" }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              border: `2px solid ${COLORS.gold}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '22px',
              fontWeight: 'bold',
              color: COLORS.gold,
            }}>
              Ł
            </div>
            <div>
              <div style={{ fontSize: '14px', fontWeight: 700, letterSpacing: '0.05em' }}>LAW SOVEREIGN</div>
              <div style={{ fontSize: '9px', color: COLORS.textMuted, letterSpacing: '0.08em', marginTop: '-2px' }}>GESTÃO DE ELITE</div>
            </div>
          </div>

          {/* Links Desktop */}
          <div style={{
            display: 'flex',
            gap: '32px',
            listStyle: 'none'
          }} className="hidden md:flex">
            <button onClick={() => scrollToSection('features')} style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.gold)} onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.textMuted)}>
              Recursos
            </button>
            <button onClick={() => scrollToSection('mockup')} style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.gold)} onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.textMuted)}>
              Como Funciona
            </button>
            <button onClick={() => scrollToSection('faq')} style={{ background: 'none', border: 'none', color: COLORS.textMuted, cursor: 'pointer', fontSize: '14px', transition: 'color 0.2s' }} onMouseEnter={(e) => (e.currentTarget.style.color = COLORS.gold)} onMouseLeave={(e) => (e.currentTarget.style.color = COLORS.textMuted)}>
              FAQ
            </button>
          </div>

          {/* CTA + Mobile Menu */}
          <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
            <a href="mailto:daviambr2@gmail.com" style={{
              background: COLORS.gold,
              color: COLORS.navy,
              padding: '10px 24px',
              borderRadius: '8px',
              fontSize: '13px',
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = `0 8px 24px rgba(201, 162, 39, 0.4)`; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              Agendar Demo
            </a>
            <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} style={{ background: 'none', border: 'none', color: COLORS.gold, cursor: 'pointer', display: 'none', fontSize: '20px' }} className="md:hidden">
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>
      </nav>

      {/* HERO */}
      <section style={{
        paddingTop: '120px',
        paddingBottom: '80px',
        minHeight: '100vh',
        display: 'flex',
        alignItems: 'center',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Background Orb */}
        <div style={{
          position: 'absolute',
          top: '-200px',
          right: '-300px',
          width: '800px',
          height: '800px',
          borderRadius: '50%',
          background: `radial-gradient(ellipse, rgba(201, 162, 39, 0.08) 0%, transparent 70%)`,
          pointerEvents: 'none',
        }} />

        <div style={{
          maxWidth: '1200px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: '60px',
          alignItems: 'center',
          position: 'relative',
          zIndex: 2,
        }} className="md:grid-cols-1">
          {/* Left Content */}
          <div>
            {/* Badge */}
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '8px',
              background: `rgba(201, 162, 39, 0.08)`,
              border: `1px solid ${COLORS.border}`,
              color: COLORS.gold,
              padding: '8px 16px',
              borderRadius: '999px',
              fontSize: '11px',
              fontWeight: 600,
              letterSpacing: '0.08em',
              marginBottom: '28px',
              textTransform: 'uppercase',
            }}>
              <div style={{ width: '6px', height: '6px', background: COLORS.gold, borderRadius: '50%', boxShadow: `0 0 6px ${COLORS.gold}` }} />
              PARA ADVOGADOS ANALÓGICOS
            </div>

            {/* Headline */}
            <h1 style={{
              fontSize: 'clamp(2rem, 5vw, 3.5rem)',
              fontWeight: 700,
              marginBottom: '24px',
              lineHeight: 1.2,
              fontFamily: "'Cormorant Garamond', Georgia, serif",
            }}>
              Foto do papel <span style={{ color: COLORS.gold }}>→ ficha pronta</span>
            </h1>

            {/* Subheadline */}
            <p style={{
              fontSize: '16px',
              color: COLORS.textMuted,
              marginBottom: '40px',
              lineHeight: 1.7,
              maxWidth: '560px',
            }}>
              <strong style={{ color: COLORS.text }}>Enquanto você está em audiência, o cliente esfria. Enquanto você atende outro, o documento se perde.</strong> Grampeador inteligente digitaliza tudo via IA. Portal do cliente mostra progresso em tempo real. Seu escritório sai do papel em uma semana.
            </p>

            {/* CTAs */}
            <div style={{ display: 'flex', gap: '14px', marginBottom: '48px', flexWrap: 'wrap' }}>
              <a href="mailto:daviambr2@gmail.com" style={{
                background: `linear-gradient(135deg, ${COLORS.gold}, #e6d5a8)`,
                color: COLORS.navy,
                padding: '14px 36px',
                borderRadius: '8px',
                fontSize: '14px',
                fontWeight: 600,
                textDecoration: 'none',
                cursor: 'pointer',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                transition: 'transform 0.2s, box-shadow 0.2s',
              }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.boxShadow = `0 12px 32px rgba(201, 162, 39, 0.5)`; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
                Agendar Demo <ArrowRight size={16} />
              </a>
              <button onClick={() => scrollToSection('mockup')} style={{
                background: `rgba(201, 162, 39, 0.08)`,
                color: COLORS.gold,
                padding: '14px 36px',
                borderRadius: '8px',
                border: `1px solid ${COLORS.border}`,
                fontSize: '14px',
                fontWeight: 600,
                cursor: 'pointer',
                transition: 'background 0.2s',
              }} onMouseEnter={(e) => { e.currentTarget.style.background = `rgba(201, 162, 39, 0.15)`; }} onMouseLeave={(e) => { e.currentTarget.style.background = `rgba(201, 162, 39, 0.08)`; }}>
                Ver Produto
              </button>
            </div>

            {/* Badges */}
            <div style={{ display: 'flex', gap: '24px', flexWrap: 'wrap', fontSize: '13px', color: COLORS.textMuted }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} style={{ color: COLORS.gold }} /> Sem contrato de longa duração
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                <Check size={16} style={{ color: COLORS.gold }} /> Dados 100% seguros
              </div>
            </div>
          </div>

          {/* Right: Product Visual */}
          <div style={{
            background: `rgba(15, 24, 35, 0.6)`,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '16px',
            padding: '20px',
            backdropFilter: 'blur(10px)',
            display: 'none',
          }} className="md:block">
            <div style={{
              background: `linear-gradient(135deg, rgba(201, 162, 39, 0.1) 0%, rgba(201, 162, 39, 0.02) 100%)`,
              borderRadius: '8px',
              height: '400px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: COLORS.textMuted,
              fontSize: '14px',
              border: `1px dashed ${COLORS.border}`,
            }}>
              [Placeholder: Vídeo Loom aqui]
            </div>
          </div>
        </div>
      </section>

      {/* CASOS DE USO */}
      <ScrollReveal>
        <section style={{
          paddingTop: '80px',
          paddingBottom: '80px',
          background: `linear-gradient(180deg, transparent 0%, rgba(201, 162, 39, 0.05) 100%)`,
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
              <h2 style={{
                fontSize: '2.5rem',
                fontWeight: 700,
                marginBottom: '16px',
                fontFamily: "'Cormorant Garamond', Georgia, serif",
              }}>
                Veja na sua área
              </h2>
              <p style={{ color: COLORS.textMuted, fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
                Seu escritório tem essa dor? Veja como Law Sovereign resolve.
              </p>
            </div>

            {/* Casos Grid */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
              gap: '24px',
            }}>
              {[
                {
                  area: 'Trabalhista',
                  dor: 'Múltiplas rescisões em paralelo, papéis espalhados',
                  solucao: 'OCR digitaliza documentos. Cliente vê status no Portal.',
                  impacto: '+2-3 indicações/mês',
                },
                {
                  area: 'Família',
                  dor: 'Partilha de bens desorganizada, prazo crítico',
                  solucao: 'Timeline estruturada de cada bem. Cônjuge confirma online.',
                  impacto: '3-4 semanas mais rápido',
                },
                {
                  area: 'Criminal',
                  dor: 'Dossiê gigante, risco de perder prazo, cliente desesperado',
                  solucao: 'Tudo indexado. Cliente vê cada fase processual.',
                  impacto: 'Defesa 30% mais forte',
                },
                {
                  area: 'Tributário',
                  dor: 'Documentação fiscal caótica, cliente não sabe valor real',
                  solucao: 'OCR extrai valores. Cliente vê proposta claro no Portal.',
                  impacto: 'Fechamento na DEMO',
                },
                {
                  area: 'Imobiliário',
                  dor: 'Usucapião = anos. Cliente liga toda semana (cansativo)',
                  solucao: 'Timeline visual com cronograma. Cliente vê andamento.',
                  impacto: 'Cliente menos ansioso',
                },
                {
                  area: 'Previdenciário',
                  dor: 'Recurso INSS, cliente desesperado, tudo desorganizado',
                  solucao: 'Período contribuído claro. Cliente entende por que foi negado.',
                  impacto: 'Confiança em processo administrativo',
                },
              ].map((item, i) => (
                <div
                  key={i}
                  style={{
                    background: `rgba(15, 24, 35, 0.5)`,
                    border: `1px solid ${COLORS.border}`,
                    borderRadius: '12px',
                    padding: '28px',
                    transition: 'all 0.3s',
                    cursor: 'pointer',
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = `rgba(15, 24, 35, 0.8)`;
                    e.currentTarget.style.borderColor = COLORS.gold;
                    e.currentTarget.style.transform = 'translateY(-4px)';
                    e.currentTarget.style.boxShadow = `0 8px 32px rgba(201, 162, 39, 0.15)`;
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = `rgba(15, 24, 35, 0.5)`;
                    e.currentTarget.style.borderColor = COLORS.border;
                    e.currentTarget.style.transform = 'translateY(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                >
                  <h3 style={{ fontSize: '16px', fontWeight: 700, color: COLORS.gold, marginBottom: '12px' }}>
                    {item.area}
                  </h3>
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Dor:
                    </p>
                    <p style={{ fontSize: '14px', color: COLORS.text, lineHeight: 1.6 }}>
                      {item.dor}
                    </p>
                  </div>
                  <div style={{ marginBottom: '16px' }}>
                    <p style={{ fontSize: '12px', color: COLORS.textMuted, marginBottom: '8px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                      Solução:
                    </p>
                    <p style={{ fontSize: '14px', color: COLORS.gold, lineHeight: 1.6 }}>
                      {item.solucao}
                    </p>
                  </div>
                  <div style={{ paddingTop: '12px', borderTop: `1px solid ${COLORS.border}` }}>
                    <p style={{ fontSize: '12px', color: COLORS.gold, fontWeight: 600 }}>
                      📈 {item.impacto}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      </ScrollReveal>

      {/* FEATURES */}
      <ScrollReveal>
        <section id="features" style={{
          paddingTop: '80px',
          paddingBottom: '80px',
          background: `linear-gradient(180deg, rgba(201, 162, 39, 0.03) 0%, transparent 100%)`,
        }}>
          <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
            <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              marginBottom: '16px',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
            }}>
              Tudo que você precisa
            </h2>
            <p style={{ color: COLORS.textMuted, fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
              Eliminamos o papel, criamos o fluxo, blindamos os dados.
            </p>
          </div>

          {/* Grid de Features */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '24px',
          }}>
            {[
              { icon: Zap, title: 'Grampeador Inteligente', desc: 'Foto do papel → ficha preenchida em segundos via IA' },
              { icon: Eye, title: 'Portal do Cliente', desc: 'Cliente vê status do caso, documentos e cronograma em tempo real' },
              { icon: Users, title: 'Captura de Leads', desc: 'Widget no site do escritório captura contatos automaticamente' },
              { icon: Check, title: 'Timeline Completa', desc: 'Histórico visual de tudo: documentos, notas, ações, prazos' },
              { icon: Shield, title: 'Segurança Jurídica', desc: 'Dados 100% seguros. Sem nuvem estrangeira. LGPD nativo' },
              { icon: Lock, title: 'Zero Setup Técnico', desc: 'Funciona do navegador. Nenhuma instalação, sem TI envolvido' },
            ].map((feature, i) => (
              <div
                key={i}
                style={{
                  background: `rgba(15, 24, 35, 0.5)`,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '12px',
                  padding: '28px',
                  backdropFilter: 'blur(8px)',
                  transition: 'all 0.3s',
                  cursor: 'pointer',
                }}
                onMouseEnter={(e) => {
                  const el = e.currentTarget;
                  el.style.background = `rgba(15, 24, 35, 0.8)`;
                  el.style.borderColor = COLORS.gold;
                  el.style.transform = 'translateY(-4px)';
                  el.style.boxShadow = `0 8px 32px rgba(201, 162, 39, 0.15)`;
                }}
                onMouseLeave={(e) => {
                  const el = e.currentTarget;
                  el.style.background = `rgba(15, 24, 35, 0.5)`;
                  el.style.borderColor = COLORS.border;
                  el.style.transform = 'translateY(0)';
                  el.style.boxShadow = 'none';
                }}
              >
                <div style={{
                  width: '48px',
                  height: '48px',
                  background: `rgba(201, 162, 39, 0.15)`,
                  border: `1px solid ${COLORS.border}`,
                  borderRadius: '8px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  marginBottom: '16px',
                }}>
                  <feature.icon size={24} style={{ color: COLORS.gold }} />
                </div>
                <h3 style={{ fontSize: '16px', fontWeight: 600, marginBottom: '8px' }}>{feature.title}</h3>
                <p style={{ fontSize: '14px', color: COLORS.textMuted, lineHeight: 1.6 }}>{feature.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* MOCKUP */}
      <ScrollReveal delay={100}>
        <section id="mockup" style={{
        paddingTop: '80px',
        paddingBottom: '80px',
        background: COLORS.darkBg,
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              marginBottom: '16px',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
            }}>
              Veja na Prática
            </h2>
            <p style={{ color: COLORS.textMuted, fontSize: '16px', maxWidth: '600px', margin: '0 auto' }}>
              Dashboard operacional. Dossiês completos. Tudo seguro.
            </p>
          </div>

          {/* Mockups */}
          <div style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '60px',
            marginTop: '60px',
          }}>
            <div style={{
              background: `rgba(15, 24, 35, 0.4)`,
              border: `2px solid ${COLORS.border}`,
              borderRadius: '20px',
              overflow: 'hidden',
              minHeight: '900px',
              boxShadow: `0 32px 96px rgba(201, 162, 39, 0.15)`,
            }}>
              <img
                src="/mockups/dashboard.png"
                alt="Dashboard Law Sovereign"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
            <div style={{
              background: `rgba(15, 24, 35, 0.4)`,
              border: `2px solid ${COLORS.border}`,
              borderRadius: '20px',
              overflow: 'hidden',
              minHeight: '900px',
              boxShadow: `0 32px 96px rgba(201, 162, 39, 0.15)`,
            }}>
              <img
                src="/mockups/triagem.png"
                alt="Triagem Law Sovereign"
                style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }}
              />
            </div>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* TESTIMONIAL */}
      <ScrollReveal delay={100}>
        <section style={{
        paddingTop: '80px',
        paddingBottom: '80px',
        background: `linear-gradient(180deg, rgba(201, 162, 39, 0.05) 0%, transparent 100%)`,
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px', textAlign: 'center' }}>
          <div style={{
            background: `rgba(15, 24, 35, 0.6)`,
            border: `1px solid ${COLORS.border}`,
            borderRadius: '16px',
            padding: '40px',
            backdropFilter: 'blur(8px)',
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              background: `linear-gradient(135deg, ${COLORS.gold}, #e6d5a8)`,
              borderRadius: '50%',
              margin: '0 auto 24px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '32px',
              fontWeight: 700,
              color: COLORS.navy,
            }}>
              JC
            </div>
            <p style={{
              fontSize: '18px',
              lineHeight: 1.7,
              marginBottom: '24px',
              color: COLORS.text,
              fontStyle: 'italic',
            }}>
              "Saí 100% do papel em uma semana. Meus clientes veem o status dos casos agora. Deixei de perder documento. Isso tem valor."
            </p>
            <p style={{ fontSize: '14px', fontWeight: 600, color: COLORS.gold }}>
              Junior Costa
            </p>
            <p style={{ fontSize: '12px', color: COLORS.textMuted }}>
              Advogado, Brasília — Cliente desde Junho de 2026
            </p>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* FAQ */}
      <ScrollReveal delay={100}>
        <section id="faq" style={{
        paddingTop: '80px',
        paddingBottom: '80px',
        background: COLORS.darkBg,
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
          <div style={{ textAlign: 'center', marginBottom: '60px' }}>
            <h2 style={{
              fontSize: '2.5rem',
              fontWeight: 700,
              marginBottom: '16px',
              fontFamily: "'Cormorant Garamond', Georgia, serif",
            }}>
              Dúvidas Comuns
            </h2>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            {[
              {
                q: 'Enquanto estou em audiência, o cliente esfria. Como isso ajuda?',
                a: 'Você entra com a ficha completa: processo digitalizado, timeline de tudo que foi feito, próximos passos documentados. Não é achismo, é fato. Cliente vê no Portal que está tudo sob controle. Menos ligações, menos fricção, mais confiança.'
              },
              {
                q: 'E se eu perder um documento de papel?',
                a: 'Não perde. Tira foto → IA lê → salva no dossiê digital. Histórico completo na timeline. Você acessa de qualquer lugar, qualquer hora. E o cliente também pode acompanhar pelo Portal.'
              },
              {
                q: 'Meus dados ficam seguros? Vocês respeitam LGPD?',
                a: 'Totalmente. Dados 100% brasileiros, criptografados, sem nuvem estrangeira. LGPD nativo, OAB compliance. Zero dados compartilhados com terceiros. Você é quem comanda.'
              },
              {
                q: 'Preciso de técnico para configurar?',
                a: 'Não. Zero. Onboarding é 1 call nosso com você — a gente explica, você aprova, pronto. Roda no navegador. Você não mexe em código.'
              },
              {
                q: 'Funciona com qualquer tipo de caso?',
                a: 'Sim. Civil, trabalhista, família, criminal — qualquer área. OCR funciona com qualquer documento. Portal mostra progresso de qualquer processo.'
              },
            ].map((item, i) => (
              <FAQItem key={i} question={item.q} answer={item.a} />
            ))}
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* CTA FINAL */}
      <ScrollReveal delay={100}>
        <section style={{
        paddingTop: '80px',
        paddingBottom: '80px',
        background: `linear-gradient(135deg, rgba(201, 162, 39, 0.1) 0%, rgba(10, 18, 30, 0.8) 100%)`,
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '800px', margin: '0 auto', padding: '0 24px' }}>
          <h2 style={{
            fontSize: '2.5rem',
            fontWeight: 700,
            marginBottom: '24px',
            fontFamily: "'Cormorant Garamond', Georgia, serif",
          }}>
            Pronto para sair do papel?
          </h2>
          <p style={{
            fontSize: '16px',
            color: COLORS.textMuted,
            marginBottom: '40px',
            lineHeight: 1.7,
          }}>
            Agende uma conversa de 15 minutos. Você faz as perguntas. A gente combina os próximos passos.
          </p>
          <div style={{ display: 'flex', gap: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
            <a href="https://wa.me/61992126505" target="_blank" rel="noopener noreferrer" style={{
              background: `linear-gradient(135deg, ${COLORS.gold}, #e6d5a8)`,
              color: COLORS.navy,
              padding: '16px 48px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
              display: 'inline-block',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 40px rgba(201, 162, 39, 0.6)`; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              💬 WhatsApp
            </a>
            <a href="mailto:daviambr2@gmail.com" style={{
              background: `linear-gradient(135deg, ${COLORS.gold}, #e6d5a8)`,
              color: COLORS.navy,
              padding: '16px 48px',
              borderRadius: '8px',
              fontSize: '16px',
              fontWeight: 600,
              textDecoration: 'none',
              cursor: 'pointer',
              display: 'inline-block',
              transition: 'transform 0.2s, box-shadow 0.2s',
            }} onMouseEnter={(e) => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = `0 16px 40px rgba(201, 162, 39, 0.6)`; }} onMouseLeave={(e) => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'none'; }}>
              📧 Email
            </a>
          </div>
        </div>
      </section>
      </ScrollReveal>

      {/* FOOTER */}
      <footer style={{
        borderTop: `1px solid ${COLORS.border}`,
        paddingTop: '40px',
        paddingBottom: '40px',
        background: COLORS.darkBg,
        color: COLORS.textMuted,
        fontSize: '12px',
        textAlign: 'center',
      }}>
        <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 24px' }}>
          <p>© 2026 Law Sovereign. Todos os direitos reservados. Brasília, DF.</p>
          <p style={{ marginTop: '8px' }}>
            Contato: <a href="mailto:daviambr2@gmail.com" style={{ color: COLORS.gold, textDecoration: 'none' }}>daviambr2@gmail.com</a>
          </p>
        </div>
      </footer>
    </div>
  );
}

function FAQItem({ question, answer }: { question: string; answer: string }) {
  const [open, setOpen] = useState(false);
  return (
    <div style={{
      background: `rgba(15, 24, 35, 0.5)`,
      border: `1px solid ${COLORS.border}`,
      borderRadius: '8px',
      overflow: 'hidden',
      transition: 'all 0.3s',
    }} onMouseEnter={(e) => { e.currentTarget.style.borderColor = COLORS.gold; }} onMouseLeave={(e) => { e.currentTarget.style.borderColor = COLORS.border; }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          width: '100%',
          padding: '20px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          background: 'none',
          border: 'none',
          color: COLORS.text,
          fontSize: '15px',
          fontWeight: 600,
          cursor: 'pointer',
          textAlign: 'left',
        }}
      >
        {question}
        <span style={{
          color: COLORS.gold,
          transition: 'transform 0.3s',
          transform: open ? 'rotate(180deg)' : 'rotate(0deg)',
          display: 'inline-block',
        }}>
          ▼
        </span>
      </button>
      {open && (
        <div style={{
          padding: '0 20px 20px 20px',
          borderTop: `1px solid ${COLORS.border}`,
          color: COLORS.textMuted,
          fontSize: '14px',
          lineHeight: 1.6,
        }}>
          {answer}
        </div>
      )}
    </div>
  );
}
