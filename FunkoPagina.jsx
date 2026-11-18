import React, { useState } from 'react';
import { CalendarCheck, ScanFace, Paintbrush, MessageCircle, RotateCcw, Sparkles, Download, Shuffle, Check } from 'lucide-react';
import Funko3D, { OPCIONES_FUNKO, FUNKO_INICIAL, COLOR_ROPA_DEFECTO, colorDe } from './Funko3D.jsx';
import FunkoCreame from './FunkoCreame.jsx';
import { BocetoEscaner, BocetoProceso } from './BocetoEscaner.jsx';

// ---------------------------------------------------------------------------
// Pestaña «Tu Funko 3D»: personalización, CRÉAME desde una foto y «¿Más real?»
// ---------------------------------------------------------------------------
const Grupo = ({ titulo, children }) => (
  <div>
    <p className="text-xs uppercase tracking-wider text-[#8D93AB] mb-2">{titulo}</p>
    <div className="flex flex-wrap gap-2 items-center">{children}</div>
  </div>
);
const Chip = ({ activo, onClick, children }) => (
  <button type="button" onClick={onClick} aria-pressed={activo}
    className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition-colors ${activo ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF]' : 'border-[#8D93AB]/40 text-[#8D93AB] hover:text-white hover:border-[#8D93AB]'}`}>
    {children}
  </button>
);
// Muestras de color + selector libre
const Colores = ({ lista, valor, onElegir }) => {
  const libre = !lista[valor];
  return (
    <>
      {Object.entries(lista).map(([k, v]) => (
        <button key={k} type="button" onClick={() => onElegir(k)} title={v.nombre} aria-label={v.nombre} aria-pressed={valor === k}
          className={`w-9 h-9 rounded-full border-2 transition-transform ${valor === k ? 'border-white ring-2 ring-[#00E5FF] scale-110' : 'border-[#8D93AB]/40 hover:scale-105'}`}
          style={{ background: v.hex }} />
      ))}
      <label title="Otro color" className={`relative w-9 h-9 rounded-full border-2 cursor-pointer overflow-hidden ${libre ? 'border-white ring-2 ring-[#00E5FF] scale-110' : 'border-[#8D93AB]/40'}`}
        style={{ background: libre ? valor : 'conic-gradient(#ff2d2d, #ffe94d, #38e86b, #00e5ff, #3d7bff, #ff2dd1, #ff2d2d)' }}>
        <span className="sr-only">Otro color</span>
        <input type="color" value={libre ? valor : '#00e5ff'} onChange={(e) => onElegir(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
      </label>
    </>
  );
};
const nombreDe = (lista, v) => (lista[v] ? lista[v].nombre : 'Personalizado');
const azar = (obj) => { const k = Object.keys(obj); return k[Math.floor(Math.random() * k.length)]; };

export default function FunkoPagina({ onPedir }) {
  const [o, setO] = useState(FUNKO_INICIAL);
  const cambia = (k, v) => setO((x) => ({ ...x, [k]: v }));
  const O = OPCIONES_FUNKO;

  const descargar = () => {
    const c = document.querySelector('canvas[data-funko]');
    if (!c) return;
    const a = document.createElement('a');
    a.download = `mi-funko-fotarto${o.nombre ? `-${o.nombre.toLowerCase().replace(/\s+/g, '-')}` : ''}.png`;
    a.href = c.toDataURL('image/png');
    a.click();
  };
  const sorpresa = () => {
    const ropa = azar(O.ropa);
    setO((x) => ({ ...x, piel: azar(O.piel), pelo: azar(O.pelo), peinado: azar(O.peinado), barba: azar(O.barba), gafas: azar(O.gafas), gorro: azar(O.gorro), ojos: azar(O.ojos), accesorios: Object.keys(O.accesorios).filter(() => Math.random() < 0.25), ropa, ropaColor: ropa === 'uniforme' ? 'negro' : azar(O.ropaColor), objeto: azar(O.objeto) }));
  };
  const desdeFoto = (rasgos) => {
    setO((x) => ({ ...x, ...rasgos }));
    document.getElementById('funko-visor')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  };

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700 space-y-10 md:space-y-16">
      <div>
        <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-[#00E5FF] text-[#0B0C10] text-xs font-extrabold tracking-widest uppercase mb-4"><Sparkles className="w-4 h-4" /> Novedad</span>
        <h2 className="text-3xl md:text-5xl font-playfair font-bold text-[#00E5FF] mb-4">Tu Funko en 3D</h2>
        <p className="text-lg text-[#8D93AB] max-w-3xl leading-relaxed">
          Te escaneamos en el estudio con nuestro escáner 3D, modelamos tu figura y la imprimimos en resina premium, pintada a mano. Personalízala aquí o pulsa <strong className="text-white">¡CRÉAME!</strong> y créala a partir de una foto tuya.
        </p>
      </div>

      <div className="grid md:grid-cols-[minmax(0,1fr)_minmax(0,1fr)] gap-10 items-start">
        <div id="funko-visor" className="max-w-md w-full mx-auto md:sticky md:top-[calc(var(--alto-cabecera,200px)+16px)] space-y-3">
          <Funko3D opciones={o} etiqueta={o.nombre ? `El Funko de ${o.nombre}` : 'Tu Funko · personalízalo'} />
          <div className="flex gap-2">
            <button type="button" onClick={descargar} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-[#00E5FF] text-[#00E5FF] font-bold text-sm hover:bg-[#00E5FF]/10"><Download className="w-4 h-4" /> Descargar</button>
            <button type="button" onClick={sorpresa} className="flex-1 inline-flex items-center justify-center gap-2 px-4 py-2.5 rounded-full border border-[#8D93AB]/50 text-[#C9CDD8] font-bold text-sm hover:text-white hover:border-white"><Shuffle className="w-4 h-4" /> Sorpréndeme</button>
          </div>
        </div>

        <div className="space-y-6">
          <div className="p-6 rounded-xl border border-[#8D93AB]/30 bg-[#151720] space-y-5">
            <div className="flex items-center justify-between">
              <h3 className="text-xl font-bold text-white">Personalízalo</h3>
              <button type="button" onClick={() => setO(FUNKO_INICIAL)} className="text-xs text-[#8D93AB] hover:text-white flex items-center gap-1"><RotateCcw className="w-3.5 h-3.5" /> Restablecer</button>
            </div>
            <label className="block">
              <span className="text-xs uppercase tracking-wider text-[#8D93AB]">Nombre en la peana</span>
              <input value={o.nombre} maxLength={18} onChange={(e) => cambia('nombre', e.target.value)} placeholder="Tu nombre"
                className="mt-2 w-full bg-[#0B0C10] border border-[#8D93AB]/50 rounded-md p-2.5 text-white focus:outline-none focus:border-[#00E5FF]" />
            </label>
            <Grupo titulo={`Tono de piel · ${nombreDe(O.piel, o.piel)}`}><Colores lista={O.piel} valor={o.piel} onElegir={(v) => cambia('piel', v)} /></Grupo>
            <Grupo titulo="Peinado">{Object.entries(O.peinado).map(([k, v]) => <Chip key={k} activo={o.peinado === k} onClick={() => cambia('peinado', k)}>{v}</Chip>)}</Grupo>
            <Grupo titulo={`Color de pelo · ${nombreDe(O.pelo, o.pelo)}`}><Colores lista={O.pelo} valor={o.pelo} onElegir={(v) => cambia('pelo', v)} /></Grupo>
            <Grupo titulo={`Color de ojos · ${nombreDe(O.ojos, o.ojos)}`}><Colores lista={O.ojos} valor={o.ojos} onElegir={(v) => cambia('ojos', v)} /></Grupo>
            <Grupo titulo="Barba">{Object.entries(O.barba).map(([k, v]) => <Chip key={k} activo={o.barba === k} onClick={() => cambia('barba', k)}>{v}</Chip>)}</Grupo>
            <Grupo titulo="Gafas">{Object.entries(O.gafas).map(([k, v]) => <Chip key={k} activo={o.gafas === k} onClick={() => cambia('gafas', k)}>{v}</Chip>)}</Grupo>
            <Grupo titulo="En la cabeza">{Object.entries(O.gorro).map(([k, v]) => <Chip key={k} activo={o.gorro === k} onClick={() => cambia('gorro', k)}>{v}</Chip>)}</Grupo>
            <Grupo titulo={`Accesorios · ${o.accesorios.length ? `${o.accesorios.length} elegido${o.accesorios.length > 1 ? 's' : ''}` : 'combina los que quieras'}`}>
              {Object.entries(O.accesorios).map(([k, v]) => {
                const on = o.accesorios.includes(k);
                return <Chip key={k} activo={on} onClick={() => setO((x) => ({ ...x, accesorios: on ? x.accesorios.filter((a) => a !== k) : [...x.accesorios, k] }))}>{on && <Check className="w-3.5 h-3.5 inline -mt-0.5 mr-1" />}{v}</Chip>;
              })}
            </Grupo>
            <Grupo titulo="Ropa">{Object.entries(O.ropa).map(([k, v]) => <Chip key={k} activo={o.ropa === k} onClick={() => setO((x) => ({ ...x, ropa: k, ropaColor: COLOR_ROPA_DEFECTO[k] }))}>{v}</Chip>)}</Grupo>
            {o.ropa !== 'uniforme' && (
              <Grupo titulo={`${o.ropa === 'elegante' ? 'Color de la corbata' : 'Color de la ropa'} · ${nombreDe(O.ropaColor, o.ropaColor)}`}><Colores lista={O.ropaColor} valor={o.ropaColor} onElegir={(v) => cambia('ropaColor', v)} /></Grupo>
            )}
            <Grupo titulo="En las manos">{Object.entries(O.objeto).map(([k, v]) => <Chip key={k} activo={o.objeto === k} onClick={() => cambia('objeto', k)}>{v}</Chip>)}</Grupo>
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

      <FunkoCreame onCrear={desdeFoto} />

      <div>
        <h3 className="text-3xl font-playfair font-bold text-white mb-6">Cómo funciona</h3>
        <ol className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
          {[
            { i: CalendarCheck, t: 'Reserva', d: 'Pide cita online: el sistema te da el primer hueco libre en la Sala Multiusos.' },
            { i: ScanFace, t: 'Escaneo 3D', d: 'Unos segundos dentro de nuestro escáner. Ven con la ropa y el objeto que quieras.' },
            { i: Paintbrush, t: 'Modelado y pintado', d: 'Modelamos tu figura, la imprimimos en resina premium y la pintamos a mano.' },
            { i: MessageCircle, t: 'Aviso y recogida', d: 'Sigue tu encargo en nuestro tablero y te avisamos por WhatsApp cuando esté listo.' },
          ].map(({ i: I, t, d }, n) => (
            <li key={t} className="p-3 md:p-5 rounded-xl border border-[#8D93AB]/30 bg-[#151720]">
              <div className="flex items-center gap-3 mb-3">
                <span className="w-9 h-9 rounded-full bg-[#00E5FF]/10 border border-[#00E5FF] text-[#00E5FF] font-bold flex items-center justify-center">{n + 1}</span>
                <I className="w-6 h-6 text-[#00E5FF]" />
              </div>
              <h4 className="font-bold text-white text-sm md:text-base mb-1">{t}</h4>
              <p className="text-xs md:text-sm text-[#8D93AB]">{d}</p>
            </li>
          ))}
        </ol>
      </div>

      {/* ¿MÁS REAL? */}
      <div className="rounded-2xl border border-[#8D93AB]/30 bg-[#0E1016] p-4 sm:p-6 md:p-10 space-y-8">
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-8 items-center">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[#8D93AB] mb-2">Un paso más allá</p>
            <h3 className="text-3xl md:text-5xl font-playfair font-bold text-[#00E5FF] mb-4">¿Más real?</h3>
            <p className="text-lg text-[#8D93AB] leading-relaxed mb-5">
              Si prefieres una figura idéntica a ti y no estilo Funko, te hacemos una <strong className="text-white">miniatura realista a todo color</strong>: tu cara, tu pelo, tu ropa y tu pose, tal cual. La capturamos con nuestro escáner de fotogrametría en una fracción de segundo.
            </p>
            <ul className="space-y-2 mb-6">
              {['Réplica exacta: rasgos, ropa y pose reales', 'Impresión a todo color en resina, sin pintar a mano', 'Ideal para bodas, regalos familiares o mascotas', 'Peana con tu nombre y la fecha'].map((t) => (
                <li key={t} className="flex gap-2 text-[#C9CDD8]"><Check className="w-5 h-5 text-[#00E5FF] shrink-0" />{t}</li>
              ))}
            </ul>
            <div className="grid grid-cols-3 gap-2 md:gap-3 mb-6">
              {[['10 cm', '129 €'], ['15 cm', '169 €'], ['20 cm', '229 €']].map(([t, p]) => (
                <div key={t} className="p-2 md:p-3 rounded-lg bg-[#151720] border border-[#8D93AB]/30 text-center">
                  <p className="text-xs md:text-sm text-[#8D93AB]">{t}</p><p className="text-lg md:text-2xl font-bold text-[#00E5FF] whitespace-nowrap">{p}</p>
                </div>
              ))}
            </div>
            <button type="button" onClick={onPedir} className="px-6 py-3 rounded-full bg-[#00E5FF] text-[#0B0C10] font-bold text-lg hover:bg-white transition-colors">Quiero mi figura realista</button>
            <p className="text-xs text-[#8D93AB] mt-3">El Funko (49,99 €) es una versión divertida y estilizada; la figura realista lleva escaneo completo e impresión a todo color, por eso cuesta más.</p>
          </div>
          <figure className="rounded-xl overflow-hidden border border-[#d8ccb0] shadow-2xl -rotate-[0.6deg]">
            <BocetoEscaner />
            <figcaption className="bg-[#f4efe4] px-4 pb-3 text-xs text-[#4a4a50]">Boceto del escáner de la Sala Multiusos: postes con cámaras alrededor de una plataforma giratoria y luz difusa a los lados.</figcaption>
          </figure>
        </div>
        <div>
          <h4 className="text-2xl font-playfair font-bold text-white mb-4">El proceso, paso a paso</h4>
          <BocetoProceso />
        </div>
      </div>
    </section>
  );
}
