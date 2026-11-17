import React, { useState } from 'react';
import { Camera, Aperture, ChevronRight, Send, MapPin, Phone, Mail } from 'lucide-react';

export default function FotartoWeb() {
  const [activeTab, setActiveTab] = useState('Fotarto');
  // Portada de entrada: 'visible' -> 'saliendo' (animación) -> 'oculta'
  const [intro, setIntro] = useState('visible');

  const entrar = () => {
    if (intro !== 'visible') return;
    setIntro('saliendo');
    setTimeout(() => setIntro('oculta'), 1100);
  };

  const tabs = [
    'Fotarto',
    'De donde venimos',
    'A donde vamos',
    'Nuestro Estudio',
    'Tarifas',
    'Contacto'
  ];

  // Datos para las tarifas
  const tarifas = [
    { id: 1, title: 'Tu Funko en 3D', price: '49,99€', desc: 'Oferta de lanzamiento. Modelado 3D + Impresión en resina premium.' },
    { id: 2, title: 'Pack Comunión/Bautizo', price: 'desde 199€', desc: 'Sesión en Sala Premium BBC + Álbum Digital maquetado.' },
    { id: 3, title: 'Pack Boda "Cine" 4K', price: 'desde 899€', desc: 'Cobertura total del evento + Reportaje cinematográfico.' },
    { id: 4, title: 'Sala Multiusos', price: '30€ / hora', desc: 'Ciclorama blanco, raíles de techo, ventanas de luz natural.' },
    { id: 5, title: 'Sala Cine de Acción', price: '45€ / hora', desc: 'Black box, iluminación LED RGB, máquinas de humo y atrezzo.' },
    { id: 6, title: 'Bono Creativo (10h)', price: '250€', desc: '10 horas de estudio a tu disposición. Ahorra un 15%.' },
  ];

  return (
    <div className="min-h-screen bg-[#0B0C10] text-[#FFFFFF] font-montserrat flex flex-col">
      {/* Inyección de fuentes y estilos globales para asegurar que carguen siempre */}
      <style dangerouslySetInnerHTML={{__html: `
        @import url('https://fonts.googleapis.com/css2?family=Montserrat:ital,wght@0,300;0,400;0,600;1,400&family=Playfair+Display:ital,wght@0,400;0,600;0,700;1,400&display=swap');
        .font-playfair { font-family: 'Playfair Display', serif; }
        .font-montserrat { font-family: 'Montserrat', sans-serif; }
        .glow-text { text-shadow: 0 0 15px rgba(0,229,255,0.6); }
        .glow-box { box-shadow: 0 0 15px rgba(0,229,255,0.2); }

        /* Portada tipo Netflix */
        @keyframes introGiro { to { transform: rotate(360deg); } }
        @keyframes introAparece { from { opacity: 0; transform: scale(0.85); } to { opacity: 1; transform: scale(1); } }
        @keyframes introLatido { 0%,100% { filter: drop-shadow(0 0 18px rgba(0,229,255,0.5)); } 50% { filter: drop-shadow(0 0 45px rgba(0,229,255,0.95)); } }
        @keyframes introParpadeo { 0%,100% { opacity: 0.35; } 50% { opacity: 1; } }
        @keyframes introZoom { 0% { transform: scale(1); opacity: 1; } 60% { opacity: 1; } 100% { transform: scale(14); opacity: 0; } }
        @keyframes introFondo { 0%,40% { opacity: 1; } 100% { opacity: 0; } }
        .intro-contenido { animation: introAparece 1.2s ease-out both; }
        .intro-logo { animation: introGiro 3s linear infinite, introLatido 2.4s ease-in-out infinite; }
        .intro-pista { animation: introParpadeo 2s ease-in-out infinite; }
        .intro-saliendo { animation: introFondo 1.1s ease-in forwards; }
        .intro-saliendo .intro-contenido { animation: introZoom 1.1s cubic-bezier(.6,0,.9,.4) forwards; }
        .intro-saliendo .intro-pista { display: none; }
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
            <Aperture className="intro-logo w-40 h-40 md:w-56 md:h-56 text-[#00E5FF]" strokeWidth={1.5} />
            <span className="mt-8 text-5xl md:text-7xl font-playfair font-bold tracking-[0.3em] uppercase glow-text text-white pl-[0.3em]">
              Fotarto
            </span>
          </div>
          <span className="intro-pista absolute bottom-16 text-sm md:text-base tracking-[0.4em] uppercase text-[#8D93AB]">
            Toca para entrar
          </span>
        </button>
      )}

      {/* HEADER & NAVEGACIÓN */}
      <header className="pt-12 pb-6 px-4 border-b border-[#8D93AB]/30 bg-[#0B0C10] sticky top-0 z-50">
        <div className="max-w-6xl mx-auto flex flex-col items-center">
          {/* Logo */}
          <div className="flex items-center gap-3 mb-6 cursor-pointer" onClick={() => setActiveTab('Fotarto')}>
            <Aperture className="w-12 h-12 text-[#00E5FF] animate-[spin_10s_linear_infinite]" />
            <h1 className="text-5xl md:text-6xl font-playfair font-bold tracking-[0.2em] uppercase glow-text">
              Fotarto
            </h1>
          </div>
          
          {/* Tabs */}
          <nav className="flex flex-wrap justify-center gap-2 md:gap-4">
            {tabs.map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`px-4 py-2 text-sm md:text-base font-semibold transition-all duration-300 rounded-full border 
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
            <div className="mt-12">
              <img 
                src="assets/img/logo-fotarto.jpg" 
                alt="Logotipo de Fotarto: cámara con diafragma turquesa y la letra f" 
                className="w-full max-w-3xl mx-auto block rounded-xl border-2 border-[#00E5FF] glow-box"
              />
            </div>
          </section>
        )}

        {/* --- SECCIÓN: DE DONDE VENIMOS --- */}
        {activeTab === 'De donde venimos' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-playfair font-bold text-[#00E5FF] mb-8">Nuestros Orígenes</h2>
            <div className="grid md:grid-cols-2 gap-12 items-center">
              <div className="text-lg text-[#8D93AB] space-y-6 leading-relaxed">
                <p>
                  Toda gran transformación tiene un punto de partida. En nuestra <strong>"Empresa 0.0"</strong>, Fotarto era un estudio tradicional y lleno de talento, pero lastrado por procesos analógicos que frenaban nuestro potencial.
                </p>
                <p>
                  Disponíamos de tres fantásticas salas físicas:
                  <ul className="mt-4 space-y-2 ml-4">
                    <li className="flex items-center gap-2"><ChevronRight className="text-[#00E5FF] w-5 h-5"/> <strong>Sala Multiusos</strong></li>
                    <li className="flex items-center gap-2"><ChevronRight className="text-[#00E5FF] w-5 h-5"/> <strong>Sala Cine de Acción</strong></li>
                    <li className="flex items-center gap-2"><ChevronRight className="text-[#00E5FF] w-5 h-5"/> <strong>Sala Eventos BBC</strong> (Bodas, Bautizos y Comuniones)</li>
                  </ul>
                </p>
                <p>
                  Sin embargo, nuestro día a día era un caos de <strong>agendas de papel</strong>, lo que provocaba solapamientos de reservas, material fotográfico perdido, y un control de stock (resina y papel) que se hacía "a ojo". Sabíamos que necesitábamos evolucionar.
                </p>
              </div>
              <div className="relative">
                <div className="absolute inset-0 bg-gradient-to-tr from-[#0B0C10] to-transparent z-10"></div>
                <img 
                  src="https://images.unsplash.com/photo-1551016834-019688725838?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
                  alt="Agenda de papel antigua" 
                  className="rounded-lg grayscale opacity-70 border border-[#8D93AB]/50"
                />
              </div>
            </div>
          </section>
        )}

        {/* --- SECCIÓN: A DONDE VAMOS --- */}
        {activeTab === 'A donde vamos' && (
          <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
            <h2 className="text-4xl md:text-5xl font-playfair font-bold text-[#00E5FF] mb-8">Transformación Digital (UT2)</h2>
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
                      <p>reservas@fotarto.es</p>
                    </div>
                  </div>
                </div>

                {/* Uniforme Oficial */}
                <div className="pt-6 border-t border-[#8D93AB]/30 space-y-4">
                  <p className="text-center font-playfair text-2xl text-[#00E5FF] italic">Uniforme Oficial Fotarto</p>
                  <img
                    src="assets/img/uniforme-equipo.jpg"
                    alt="Equipo de Fotarto con el uniforme oficial en el estudio"
                    className="w-full rounded-lg border-2 border-[#00E5FF] glow-box"
                  />
                  <img
                    src="assets/img/uniforme-vistas.jpg"
                    alt="Uniforme de trabajo Fotarto: vista frontal, lateral y trasera del polo negro con detalles turquesa"
                    className="w-full rounded-lg border-2 border-[#00E5FF] glow-box"
                  />
                  <p className="text-center text-lg font-semibold text-white">
                    ¡También te diseñamos tu propio uniforme para que quede tan chulo como el nuestro!
                  </p>
                </div>
              </div>
            </div>
          </section>
        )}
      </main>

      {/* FOOTER */}
      <footer className="border-t border-[#8D93AB]/30 py-8 text-center text-sm text-[#8D93AB]">
        <p>© 2026 Fotarto - Transformación para el sistema productivo (Proyecto UT2 - DAW).</p>
      </footer>
    </div>
  );
}