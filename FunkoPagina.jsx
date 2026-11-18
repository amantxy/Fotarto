import React, { useState } from 'react';
import { CalendarCheck, ScanFace, Paintbrush, MessageCircle, RotateCcw, Sparkles } from 'lucide-react';
import Funko3D, { OPCIONES_FUNKO, FUNKO_INICIAL } from './Funko3D.jsx';

// ---------------------------------------------------------------------------
// Pestaña «Tu Funko 3D»: figura girable, personalización y cómo funciona
// ---------------------------------------------------------------------------
const Grupo = ({ titulo, children }) => (
  <div>
    <p className="text-xs uppercase tracking-wider text-[#8D93AB] mb-2">{titulo}</p>
    <div className="flex flex-wrap gap-2">{children}</div>
  </div>
);
const Chip = ({ activo, onClick, children }) => (
  <button type="button" onClick={onClick} aria-pressed={activo}
    className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition-colors ${activo ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF]' : 'border-[#8D93AB]/40 text-[#8D93AB] hover:text-white hover:border-[#8D93AB]'}`}>
    {children}
  </button>
);
const Muestra = ({ activo, hex, nombre, onClick }) => (
  <button type="button" onClick={onClick} title={nombre} aria-label={nombre} aria-pressed={activo}
    className={`w-9 h-9 rounded-full border-2 transition-transform ${activo ? 'border-white ring-2 ring-[#00E5FF] scale-110' : 'border-[#8D93AB]/40 hover:scale-105'}`}
    style={{ background: hex }} />
);

export default function FunkoPagina({ onPedir }) {
  const [o, setO] = useState(FUNKO_INICIAL);
  const cambia = (k, v) => setO((x) => ({ ...x, [k]: v }));

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-16">
      <div>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E5FF] text-[#0B0C10] text-xs font-extrabold tracking-widest uppercase mb-4"><Sparkles className="w-4 h-4" /> Novedad</span>
        <h2 className="text-4xl md:text-5xl font-playfair font-bold text-[#00E5FF] mb-4">Tu Funko en 3D</h2>
        <p className="text-lg text-[#8D93AB] max-w-3xl leading-relaxed">
          Te escaneamos en el estudio, modelamos tu figura en 3D y la imprimimos en resina premium, pintada a mano. Personalízala aquí y mira cómo quedaría: este es nuestro Funko de ejemplo, con el <strong className="text-white">uniforme de Fotarto</strong>.
        </p>
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 items-start">
        <div className="max-w-md w-full mx-auto md:sticky md:top-[calc(var(--alto-cabecera,200px)+16px)]">
          <Funko3D opciones={o} etiqueta="Tu Funko · uniforme de Fotarto" />
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-[#8D93AB]/30 bg-[#151720] space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Personalízalo</h3>
              <button type="button" onClick={() => setO(FUNKO_INICIAL)} className="text-xs text-[#8D93AB] hover:text-white flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> Restablecer</button>
            </div>
            <Grupo titulo={`Tono de piel · ${OPCIONES_FUNKO.piel[o.piel].nombre}`}>
              {Object.entries(OPCIONES_FUNKO.piel).map(([k, v]) => <Muestra key={k} activo={o.piel === k} hex={v.hex} nombre={v.nombre} onClick={() => cambia('piel', k)} />)}
            </Grupo>
            <Grupo titulo="Peinado">
              {Object.entries(OPCIONES_FUNKO.peinado).map(([k, v]) => <Chip key={k} activo={o.peinado === k} onClick={() => cambia('peinado', k)}>{v}</Chip>)}
            </Grupo>
            <Grupo titulo={`Color de pelo · ${OPCIONES_FUNKO.pelo[o.pelo].nombre}`}>
              {Object.entries(OPCIONES_FUNKO.pelo).map(([k, v]) => <Muestra key={k} activo={o.pelo === k} hex={v.hex} nombre={v.nombre} onClick={() => cambia('pelo', k)} />)}
            </Grupo>
            <Grupo titulo="En las manos">
              {Object.entries(OPCIONES_FUNKO.objeto).map(([k, v]) => <Chip key={k} activo={o.objeto === k} onClick={() => cambia('objeto', k)}>{v}</Chip>)}
            </Grupo>
            <p className="text-sm text-[#8D93AB]">Ropa: <span className="text-white font-semibold">uniforme de Fotarto</span>. En el estudio puedes elegir cualquier otra: tu ropa de diario, un vestido de boda, la camiseta de tu equipo…</p>
          </div>

          <div className="p-6 rounded-xl border-2 border-[#00E5FF] glow-box bg-gradient-to-br from-[#00E5FF]/10 to-transparent flex flex-wrap items-center justify-between gap-4">
            <div>
              <p className="text-sm text-[#8D93AB]">Oferta de lanzamiento</p>
              <p className="text-4xl font-bold text-[#00E5FF]">49,99 €</p>
              <p className="text-sm text-[#8D93AB]">Escaneo + modelado 3D + impresión en resina premium</p>
            </div>
            <button type="button" onClick={onPedir} className="px-6 py-3 rounded-full bg-[#00E5FF] text-[#0B0C10] font-bold text-lg hover:bg-white transition-colors">Quiero el mío</button>
          </div>
        </div>
      </div>

      <div>
        <h3 className="text-3xl font-playfair font-bold text-white mb-6">Cómo funciona</h3>
        <ol className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { i: CalendarCheck, t: 'Reserva', d: 'Pide cita online: el sistema te da el primer hueco libre en la Sala Multiusos.' },
            { i: ScanFace, t: 'Escaneo 3D', d: 'Unos 10 minutos en el estudio. Puedes venir con la ropa y el objeto que quieras.' },
            { i: Paintbrush, t: 'Modelado y pintado', d: 'Modelamos tu figura, la imprimimos en resina premium y la pintamos a mano.' },
            { i: MessageCircle, t: 'Aviso y recogida', d: 'Sigue tu encargo en nuestro tablero y te avisamos por WhatsApp cuando esté listo.' },
          ].map(({ i: I, t, d }, n) => (
            <li key={t} className="p-5 rounded-xl border border-[#8D93AB]/30 bg-[#151720]">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF] text-[#00E5FF] font-bold flex items-center justify-center">{n + 1}</span>
                <I className="w-6 h-6 text-[#00E5FF]" />
              </div>
              <h4 className="font-bold text-white mb-1">{t}</h4>
              <p className="text-sm text-[#8D93AB]">{d}</p>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
