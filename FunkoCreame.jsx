import React, { useRef, useState } from 'react';
import { Camera, Upload, Wand2, ZoomIn, Move, RotateCcw } from 'lucide-react';

// ---------------------------------------------------------------------------
// CRÉAME: a partir de una foto, se sacan los colores de piel, pelo y ropa,
// el largo del pelo y si hay barba, y se crea el Funko con esos rasgos.
// Todo se calcula en el navegador: la foto no sale del dispositivo.
// ---------------------------------------------------------------------------
const T = 300; // lado del lienzo de análisis
const OVALO = { cx: 150, cy: 132, rx: 62, ry: 80 };

const hex = ([r, g, b]) => `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);

function mediana(ctx, x, y, w, h) {
  const d = ctx.getImageData(Math.round(x), Math.round(y), Math.max(1, Math.round(w)), Math.max(1, Math.round(h))).data;
  const r = [], g = [], b = [];
  for (let i = 0; i < d.length; i += 4) { r.push(d[i]); g.push(d[i + 1]); b.push(d[i + 2]); }
  const med = (a) => a.sort((p, q) => p - q)[Math.floor(a.length / 2)];
  return [med(r), med(g), med(b)];
}

const lum = (c) => 0.3 * c[0] + 0.59 * c[1] + 0.11 * c[2];
// Regla clásica para reconocer tonos de piel (en luz normal)
const pareceePiel = ([r, g, b]) => r > 95 && g > 40 && b > 20 && r > g && r > b && r - g > 12 && Math.max(r, g, b) - Math.min(r, g, b) > 15;

// Píxeles de una zona que NO se parecen a la piel ni al fondo (para encontrar el pelo)
function distintos(ctx, x, y, w, h, piel, fondos) {
  const d = ctx.getImageData(Math.round(x), Math.round(y), Math.round(w), Math.round(h)).data;
  const sel = [];
  let total = 0;
  for (let i = 0; i < d.length; i += 4) {
    const c = [d[i], d[i + 1], d[i + 2]];
    total++;
    if (dist(c, piel) > 48 && !pareceePiel(c) && fondos.every((f) => dist(c, f) > 40)) sel.push(c);
  }
  if (!sel.length) return { color: null, parte: 0 };
  const med = (k) => sel.map((c) => c[k]).sort((p, q) => p - q)[Math.floor(sel.length / 2)];
  return { color: [med(0), med(1), med(2)], parte: sel.length / total };
}

function analizar(ctx) {
  const { cx, cy, rx, ry } = OVALO;
  const fondos = [mediana(ctx, 4, 4, 30, 30), mediana(ctx, T - 34, 4, 30, 30)];
  const mejillas = [mediana(ctx, cx - rx * 0.62, cy + ry * 0.08, rx * 0.3, ry * 0.2), mediana(ctx, cx + rx * 0.32, cy + ry * 0.08, rx * 0.3, ry * 0.2)];
  const piel = mejillas[0].map((v, i) => (v + mejillas[1][i]) / 2);
  // pelo: franja por encima del óvalo y parte alta de la frente
  const arriba = distintos(ctx, cx - rx * 0.55, Math.max(0, cy - ry - 34), rx * 1.1, 32, piel, fondos);
  const pelo = arriba.color || piel;
  const laterales = [
    distintos(ctx, cx - rx - 24, cy + ry * 0.1, 18, ry * 0.7, piel, fondos),
    distintos(ctx, cx + rx + 6, cy + ry * 0.1, 18, ry * 0.7, piel, fondos),
  ];
  const barbilla = mediana(ctx, cx - rx * 0.3, cy + ry * 0.7, rx * 0.6, ry * 0.18);
  const labio = mediana(ctx, cx - rx * 0.3, cy + ry * 0.36, rx * 0.6, ry * 0.07);
  const ropa = mediana(ctx, cx - rx, Math.min(T - 22, cy + ry + 26), rx * 2, 18);

  let peinado = 'corto';
  if (arriba.parte < 0.22) peinado = 'calvo';
  else if (laterales.every((l) => l.parte > 0.45 && l.color && dist(l.color, pelo) < 60)) peinado = 'largo';
  // barba: la barbilla es claramente más oscura que las mejillas
  let barba = 'nada';
  if (lum(barbilla) < lum(piel) * 0.84) barba = 'barba';
  else if (lum(labio) < lum(piel) * 0.8) barba = 'bigote';
  // la piel suele salir algo más oscura en las fotos: se aclara un poco
  const pielAjustada = piel.map((v) => v * 1.08 + 6);
  return { piel: hex(pielAjustada), pelo: hex(pelo), peinado, barba, ropaColor: hex(ropa) };
}

export default function FunkoCreame({ onCrear }) {
  const [foto, setFoto] = useState(null);
  const [vista, setVista] = useState({ x: 0, y: 0, z: 1 });
  const [uniforme, setUniforme] = useState(false);
  const [res, setRes] = useState(null);
  const img = useRef(null);
  const caja = useRef(null);
  const arr = useRef(null);

  const cargar = (f) => {
    if (!f) return;
    setRes(null); setVista({ x: 0, y: 0, z: 1 });
    setFoto(URL.createObjectURL(f));
  };

  // el tamaño base cubre el cuadro (como object-cover) y luego se mueve y amplía
  const base = () => {
    const i = img.current;
    if (!i || !i.naturalWidth) return { w: T, h: T };
    const k = Math.max(T / i.naturalWidth, T / i.naturalHeight);
    return { w: i.naturalWidth * k, h: i.naturalHeight * k };
  };

  const crear = () => {
    const i = img.current;
    if (!i) return;
    const c = document.createElement('canvas'); c.width = c.height = T;
    const ctx = c.getContext('2d', { willReadFrequently: true });
    const { w, h } = base();
    const W = w * vista.z, H = h * vista.z;
    ctx.fillStyle = '#808080'; ctx.fillRect(0, 0, T, T);
    ctx.drawImage(i, (T - W) / 2 + vista.x, (T - H) / 2 + vista.y, W, H);
    const r = analizar(ctx);
    setRes(r);
    onCrear({ piel: r.piel, pelo: r.pelo, peinado: r.peinado, barba: r.barba, gafas: 'nada', gorro: 'nada', ropa: uniforme ? 'uniforme' : 'camiseta', ropaColor: uniforme ? 'negro' : r.ropaColor });
  };

  const abajo = (e) => { arr.current = { x: e.clientX, y: e.clientY, v: vista }; e.currentTarget.setPointerCapture?.(e.pointerId); };
  const mover = (e) => {
    if (!arr.current) return;
    const k = T / (caja.current?.clientWidth || T);
    setVista({ ...arr.current.v, x: arr.current.v.x + (e.clientX - arr.current.x) * k, y: arr.current.v.y + (e.clientY - arr.current.y) * k });
  };
  const soltar = () => { arr.current = null; };

  const pct = (v) => `${(v / T) * 100}%`;
  const { w, h } = base();

  return (
    <div className="rounded-2xl border-2 border-[#00E5FF] glow-box bg-[#0E1016] p-4 sm:p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <span className="px-3 py-1 rounded-full bg-[#00E5FF] text-[#0B0C10] text-sm font-extrabold tracking-[0.25em]">¡CRÉAME!</span>
        <h3 className="text-2xl md:text-3xl font-playfair font-bold text-white">Tu Funko a partir de una foto</h3>
      </div>
      <p className="text-[#8D93AB] mb-6 max-w-3xl">Sube una foto de frente, encaja tu cara en el óvalo y creamos tu Funko con tu tono de piel, tu pelo, tu barba y el color de tu ropa. Después puedes retocarlo con las opciones de arriba. La foto se analiza en tu propio dispositivo: no se envía a ningún sitio.</p>

      <div className="flex flex-wrap gap-3 mb-6">
        <label className="inline-flex items-center gap-2 px-5 py-3 rounded-full bg-[#00E5FF] text-[#0B0C10] font-bold cursor-pointer hover:bg-white transition-colors">
          <Camera className="w-5 h-5" /> Hacerme una foto
          <input type="file" accept="image/*" capture="user" className="sr-only" onChange={(e) => cargar(e.target.files?.[0])} />
        </label>
        <label className="inline-flex items-center gap-2 px-5 py-3 rounded-full border border-[#00E5FF] text-[#00E5FF] font-bold cursor-pointer hover:bg-[#00E5FF]/10 transition-colors">
          <Upload className="w-5 h-5" /> Subir una foto
          <input type="file" accept="image/*" className="sr-only" onChange={(e) => cargar(e.target.files?.[0])} />
        </label>
      </div>

      {foto && (
        <div className="grid md:grid-cols-[minmax(0,340px)_minmax(0,1fr)] gap-8 items-start">
          <div>
            <div ref={caja} className="relative w-full aspect-square rounded-xl overflow-hidden bg-[#2A2D36] touch-none cursor-move select-none"
              onPointerDown={abajo} onPointerMove={mover} onPointerUp={soltar} onPointerCancel={soltar}>
              <img ref={img} src={foto} alt="Tu foto" draggable={false} onLoad={() => setVista((v) => ({ ...v }))}
                className="absolute max-w-none pointer-events-none"
                style={{ width: pct(w * vista.z), height: pct(h * vista.z), left: pct((T - w * vista.z) / 2 + vista.x), top: pct((T - h * vista.z) / 2 + vista.y) }} />
              <svg viewBox={`0 0 ${T} ${T}`} className="absolute inset-0 w-full h-full pointer-events-none">
                <defs><mask id="ovalo"><rect width={T} height={T} fill="white" /><ellipse cx={OVALO.cx} cy={OVALO.cy} rx={OVALO.rx} ry={OVALO.ry} fill="black" /></mask></defs>
                <rect width={T} height={T} fill="rgba(11,12,16,0.55)" mask="url(#ovalo)" />
                <ellipse cx={OVALO.cx} cy={OVALO.cy} rx={OVALO.rx} ry={OVALO.ry} fill="none" stroke="#00E5FF" strokeWidth="2" strokeDasharray="6 5" />
                <text x={OVALO.cx} y={T - 10} textAnchor="middle" fontSize="11" fill="#C9CDD8">Encaja tu cara aquí</text>
              </svg>
            </div>
            <div className="mt-3 flex items-center gap-3">
              <ZoomIn className="w-4 h-4 text-[#8D93AB]" />
              <input type="range" aria-label="Zoom" min="1" max="4" step="0.02" value={vista.z} onChange={(e) => setVista({ ...vista, z: parseFloat(e.target.value) })} className="flex-1 accent-[#00E5FF]" />
              <button type="button" onClick={() => setVista({ x: 0, y: 0, z: 1 })} aria-label="Centrar" className="p-1.5 text-[#8D93AB] hover:text-white"><RotateCcw className="w-4 h-4" /></button>
            </div>
            <p className="text-xs text-[#8D93AB] mt-1 flex items-center gap-1.5"><Move className="w-3.5 h-3.5" /> Arrastra la foto y usa el zoom hasta que tu cara llene el óvalo.</p>
          </div>

          <div className="space-y-4">
            <label className="flex items-center gap-3 text-sm text-white cursor-pointer">
              <input type="checkbox" checked={uniforme} onChange={(e) => setUniforme(e.target.checked)} className="w-5 h-5 accent-[#00E5FF]" />
              Vestirme con el uniforme de Fotarto
            </label>
            <button type="button" onClick={crear} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00E5FF] text-[#0B0C10] font-bold text-lg hover:bg-white transition-colors">
              <Wand2 className="w-5 h-5" /> Crear mi Funko
            </button>
            {res && (
              <div className="p-4 rounded-lg bg-[#151720] border border-[#8D93AB]/30 space-y-2 text-sm">
                <p className="text-white font-semibold">Esto es lo que hemos visto en tu foto:</p>
                {[
                  ['Piel', res.piel], ['Pelo', res.pelo], ...(uniforme ? [] : [['Ropa', res.ropaColor]]),
                ].map(([n, c]) => <p key={n} className="flex items-center gap-2 text-[#C9CDD8]"><span className="w-5 h-5 rounded-full border border-white/30" style={{ background: c }} />{n}</p>)}
                <p className="text-[#C9CDD8]">Peinado: <strong className="text-white">{{ corto: 'corto', largo: 'melena', calvo: 'sin pelo' }[res.peinado]}</strong> · Barba: <strong className="text-white">{{ nada: 'no', barba: 'sí', bigote: 'bigote' }[res.barba]}</strong></p>
                <p className="text-[#00E5FF]">¡Listo! Tu Funko ya está arriba. Si algo no cuadra (gafas, peinado…), ajústalo en «Personalízalo».</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
