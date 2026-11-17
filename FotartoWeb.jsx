import React, { useState } from 'react';
import { Camera, Aperture, ChevronRight, Send, MapPin, Phone, Mail } from 'lucide-react';

export default function FotartoWeb() {
  const [activeTab, setActiveTab] = useState('Fotarto');

  const tabs = [
    'Fotarto',
    'De donde venimos',
    'A donde vamos',
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
      `}} />

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
                src="https://images.unsplash.com/photo-1542038784456-1ea8e935640e?ixlib=rb-4.0.3&auto=format&fit=crop&w=1200&q=80" 
                alt="Interior del estudio" 
                className="w-full h-64 md:h-96 object-cover rounded-lg border border-[#8D93AB]/30 opacity-80 hover:opacity-100 transition-opacity"
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
            
            <div className="grid lg:grid-cols-2 gap-12">
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
                    src="assets/img/uniforme-vistas.jpg"
                    alt="Uniforme de trabajo Fotarto: vista frontal, lateral y trasera del polo negro con detalles turquesa"
                    className="w-full rounded-lg border-2 border-[#00E5FF] glow-box"
                  />
                  <img
                    src="assets/img/uniforme-equipo.jpg"
                    alt="Equipo de Fotarto con el uniforme oficial en el estudio"
                    className="w-full h-80 md:h-96 object-cover object-top rounded-lg border-2 border-[#00E5FF] glow-box"
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