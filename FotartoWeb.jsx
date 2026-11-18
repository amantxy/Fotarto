import React, { useState, useEffect, useRef, Suspense, lazy } from 'react';
import { Camera, Aperture, Send, MapPin, Phone, Mail, Users } from 'lucide-react';

// El simulador 3D se descarga solo cuando se abre su pestaña (la web inicial sigue siendo ligera)
const TuEstudio = lazy(() => import('./TuEstudio.jsx'));
const FunkoPagina = lazy(() => import('./FunkoPagina.jsx'));
import { AGENDA_INICIAL, AgendaPapel, ProcesoDigital, SalasAntes, EjemploReal } from './Transformacion.jsx';

export default function FotartoWeb() {
  const [activeTab, setActiveTab] = useState('Fotarto');
  // Altura real de la cabecera fija (la usa el visor de «Tu estudio» para quedarse justo debajo)
  const cabeceraRef = useRef(null);
  useEffect(() => {
    const h = cabeceraRef.current;
    if (!h) return;
    const ro = new ResizeObserver(() => document.documentElement.style.setProperty('--alto-cabecera', `${h.offsetHeight}px`));
    ro.observe(h);
    return () => ro.disconnect();
  }, []);

  // Agenda de papel compartida entre «De dónde venimos» y «A dónde vamos» (se guarda en el navegador)
  const [agenda, setAgendaBase] = useState(() => {
    try { const g = JSON.parse(localStorage.getItem('fotarto-agenda')); if (g && Array.isArray(g.reservas)) return g; } catch (e) { /* sin almacenamiento */ }
    return AGENDA_INICIAL;
  });
  const setAgenda = (f) => setAgendaBase((a) => {
    const n = typeof f === 'function' ? f(a) : f;
    try { localStorage.setItem('fotarto-agenda', JSON.stringify(n)); } catch (e) { /* sin almacenamiento */ }
    return n;
  });
  const [ejecucion, setEjecucion] = useState(0);
  const irA = (tab) => { setActiveTab(tab); window.scrollTo({ top: 0, behavior: 'smooth' }); };

  // Portada de entrada: 'visible' -> 'saliendo' (animación) -> 'oculta'
  const [intro, setIntro] = useState('visible');

  const entrar = () => {
    if (intro !== 'visible') return;
    setIntro('saliendo');
    setTimeout(() => setIntro('oculta'), 1000);
  };

  const tabs = [
    'Fotarto',
    'De dónde venimos',
    'A dónde vamos',
    'Nuestro Estudio',
    'Tu estudio',
    'Tu Funko 3D',
    'Tarifas',
    'Contacto'
  ];

  // Datos para las tarifas
  const tarifas = [
    { id: 1, title: 'Tu Funko en 3D', price: '49,99€', desc: 'Oferta de lanzamiento. Modelado 3D + Impresión en resina premium.' },
    { id: 2, title: 'Pack Comunión/Bautizo', price: 'desde 199€', desc: 'Sesión en Sala Premium BBC + Álbum Digital maquetado.' },
    { id: 3, title: 'Pack Boda "Cine" 4K', price: 'desde 899€', desc: 'Cobertura total del evento + Reportaje cinematográfico.' },
    { id: 4, title: 'Sala Multiusos', price: '30€ / hora', desc: 'Ciclorama blanco, raíles de techo, ventanas de luz natural.' },
    { id: 5, title: 'Sala Cine de Acción', price: '45€ / hora', desc: 'Black box, iluminación LED RGB, máquinas de humo y atrezo.' },
    { id: 6, title: 'Bono Creativo (10h)', price: '250€', desc: '10 horas de estudio a tu disposición. Ahorra un 15%.' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#FFFFFF] font-montserrat flex flex-col">
      {/* Inyección de fuentes y estilos globales para asegurar que carguen siempre */}
      <style dangerouslySetInnerHTML={{__html: `
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-montserrat { font-family: 'Montserrat', sans-serif; }
        .glow-text { text-shadow: 0 0 15px rgba(0,229,255,0.6); }
        .glow-box { box-shadow: 0 0 15px rgba(0,229,255,0.2); }
        .no-scrollbar { scrollbar-width: none; }
        .no-scrollbar::-webkit-scrollbar { display: none; }

        /* Portada tipo Netflix */
        /* Solo se animan transform y opacity: la tarjeta gráfica lo mueve sin recalcular la página (fluido en móvil) */
        @keyframes introGiro { to { transform: rotate(360deg); } }
        @keyframes introAparece { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        @keyframes introLatido { 0%,100% { opacity: 0.45; transform: scale(0.9); } 50% { opacity: 1; transform: scale(1.1); } }
        @keyframes introParpadeo { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }
        @keyframes introZoom { 0% { transform: scale(1); opacity: 1; } 100% { transform: scale(5); opacity: 0; } }
        @keyframes introFondo { 0%,35% { opacity: 1; } 100% { opacity: 0; } }
        @keyframes introFlash { 0% { opacity: 0; } 8% { opacity: 1; } 25% { opacity: 0.85; } 100% { opacity: 0; } }
        .intro-contenido { animation: introAparece 1.2s ease-out both; will-change: transform, opacity; backface-visibility: hidden; }
        .intro-logo { animation: introGiro 3s linear infinite; will-change: transform; }
        .intro-halo { position: absolute; inset: -35%; border-radius: 9999px; pointer-events: none;
          background: radial-gradient(circle, rgba(0,229,255,0.55) 0%, rgba(0,229,255,0) 65%);
          animation: introLatido 2.4s ease-in-out infinite; will-change: transform, opacity; }
        .intro-pista { animation: introParpadeo 2s ease-in-out infinite; will-change: opacity; }
        .intro-saliendo { animation: introFondo 1s ease-in forwards; will-change: opacity; }
        .intro-saliendo .intro-contenido { animation: introZoom 1s cubic-bezier(.5,0,.75,0) forwards; }
        .intro-saliendo .intro-pista { display: none; }
        /* Flash de cámara al entrar */
        .intro-flash { position: absolute; inset: 0; pointer-events: none; opacity: 0; z-index: 5;
          will-change: opacity; transform: translateZ(0);
          background: radial-gradient(circle at center, #FFFFFF 0%, #FFFFFF 25%, #E6FDFF 45%, rgba(0,229,255,0.6) 70%, rgba(0,229,255,0.15) 100%); }
        .intro-saliendo .intro-flash { animation: introFlash 0.8s ease-out forwards; }
        @media (prefers-reduced-motion: reduce) {
          .intro-logo, .intro-halo, .intro-pista { animation: none; }
          .intro-saliendo .intro-contenido { animation: introFondo 0.6s ease-in forwards; }
        }
      `}} />

      {/* PORTADA DE ENTRADA */}
      {intro !== 'oculta' && (
        <button
          type="button"
          onClick={entrar}
          aria-label="Entrar en la web de Fotarto"
          className={`fixed inset-0 z-[100] w-full h-full bg-[#0B0C10] flex flex-col items-center justify-center cursor-pointer select-none focus:outline-none ${intro === 'saliendo' ? 'intro-saliendo' : ''}`}
          style={{ background: 'radial-gradient(circle at center, #10232b 0%, #0B0C10 65%)' }}
        >
          <div className="intro-contenido flex flex-col items-center">
            <div className="relative">
              <span className="intro-halo" aria-hidden="true" />
              <Aperture className="intro-logo relative w-40 h-40 md:w-56 md:h-56 text-[#00E5FF]" strokeWidth={1.5} />
            </div>
            <span className="mt-8 text-5xl md:text-7xl font-playfair font-bold tracking-[0.3em] uppercase glow-text text-white pl-[0.3em]">
              Fotarto
            </span>
          </div>
          <span className="intro-flash" aria-hidden="true" />
          <span className="intro-pista absolute bottom-16 text-sm md:text-base tracking-[0.4em] uppercase text-[#8D93AB]">
            Toca para entrar
          </span>
        </button>
      )}

      {/* HEADER & NAVEGACIÓN */}
      <header ref={cabeceraRef} className="pt-4 pb-3 md:pt-12 md:pb-6 px-4 border-b border-[#8D93AB]/30 bg-[#0B0C10] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          {/* Logo */}
          <div className="flex items-center gap-2 md:gap-3 mb-3 md:mb-6 cursor-pointer" onClick={() => setActiveTab('Fotarto')}>
            <Aperture className="w-8 h-8 md:w-12 md:h-12 text-[#00E5FF] animate-[spin_10s_linear_infinite]" />
            <h1 className="text-3xl md:text-6xl font-playfair font-bold tracking-[0.2em] uppercase glow-text">
              Fotarto
            </h1>
          </div>
          
          {/* Tabs */}
          <nav className="no-scrollbar flex lg:justify-center gap-2 lg:gap-1.5 xl:gap-3 w-full lg:w-auto overflow-x-auto lg:overflow-visible px-1 py-1">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={(e) => {
                  setActiveTab(tab);
                  e.currentTarget.scrollIntoView({ behavior: 'smooth', block: 'nearest', inline: 'center' });
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className={`shrink-0 whitespace-nowrap px-3 py-1.5 md:py-2 xl:px-4 text-sm xl:text-base font-semibold transition-all duration-300 rounded-full border 
                  ${activeTab === tab 
                    ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF] glow-box' 
                    : 'border-transparent text-[#8D93AB] hover:text-white hover:border-[#8D93AB]/50'
                  }`}
              >
                {tab}
              </button>
            ))}
          </nav>
        </div>
      </header>

      {/* CONTENIDO PRINCIPAL */}
      <main className="flex-grow max-w-6xl mx-auto w-full p-6 md:p-12">
        
        {/* --- SECCIÓN: FOTARTO --- */}
        {activeTab === 'Fotarto' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            {/* Banner de novedad: lleva a la pestaña del Funko */}
            <button type="button" onClick={() => irA('Tu Funko 3D')} aria-label="Novedad: ahora tu Funko personalizado por solo 49,99 €. Ver Tu Funko 3D"
              className="group relative w-full mb-12 overflow-hidden rounded-2xl border-2 border-[#00E5FF] glow-box text-left transition-transform hover:-translate-y-0.5"
              style={{ background: 'linear-gradient(110deg, #00E5FF 0%, #00A5BD 38%, #0E2A33 70%, #0B0C10 100%)' }}>
              <div className="absolute -right-10 -top-16 w-72 h-72 rounded-full bg-[#00E5FF]/20 blur-2xl pointer-events-none" />
              <div className="relative flex items-center gap-4 sm:gap-8 p-5 sm:p-7 pr-2">
                <div className="flex-1 min-w-0">
                  <span className="inline-block px-3 py-1 mb-3 rounded-full bg-[#0B0C10] text-[#00E5FF] text-xs sm:text-sm font-extrabold tracking-[0.2em] animate-pulse">¡NOVEDAD!</span>
                  <p className="font-playfair font-bold text-[#0B0C10] text-2xl sm:text-4xl leading-tight uppercase">
                    Ahora tu Funko personalizado<br className="hidden sm:block" /> por solo <span className="whitespace-nowrap text-white [text-shadow:0_2px_12px_rgba(0,0,0,0.45)]">49,99 €</span>
                  </p>
                  <span className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-[#0B0C10] text-white text-sm font-bold group-hover:bg-white group-hover:text-[#0B0C10] transition-colors">
                    Descúbrelo <span aria-hidden="true">→</span>
                  </span>
                </div>
                <img src="assets/img/funko-ejemplo.png" alt="" className="w-24 sm:w-32 md:w-36 shrink-0 drop-shadow-[0_10px_25px_rgba(0,0,0,0.6)] transition-transform duration-500 group-hover:scale-105 group-hover:-rotate-3" />
              </div>
            </button>

            <h2 className="text-4xl md:text-5xl font-playfair font-bold text-[#00E5FF] mb-4">¿Qué es Fotarto?</h2>
            <div className="border-l-4 border-[#00E5FF] pl-6 py-2 mb-8 bg-gradient-to-r from-[#00E5FF]/10 to-transparent">
              <p className="text-xl md:text-2xl font-playfair italic text-white">
                "Estudio de Fotografía en Esperanto, un idioma mezcla de varios idiomas que une también lenguas antiguas como el latín y las une a lenguas actuales."
              </p>
            </div>
            <div className="text-lg text-[#8D93AB] space-y-6 leading-relaxed max-w-4xl">
              <p>
                Bienvenidos a Fotarto, un espacio donde la tradición del cuarto oscuro se abraza con la innovación tecnológica del siglo XXI. Somos un estudio moderno y polivalente, diseñado para dar respuesta a cualquier necesidad visual, desde el retrato más clásico hasta el modelado tridimensional.
              </p>
              <p>
                Nuestras instalaciones albergan áreas especializadas en fotografía, meticulosos procesos de restauración digital y nuestro servicio estrella y exclusivo: <strong className="text-[#00E5FF]">"Tu Funko en 3D"</strong>, donde te transformamos en una figura de resina totalmente personalizada y lista para decorar tu estantería.
              </p>
            </div>
 
            <div className="mt-14">
              <img 
                src="assets/img/logo-fotarto.jpg" 
                alt="Logotipo de Fotarto: cámara con diafragma turquesa y la letra f" 
                className="w-full max-w-3xl mx-auto block rounded-xl border-2 border-[#00E5FF] glow-box"
              />
            </div>
          </section>
        )}

        {/* --- SECCIÓN: DE DONDE VENIMOS --- */}
        {activeTab === 'De dónde venimos' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-14">
            <div>
              <h2 className="text-4xl md:text-5xl font-playfair font-bold text-[#00E5FF] mb-6">Nuestros Orígenes</h2>
              <div className="text-lg text-[#8D93AB] space-y-4 leading-relaxed max-w-4xl">
                <p>
                  Toda gran transformación tiene un punto de partida. En nuestra <strong className="text-white">«Empresa 0.0»</strong>, Fotarto era un estudio tradicional y lleno de talento, pero lastrado por procesos analógicos que frenaban nuestro potencial.
                </p>
                <p>Disponíamos de tres fantásticas salas físicas. Así funcionaban antes:</p>
              </div>
            </div>

            <SalasAntes />

            <div>
              <h3 className="text-3xl font-playfair font-bold text-white mb-3">La agenda de papel</h3>
              <p className="text-lg text-[#8D93AB] mb-8 max-w-4xl leading-relaxed">
                Nuestro día a día era un caos de <strong className="text-white">agendas de papel</strong>, lo que provocaba solapamientos de reservas, material fotográfico perdido y un control de stock (resina y papel) que se hacía «a ojo». Esta era una semana cualquiera. <strong className="text-[#00E5FF]">Pruébala:</strong> apunta, cambia o borra reservas como lo hacíamos entonces.
              </p>
              <AgendaPapel agenda={agenda} setAgenda={setAgenda} onDigitalizar={() => { setEjecucion((n) => n + 1); irA('A dónde vamos'); }} />
            </div>
          </section>
        )}

        {/* --- SECCIÓN: A DONDE VAMOS --- */}
        {activeTab === 'A dónde vamos' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-playfair font-bold text-[#00E5FF] mb-8">Transformación Digital</h2>
            <div className="text-lg text-[#8D93AB] mb-12 max-w-4xl">
              <p>
                Dejamos atrás el papel para dar un salto hacia el futuro. Nuestro nuevo plan de digitalización integral interconecta todos los procesos del estudio, garantizando que el talento de nuestro equipo no se pierda en labores administrativas.
              </p>
            </div>
            
            <div className="grid md:grid-cols-3 gap-6">
              <div className="p-6 border border-[#8D93AB]/30 rounded-lg bg-[#151720] hover:border-[#00E5FF] transition-colors group">
                <Camera className="w-12 h-12 text-[#8D93AB] group-hover:text-[#00E5FF] mb-4 transition-colors" />
                <h3 className="text-xl font-bold text-white mb-2">Cloud ERP & Reservas</h3>
                <p className="text-[#8D93AB] text-sm">
                  Se acabaron los solapamientos. Un sistema en la nube con reservas online en tiempo real para nuestras 3 salas. El cliente decide, el sistema organiza.
                </p>
              </div>
              <div className="p-6 border border-[#8D93AB]/30 rounded-lg bg-[#151720] hover:border-[#00E5FF] transition-colors group">
                <Aperture className="w-12 h-12 text-[#8D93AB] group-hover:text-[#00E5FF] mb-4 transition-colors" />
                <h3 className="text-xl font-bold text-white mb-2">Control Kanban 3D</h3>
                <p className="text-[#8D93AB] text-sm">
                  Seguimiento visual (Pendiente / En Curso / Terminado) para los encargos de Funkos 3D y restauraciones, con control de stock digital para que nunca falte resina.
                </p>
              </div>
              <div className="p-6 border border-[#8D93AB]/30 rounded-lg bg-[#151720] hover:border-[#00E5FF] transition-colors group">
                <Send className="w-12 h-12 text-[#8D93AB] group-hover:text-[#00E5FF] mb-4 transition-colors" />
                <h3 className="text-xl font-bold text-white mb-2">Avisos Automatizados</h3>
                <p className="text-[#8D93AB] text-sm">
                  Cuando tu Funko o tus fotos están listas, el sistema te envía automáticamente un WhatsApp. Adiós a las llamadas telefónicas no contestadas.
                </p>
              </div>
            </div>

            <div id="proceso" className="mt-16 scroll-mt-[calc(var(--alto-cabecera,120px)+16px)]">
              <ProcesoDigital agenda={agenda} ejecucion={ejecucion} onVolver={() => irA('De dónde venimos')} />
            </div>

            <div className="mt-16">
              <EjemploReal setAgenda={setAgenda} onProcesar={() => { setEjecucion((n) => n + 1); document.getElementById('proceso')?.scrollIntoView({ behavior: 'smooth' }); }} />
            </div>
          </section>
        )}

        {/* --- SECCIÓN: NUESTRO ESTUDIO --- */}
        {activeTab === 'Nuestro Estudio' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-playfair font-bold text-[#00E5FF] mb-4">Nuestro Estudio</h2>
            <p className="text-lg text-[#8D93AB] mb-8 max-w-4xl">
              Así es Fotarto por dentro: tres salas especializadas, una recepción con taller 3D y una zona de edición y poscopia, todo en un mismo espacio.
            </p>

            <a href="assets/img/plano-estudio.jpg" target="_blank" rel="noopener noreferrer" className="block">
              <img
                src="assets/img/plano-estudio.jpg"
                alt="Plano de distribución de Fotarto: Sala Multiusos, Sala Eventos BBC, Sala Cine de Acción, Recepción y Taller 3D, y Edición y Poscopia"
                className="w-full rounded-xl border-2 border-[#00E5FF] glow-box"
              />
            </a>
            <p className="text-center text-sm text-[#8D93AB] mt-3 mb-12">Plano de distribución · Toca la imagen para verla en grande</p>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                { t: 'Sala 1: Multiusos', d: 'Ciclorama blanco, raíles de iluminación en el techo y ventanas de luz natural.' },
                { t: 'Sala 2: Eventos BBC', d: 'Ambiente cálido y elegante para bodas, bautizos y comuniones.' },
                { t: 'Sala 3: Cine de Acción', d: 'Black box con focos, tubos LED, máquinas de humo y cámaras de vídeo.' },
                { t: 'Recepción y Taller 3D', d: 'Atención al cliente, vitrinas e impresoras de resina donde nacen los Funkos 3D.' },
                { t: 'Edición y Poscopia', d: 'Puestos de retoque, impresión fotográfica y restauración digital.' },
              ].map((zona) => (
                <div key={zona.t} className="p-6 border border-[#8D93AB]/30 rounded-lg bg-[#151720] hover:border-[#00E5FF] transition-colors">
                  <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-[#00E5FF]" /> {zona.t}
                  </h3>
                  <p className="text-[#8D93AB] text-sm">{zona.d}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- SECCIÓN: TU ESTUDIO (simulador de luz) --- */}
        {activeTab === 'Tu estudio' && (
          <Suspense fallback={<p className="text-center text-[#8D93AB] py-24 tracking-widest uppercase">Preparando el estudio…</p>}>
            <TuEstudio />
          </Suspense>
        )}

        {/* --- SECCIÓN: TU FUNKO 3D --- */}
        {activeTab === 'Tu Funko 3D' && (
          <Suspense fallback={<p className="text-center text-[#8D93AB] py-24 tracking-widest uppercase">Preparando tu Funko…</p>}>
            <FunkoPagina onPedir={() => irA('Contacto')} />
          </Suspense>
        )}

        {/* --- SECCIÓN: TARIFAS --- */}
        {activeTab === 'Tarifas' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-playfair font-bold text-[#00E5FF] mb-4">Nuestros Precios</h2>
            <p className="text-[#8D93AB] mb-12">Calidad profesional, transparencia y tecnología al servicio de tu imagen.</p>
            
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {tarifas.map((item) => (
                <div key={item.id} className="p-6 md:p-8 border border-[#8D93AB]/30 rounded-xl bg-gradient-to-b from-[#151720] to-[#0B0C10] hover:border-[#00E5FF] hover:-translate-y-1 transition-all duration-300 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-24 h-24 bg-[#00E5FF]/5 rounded-bl-full -mr-4 -mt-4 transition-transform group-hover:scale-150"></div>
                  <h3 className="text-xl font-bold text-white mb-2 font-playfair">{item.title}</h3>
                  <div className="text-3xl font-bold text-[#00E5FF] mb-4">{item.price}</div>
                  <p className="text-[#8D93AB] text-sm leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>
          </section>
        )}

        {/* --- SECCIÓN: CONTACTO --- */}
        {activeTab === 'Contacto' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-playfair font-bold text-[#00E5FF] mb-8">Reserva tu sesión</h2>
            
            <div className="grid lg:grid-cols-2 gap-12 lg:items-start">
              {/* Formulario */}
              <div className="bg-[#151720] p-8 rounded-xl border border-[#8D93AB]/30">
                <form className="space-y-6" onSubmit={(e) => e.preventDefault()}>
                  <div>
                    <label className="block text-sm font-semibold text-[#8D93AB] mb-2">Nombre completo</label>
                    <input type="text" className="w-full bg-[#0B0C10] border border-[#8D93AB]/50 rounded-md p-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors" placeholder="Tu nombre" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#8D93AB] mb-2">Email de contacto</label>
                    <input type="email" className="w-full bg-[#0B0C10] border border-[#8D93AB]/50 rounded-md p-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors" placeholder="tu@email.com" />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-[#8D93AB] mb-2">¿Qué necesitas? (Sala, BBC, Funko 3D...)</label>
                    <textarea rows="4" className="w-full bg-[#0B0C10] border border-[#8D93AB]/50 rounded-md p-3 text-white focus:outline-none focus:border-[#00E5FF] transition-colors" placeholder="Escribe aquí los detalles..."></textarea>
                  </div>
                  <button type="submit" className="w-full bg-[#00E5FF] text-[#0B0C10] font-bold text-lg py-3 rounded-md hover:bg-white transition-colors flex items-center justify-center gap-2">
                    <Send className="w-5 h-5" /> Enviar Solicitud
                  </button>
                </form>
              </div>

              {/* Info y Uniforme */}
              <div className="space-y-8">
                <div className="space-y-4">
                  <div className="flex items-center gap-4 text-[#8D93AB]">
                    <div className="p-3 bg-[#151720] rounded-full text-[#00E5FF]"><MapPin className="w-6 h-6" /></div>
                    <div>
                      <p className="font-bold text-white">Estudio Central</p>
                      <p>Calle Ficticia 123, Ciudad, España</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[#8D93AB]">
                    <div className="p-3 bg-[#151720] rounded-full text-[#00E5FF]"><Phone className="w-6 h-6" /></div>
                    <div>
                      <p className="font-bold text-white">Teléfono</p>
                      <p>+34 900 000 000</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-[#8D93AB]">
                    <div className="p-3 bg-[#151720] rounded-full text-[#00E5FF]"><Mail className="w-6 h-6" /></div>
                    <div>
                      <p className="font-bold text-white">Email</p>
                      <p>reservas@fotarto.luz</p>
                    </div>
                  </div>
                </div>

                {/* Nuestro Equipo */}
                <div className="pt-6 border-t border-[#8D93AB]/30">
                  <h3 className="text-2xl font-playfair font-bold text-white mb-4 flex items-center gap-3">
                    <Users className="w-6 h-6 text-[#00E5FF]" /> Nuestro Equipo
                  </h3>
                  <div className="grid sm:grid-cols-2 gap-3">
                    {[
                      { nombre: 'Alba', email: 'alba@fotarto.luz' },
                      { nombre: 'AlexIA', email: 'alexia@fotarto.luz' },
                      { nombre: 'ClaudIA', email: 'claudia@fotarto.luz' },
                      { nombre: 'SonIA', email: 'sonia@fotarto.luz' },
                    ].map((p) => (
                      <a key={p.email} href={`mailto:${p.email}`} className="flex items-center gap-3 p-4 bg-[#151720] rounded-lg border border-[#8D93AB]/30 hover:border-[#00E5FF] transition-colors group">
                        <div className="w-11 h-11 shrink-0 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF]/50 flex items-center justify-center font-playfair font-bold text-lg text-[#00E5FF]">
                          {p.nombre[0]}
                        </div>
                        <div className="min-w-0">
                          <p className="font-bold text-white">{p.nombre}</p>
                          <p className="text-sm text-[#8D93AB] group-hover:text-[#00E5FF] transition-colors truncate">{p.email}</p>
                        </div>
                      </a>
                    ))}
                  </div>
                </div>

              </div>
            </div>

            {/* Uniforme Oficial: a todo el ancho, las dos imágenes lado a lado en el ordenador */}
            <div className="mt-16 pt-10 border-t border-[#8D93AB]/30">
              <h3 className="text-center font-playfair text-3xl md:text-4xl text-[#00E5FF] italic mb-8">Uniforme Oficial Fotarto</h3>
              <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1.7fr)] gap-6 items-stretch">
                <img
                  src="assets/img/uniforme-equipo.jpg"
                  alt="Equipo de Fotarto con el uniforme oficial en el estudio"
                  className="w-full h-full object-cover object-top rounded-xl border-2 border-[#00E5FF] glow-box"
                />
                <div className="flex flex-col gap-6">
                  <img
                    src="assets/img/uniforme-trabajo.jpg"
                    alt="Uniforme de trabajo Fotarto: vista frontal, lateral y trasera del polo negro con detalles turquesa"
                    className="w-full rounded-xl border-2 border-[#00E5FF] glow-box"
                  />
                  <div className="flex-1 flex flex-col justify-center p-6 rounded-xl bg-[#151720] border border-[#8D93AB]/30 text-center">
                    <p className="text-xl md:text-2xl font-playfair font-bold text-white">
                      ¡También te diseñamos tu propio uniforme para que quede tan chulo como el nuestro!
                    </p>
                    <p className="text-sm text-[#8D93AB] mt-3">Polo negro con ribetes turquesa y el logotipo bordado en el pecho, la manga y la espalda.</p>
                  </div>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#8D93AB]/30 py-8 text-center text-sm text-[#8D93AB]">
        <p>2026 · Transformación para el sistema productivo</p>
      </footer>
    </div>
  );
}