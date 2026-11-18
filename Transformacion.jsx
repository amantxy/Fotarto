import React, { useEffect, useMemo, useState } from 'react';
import {
  Pencil, Trash2, Check, Plus, ArrowRight, ArrowLeft, RotateCcw, ScanLine, AlertTriangle, CalendarCheck,
  MessageCircle, Boxes, CheckCircle2, PhoneMissed, PackageSearch, Clock, Sparkles,
} from 'lucide-react';

// ---------------------------------------------------------------------------
// DATOS COMPARTIDOS: la semana del 16 al 20 de noviembre de 2026
// ---------------------------------------------------------------------------
export const DIAS = ['Lunes 16', 'Martes 17', 'Miércoles 18', 'Jueves 19', 'Viernes 20'];
export const SALAS = {
  multiusos: { nombre: 'Sala Multiusos', corto: 'Multiusos', color: '#00E5FF' },
  cine: { nombre: 'Sala Cine de Acción', corto: 'Cine', color: '#F28482' },
  bbc: { nombre: 'Sala Eventos BBC', corto: 'BBC', color: '#FFD166' },
};
const APERTURA = 9 * 60, CIERRE = 21 * 60;

const h = (t) => { const [a, b] = t.split(':').map(Number); return a * 60 + b; };
export const hora = (m) => `${String(Math.floor(m / 60)).padStart(2, '0')}:${String(m % 60).padStart(2, '0')}`;
const HORAS = Array.from({ length: (CIERRE - APERTURA) / 30 }, (_, i) => APERTURA + i * 30);
const DURACIONES = [30, 60, 90, 120, 180];
const durTxt = (d) => (d < 60 ? `${d} min` : `${d / 60} h`.replace('.5', ',5'));

let siguienteId = 100;
export const AGENDA_INICIAL = {
  reservas: [
    { id: 1, dia: 0, inicio: h('10:00'), dur: 120, sala: 'multiusos', texto: 'Book de moda – Laura M.' },
    { id: 2, dia: 0, inicio: h('17:00'), dur: 120, sala: 'cine', texto: 'Rodaje corto «Zeta»' },
    { id: 3, dia: 1, inicio: h('11:00'), dur: 120, sala: 'multiusos', texto: 'Fotos de producto Cerámicas Luna' },
    { id: 4, dia: 1, inicio: h('11:30'), dur: 60, sala: 'multiusos', texto: 'Ana – fotos de carnet' },
    { id: 5, dia: 2, inicio: h('17:00'), dur: 120, sala: 'bbc', texto: 'Bautizo familia García' },
    { id: 6, dia: 2, inicio: h('17:30'), dur: 90, sala: 'bbc', texto: 'Comunión de Lucía Ruiz' },
    { id: 7, dia: 3, inicio: h('10:00'), dur: 60, sala: '', texto: 'Escaneo 3D Funko – Marta' },
    { id: 8, dia: 4, inicio: h('12:00'), dur: 120, sala: 'bbc', texto: 'Preboda Sánchez-Ortega' },
    { id: 9, dia: 4, inicio: h('18:00'), dur: 180, sala: 'cine', texto: 'Videoclip «Neón»' },
  ],
  notas: [
    'Llamar a Pedro: su Funko está listo (no contesta, 3 veces)',
    '¿Quedan 2 botes de resina? Mirar el lunes',
    '¿Dónde está la tarjeta SD de la boda Sánchez?',
    'Papel fotográfico: queda poco (a ojo)',
  ],
};

// ---------------------------------------------------------------------------
// EL PROCESO DE DIGITALIZACIÓN
// ---------------------------------------------------------------------------
const choca = (a, b) => a.dia === b.dia && a.sala === b.sala && a.inicio < b.inicio + b.dur && b.inicio < a.inicio + a.dur;

// Busca el hueco libre más cercano a lo pedido: mismo día y sala (antes o después),
// luego los días siguientes y, si no hay, otra sala a la misma hora
function buscarHueco(r, ocupadas) {
  const libre = (c) => c.inicio >= APERTURA && c.inicio + c.dur <= CIERRE && !ocupadas.some((o) => choca(c, o));
  for (let d = r.dia; d < DIAS.length; d++) {
    const opciones = [];
    for (let t = APERTURA; t + r.dur <= CIERRE; t += 30) {
      const c = { ...r, dia: d, inicio: t };
      if (libre(c)) opciones.push(c);
    }
    if (opciones.length) return opciones.sort((x, y) => Math.abs(x.inicio - r.inicio) - Math.abs(y.inicio - r.inicio) || y.inicio - x.inicio)[0];
  }
  for (const s of Object.keys(SALAS)) {
    const c = { ...r, sala: s };
    if (libre(c)) return c;
  }
  return null;
}

export function digitalizar(agenda) {
  const ordenadas = [...agenda.reservas].sort((a, b) => a.dia - b.dia || a.inicio - b.inicio);
  const asignadas = [], solapes = [], finales = [];
  for (const r0 of ordenadas) {
    let r = { ...r0, origen: { dia: r0.dia, inicio: r0.inicio, sala: r0.sala } };
    if (!r.sala) {
      // sala sin apuntar: se asigna la primera libre a esa hora
      const s = Object.keys(SALAS).find((k) => !finales.some((o) => choca({ ...r, sala: k }, o))) || 'multiusos';
      r = { ...r, sala: s, asignada: true };
      asignadas.push(r);
    }
    const contra = finales.find((o) => choca(r, o));
    if (contra) {
      const nueva = buscarHueco(r, finales);
      solapes.push({ reserva: r, contra, nueva });
      if (nueva) finales.push({ ...nueva, movida: true });
    } else finales.push(r);
  }
  const tareas = agenda.notas.filter((n) => n.trim()).map((n) => {
    if (/resina|papel|stock|queda|botes?/i.test(n)) return { nota: n, destino: 'Inventario con alerta de mínimos', icono: 'stock' };
    if (/llamar|avisar|tel[eé]fono|contesta/i.test(n)) return { nota: n, destino: 'Aviso automático por WhatsApp', icono: 'whatsapp' };
    if (/d[oó]nde|perdid|tarjeta|sd\b/i.test(n)) return { nota: n, destino: 'Material etiquetado y localizado', icono: 'material' };
    return { nota: n, destino: 'Tarea en el tablero Kanban', icono: 'kanban' };
  });
  return { leidas: ordenadas.length, asignadas, solapes, finales, tareas };
}

// ---------------------------------------------------------------------------
// SALAS: CÓMO ERAN ANTES
// ---------------------------------------------------------------------------
const SALAS_ANTES = [
  {
    img: 'assets/img/antes-multiusos.jpg', titulo: 'Sala Multiusos',
    nota: 'Martes, 11:00: llegan a la vez Cerámicas Luna y Ana para sus fotos de carnet. Las dos estaban apuntadas… en hojas distintas.',
    problemas: ['Reservas a lápiz en la agenda de recepción', 'Nadie sabía si la sala estaba libre sin bajar a mirarla', 'El ciclorama se pintaba «cuando se veía sucio»'],
  },
  {
    img: 'assets/img/antes-bbc.jpg', titulo: 'Sala Eventos BBC',
    nota: 'Dos familias citadas el mismo miércoles a las 17:00. El álbum de una comunión se entregó con tres semanas de retraso: nadie avisó de que estaba listo.',
    problemas: ['Bodas, bautizos y comuniones en hojas sueltas', 'Avisos a las familias solo por teléfono', 'Los álbumes se acumulaban sin seguimiento'],
  },
  {
    img: 'assets/img/antes-cine.jpg', titulo: 'Sala Cine de Acción',
    nota: 'El rodaje de «Zeta» se alargó dos horas y pisó el videoclip siguiente. El foco LED n.º 3 estuvo dos semanas «perdido»: estaba en el maletero de un cliente.',
    problemas: ['Material prestado sin apuntar', 'Rodajes que se alargaban sin control', 'Máquinas de humo sin revisión registrada'],
  },
];

export function SalasAntes() {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      {SALAS_ANTES.map((s) => (
        <article key={s.titulo} className="rounded-xl overflow-hidden border border-[#8D93AB]/30 bg-[#151720] flex flex-col">
          <div className="relative">
            <img src={s.img} alt={`${s.titulo} antes de la digitalización`} className="w-full h-48 object-cover [filter:sepia(0.75)_grayscale(0.35)_contrast(0.95)_brightness(0.9)]" loading="lazy" />
            <span className="absolute top-3 left-3 px-2 py-1 rounded bg-black/70 text-xs font-bold tracking-wider uppercase text-[#FFD9B0]">Así era · 2025</span>
          </div>
          <div className="p-5 flex-1 flex flex-col gap-4">
            <h3 className="text-xl font-bold text-white">{s.titulo}</h3>
            <p className="font-mano text-xl leading-snug text-[#1f3a93] bg-[#fff59d] p-3 rounded-sm shadow-md -rotate-1">{s.nota}</p>
            <ul className="space-y-1.5 text-sm text-[#8D93AB]">
              {s.problemas.map((p) => (
                <li key={p} className="flex gap-2"><AlertTriangle className="w-4 h-4 text-[#F28482] shrink-0 mt-0.5" />{p}</li>
              ))}
            </ul>
          </div>
        </article>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// AGENDA DE PAPEL (editable)
// ---------------------------------------------------------------------------
const tinta = 'text-[#1f3a93]';
const campo = 'bg-transparent border-b border-dashed border-[#1f3a93]/50 font-mano text-xl text-[#1f3a93] focus:outline-none focus:border-[#c0392b] min-w-0';

function LineaReserva({ r, editando, onEditar, onGuardar, onBorrar, giro }) {
  const [b, setB] = useState(r);
  useEffect(() => setB(r), [r, editando]);
  if (!editando) {
    return (
      <button type="button" onClick={onEditar} className={`group w-full text-left flex items-baseline gap-2 min-h-[32px] leading-8 ${tinta} hover:bg-[#1f3a93]/5 rounded`} style={{ transform: `rotate(${giro}deg)` }}>
        <span className="font-mano text-xl font-bold text-[#c0392b] w-14 shrink-0">{hora(r.inicio)}</span>
        <span className="font-mano text-[22px] flex-1">
          {r.texto || '(sin nombre)'}
          <span className="text-[#1f3a93]/70"> · {r.sala ? SALAS[r.sala].corto : '¿sala?'}</span>
          <span className="text-[#1f3a93]/50 text-lg"> ({durTxt(r.dur)})</span>
        </span>
        <Pencil className="w-4 h-4 opacity-30 group-hover:opacity-80 shrink-0" />
      </button>
    );
  }
  return (
    <div className="flex flex-wrap items-end gap-2 py-2 px-1 rounded bg-[#1f3a93]/5">
      <select aria-label="Hora" value={b.inicio} onChange={(e) => setB({ ...b, inicio: Number(e.target.value) })} className={`${campo} w-[72px]`}>
        {HORAS.map((m) => <option key={m} value={m}>{hora(m)}</option>)}
      </select>
      <input aria-label="Qué" autoFocus value={b.texto} onChange={(e) => setB({ ...b, texto: e.target.value })} placeholder="¿Quién? ¿Qué?" className={`${campo} flex-1 basis-40`} />
      <select aria-label="Sala" value={b.sala} onChange={(e) => setB({ ...b, sala: e.target.value })} className={`${campo} w-[110px]`}>
        <option value="">¿sala?</option>
        {Object.entries(SALAS).map(([k, s]) => <option key={k} value={k}>{s.corto}</option>)}
      </select>
      <select aria-label="Duración" value={b.dur} onChange={(e) => setB({ ...b, dur: Number(e.target.value) })} className={`${campo} w-[80px]`}>
        {DURACIONES.map((d) => <option key={d} value={d}>{durTxt(d)}</option>)}
      </select>
      <div className="flex gap-1 ml-auto">
        <button type="button" onClick={() => onGuardar(b)} aria-label="Guardar" className="p-1.5 rounded-full bg-[#1f3a93] text-white"><Check className="w-4 h-4" /></button>
        <button type="button" onClick={onBorrar} aria-label="Borrar" className="p-1.5 rounded-full bg-[#c0392b] text-white"><Trash2 className="w-4 h-4" /></button>
      </div>
    </div>
  );
}

function Pagina({ children, className = '' }) {
  return (
    <div
      className={`relative pl-12 pr-5 pt-10 pb-8 bg-[#f6eedb] ${className}`}
      style={{ backgroundImage: 'repeating-linear-gradient(to bottom, transparent 0, transparent 31px, rgba(31,58,147,0.16) 31px, rgba(31,58,147,0.16) 32px)', backgroundPosition: '0 8px' }}
    >
      <div className="absolute top-0 bottom-0 left-9 w-px bg-[#e57373]/70" />
      {children}
    </div>
  );
}

export function AgendaPapel({ agenda, setAgenda, onDigitalizar }) {
  const [editando, setEditando] = useState(null);
  const [editNota, setEditNota] = useState(null);

  const guardar = (b) => {
    setAgenda((a) => ({ ...a, reservas: a.reservas.map((r) => (r.id === b.id ? b : r)) }));
    setEditando(null);
  };
  const borrar = (id) => { setAgenda((a) => ({ ...a, reservas: a.reservas.filter((r) => r.id !== id) })); setEditando(null); };
  const nueva = (dia) => {
    const id = ++siguienteId + Date.now() % 100000;
    setAgenda((a) => ({ ...a, reservas: [...a.reservas, { id, dia, inicio: h('16:00'), dur: 60, sala: '', texto: '' }] }));
    setEditando(id);
  };
  const giro = (id) => ((id * 37) % 7 - 3) * 0.15;

  const dia = (d) => (
    <div key={d} className="mb-6">
      <h4 className="font-mano text-2xl font-bold text-[#c0392b] underline decoration-wavy decoration-[#c0392b]/50 underline-offset-4 mb-1">{DIAS[d]}</h4>
      {agenda.reservas.filter((r) => r.dia === d).sort((a, b) => a.inicio - b.inicio).map((r) => (
        <LineaReserva key={r.id} r={r} giro={giro(r.id)} editando={editando === r.id}
          onEditar={() => setEditando(r.id)} onGuardar={guardar} onBorrar={() => borrar(r.id)} />
      ))}
      <button type="button" onClick={() => nueva(d)} className="font-mano text-lg text-[#1f3a93]/60 hover:text-[#1f3a93] flex items-center gap-1 mt-1">
        <Plus className="w-4 h-4" /> apuntar
      </button>
    </div>
  );

  return (
    <div>
      <div className="relative mx-auto max-w-5xl">
        {/* espiral */}
        <div className="hidden md:flex absolute left-1/2 -translate-x-1/2 top-4 bottom-4 w-6 flex-col justify-between z-10 pointer-events-none">
          {Array.from({ length: 14 }).map((_, i) => <span key={i} className="block w-6 h-3 rounded-full border-2 border-[#9aa0a6] bg-[#2a2d36]" />)}
        </div>
        <div className="grid md:grid-cols-2 shadow-[0_20px_50px_rgba(0,0,0,0.6)] rounded-md overflow-hidden md:-rotate-[0.6deg]">
          <Pagina className="md:border-r md:border-[#d8ccb0]">
            <p className="absolute top-2 left-12 font-mano text-lg text-[#c0392b]">Agenda Fotarto · Noviembre 2026 · semana 47</p>
            {[0, 1, 2].map(dia)}
          </Pagina>
          <Pagina>
            {/* mancha de café */}
            <div className="absolute top-6 right-8 w-24 h-24 rounded-full border-[7px] border-[#8b5a2b]/20 pointer-events-none" />
            <div className="absolute top-9 right-12 w-16 h-16 rounded-full bg-[#8b5a2b]/5 pointer-events-none" />
            {[3, 4].map(dia)}
            {/* pósit de notas */}
            <div className="relative mt-2 p-4 pt-5 bg-[#fff59d] shadow-lg rotate-1 max-w-sm">
              <span className="absolute -top-3 left-1/2 -translate-x-1/2 w-20 h-5 bg-white/60 rotate-2" />
              <p className="font-mano text-2xl font-bold text-[#c0392b] mb-1">¡Ojo! Pendientes</p>
              {agenda.notas.map((n, i) => (
                editNota === i ? (
                  <div key={i} className="flex gap-1 items-end">
                    <input autoFocus aria-label="Nota" defaultValue={n} onBlur={(e) => { const v = e.target.value; setAgenda((a) => ({ ...a, notas: a.notas.map((x, j) => (j === i ? v : x)) })); setEditNota(null); }}
                      onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} className={`${campo} flex-1`} />
                    <button type="button" aria-label="Borrar nota" onMouseDown={(e) => e.preventDefault()} onClick={() => { setAgenda((a) => ({ ...a, notas: a.notas.filter((_, j) => j !== i) })); setEditNota(null); }} className="p-1 text-[#c0392b]"><Trash2 className="w-4 h-4" /></button>
                  </div>
                ) : (
                  <button key={i} type="button" onClick={() => setEditNota(i)} className={`block w-full text-left font-mano text-xl leading-7 ${tinta} hover:bg-black/5`}>– {n || '…'}</button>
                )
              ))}
              <button type="button" onClick={() => { setAgenda((a) => ({ ...a, notas: [...a.notas, ''] })); setEditNota(agenda.notas.length); }} className="font-mano text-lg text-[#1f3a93]/60 hover:text-[#1f3a93] flex items-center gap-1 mt-1">
                <Plus className="w-4 h-4" /> nota
              </button>
            </div>
          </Pagina>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-4 mt-6 max-w-5xl mx-auto">
        <p className="text-sm text-[#8D93AB] flex items-center gap-2"><Pencil className="w-4 h-4" /> Toca cualquier línea para cambiarla, o «apuntar» para añadir una reserva.</p>
        <button type="button" onClick={() => { setAgenda(AGENDA_INICIAL); setEditando(null); }} className="text-sm text-[#8D93AB] hover:text-white flex items-center gap-1">
          <RotateCcw className="w-4 h-4" /> Volver a la agenda de ejemplo
        </button>
      </div>

      <div className="mt-10 grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {[
          { i: AlertTriangle, t: 'Solapamientos', d: 'Dos reservas en la misma sala y a la misma hora, y nadie se entera hasta que llegan los clientes.' },
          { i: PhoneMissed, t: 'Llamadas sin respuesta', d: 'Avisar de que un encargo está listo dependía de que el cliente cogiera el teléfono.' },
          { i: PackageSearch, t: 'Material perdido', d: 'Tarjetas SD y focos que nadie sabía dónde estaban.' },
          { i: Boxes, t: 'Stock «a ojo»', d: 'La resina y el papel se pedían cuando ya se habían acabado.' },
        ].map(({ i: I, t, d }) => (
          <div key={t} className="p-4 rounded-lg border border-[#F28482]/30 bg-[#F28482]/5">
            <I className="w-6 h-6 text-[#F28482] mb-2" />
            <h4 className="font-bold text-white mb-1">{t}</h4>
            <p className="text-sm text-[#8D93AB]">{d}</p>
          </div>
        ))}
      </div>

      <div className="text-center mt-10">
        <button type="button" onClick={onDigitalizar} className="inline-flex items-center gap-3 px-6 py-4 rounded-full bg-[#00E5FF] text-[#0B0C10] font-bold text-lg hover:bg-white transition-colors glow-box">
          <ScanLine className="w-6 h-6" /> Pasar esta agenda al sistema digital <ArrowRight className="w-5 h-5" />
        </button>
        <p className="text-sm text-[#8D93AB] mt-3">Verás paso a paso cómo se digitaliza lo que hayas apuntado.</p>
      </div>
    </div>
  );
}

// ---------------------------------------------------------------------------
// SISTEMA DIGITAL: el proceso y el resultado
// ---------------------------------------------------------------------------
const Etiqueta = ({ sala }) => (
  <span className="inline-flex items-center gap-1.5 text-xs font-semibold" style={{ color: SALAS[sala].color }}>
    <span className="w-2 h-2 rounded-full" style={{ background: SALAS[sala].color }} />{SALAS[sala].corto}
  </span>
);
const cuando = (r) => `${DIAS[r.dia].split(' ')[0].toLowerCase()} ${DIAS[r.dia].split(' ')[1]} a las ${hora(r.inicio)}`;

function Paso({ n, visible, icono: I, titulo, children, ok = true }) {
  return (
    <li className={`relative pl-14 pb-8 transition-all duration-500 ${visible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-3'}`}>
      <span className={`absolute left-0 top-0 w-10 h-10 rounded-full flex items-center justify-center border-2 ${ok ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF]' : 'border-[#FFD166] bg-[#FFD166]/10 text-[#FFD166]'}`}>
        <I className="w-5 h-5" />
      </span>
      <span className="absolute left-5 top-11 bottom-1 w-px bg-[#8D93AB]/30" />
      <p className="text-xs uppercase tracking-widest text-[#8D93AB]">Paso {n}</p>
      <h4 className="text-lg font-bold text-white mb-2">{titulo}</h4>
      <div className="text-sm text-[#8D93AB] space-y-2">{children}</div>
    </li>
  );
}

const KANBAN_INICIAL = [
  { id: 'k1', t: 'Funko 3D – Marta', col: 0 },
  { id: 'k2', t: 'Funko 3D – Pedro', col: 1 },
  { id: 'k3', t: 'Restauración foto de la abuela – Carmen', col: 1 },
  { id: 'k4', t: 'Funkos pareja – boda Sánchez-Ortega', col: 0 },
];
const COLUMNAS = ['Pendiente', 'En curso', 'Terminado'];

export function ProcesoDigital({ agenda, ejecucion, onVolver }) {
  const res = useMemo(() => digitalizar(agenda), [agenda]);
  const [paso, setPaso] = useState(0);
  const [extra, setExtra] = useState([]);
  const [form, setForm] = useState({ texto: '', sala: 'bbc', dia: 2, inicio: h('17:00'), dur: 60 });
  const [aviso, setAviso] = useState(null);
  const [kanban, setKanban] = useState(KANBAN_INICIAL);
  const [resina, setResina] = useState(5);
  const [mensajes, setMensajes] = useState([]);

  // animación del proceso, paso a paso
  useEffect(() => {
    setPaso(0);
    const t = [1, 2, 3, 4, 5, 6].map((n) => setTimeout(() => setPaso(n), n * 650));
    return () => t.forEach(clearTimeout);
  }, [ejecucion]);

  const ahora = () => new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' });
  useEffect(() => {
    const iniciales = res.finales.slice(0, 2).map((r) => ({ a: r.texto, t: `Fotarto: tu reserva «${r.texto}» queda confirmada el ${cuando(r)} en la ${SALAS[r.sala].nombre}.`, h: '09:00' }));
    const movidas = res.solapes.filter((s) => s.nueva).map((s) => ({ a: s.reserva.texto, t: `Fotarto: el hueco del ${cuando(s.reserva)} ya estaba ocupado, así que hemos pasado «${s.reserva.texto}» al ${cuando(s.nueva)} en la ${SALAS[s.nueva.sala].nombre}. ¿Te viene bien?`, h: '09:01', movida: true }));
    setMensajes([...movidas, ...iniciales]);
  }, [res]);

  const todas = [...res.finales, ...extra];
  const reservar = (forzar) => {
    const r = { ...form, id: Date.now(), texto: form.texto.trim() || 'Nueva reserva', ...(forzar || {}) };
    const contra = todas.find((o) => choca(r, o));
    if (contra) { setAviso({ tipo: 'error', contra, alternativa: buscarHueco(r, todas) }); return; }
    setExtra((x) => [...x, { ...r, nueva: true }]);
    setAviso({ tipo: 'ok', r });
    setMensajes((m) => [{ a: r.texto, t: `Fotarto: tu reserva «${r.texto}» queda confirmada el ${cuando(r)} en la ${SALAS[r.sala].nombre}.`, h: ahora() }, ...m]);
  };

  const avanzar = (id) => {
    const c = kanban.find((k) => k.id === id);
    if (!c || c.col >= 2) return;
    const col = c.col + 1;
    setKanban((k) => k.map((x) => (x.id === id ? { ...x, col } : x)));
    if (col === 1 && /funko/i.test(c.t)) setResina((x) => Math.max(0, x - 1));
    if (col === 2) {
      const nombre = c.t.split('–')[1]?.trim() || 'cliente';
      setMensajes((m) => [{ a: nombre, t: `Hola, ${nombre}: tu encargo «${c.t.split('–')[0].trim()}» ya está listo para recoger en Fotarto. ¡Te esperamos!`, h: ahora() }, ...m]);
    }
  };
  const MIN_RESINA = 4;

  return (
    <div className="space-y-14">
      {/* PROCESO */}
      <div className="grid lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] gap-10 items-start">
        <div>
          <h3 className="text-2xl font-playfair font-bold text-white mb-2">Ejemplo del proceso</h3>
          <p className="text-[#8D93AB] mb-6">Así pasa la agenda de papel de <em>De dónde venimos</em> al sistema en la nube. Si cambias la agenda, el proceso se recalcula con tus datos.</p>
          <ol>
            <Paso n={1} visible={paso >= 1} icono={ScanLine} titulo="Leer la agenda">
              <p>Se pasan al sistema <strong className="text-white">{res.leidas} reservas</strong> y <strong className="text-white">{res.tareas.length} notas</strong> escritas a mano.</p>
            </Paso>
            <Paso n={2} visible={paso >= 2} icono={Sparkles} titulo="Completar datos que faltaban" ok={res.asignadas.length === 0}>
              {res.asignadas.length === 0 ? <p>Todas las reservas tenían sala.</p> : res.asignadas.map((r) => (
                <p key={r.id}>«{r.texto}» no tenía sala apuntada → se le asigna la <span style={{ color: SALAS[r.sala].color }} className="font-semibold">{SALAS[r.sala].nombre}</span>, libre a esa hora.</p>
              ))}
            </Paso>
            <Paso n={3} visible={paso >= 3} icono={AlertTriangle} titulo="Detectar solapamientos" ok={res.solapes.length === 0}>
              {res.solapes.length === 0 ? <p>No hay ninguna reserva que choque. ¡Perfecto!</p> : res.solapes.map(({ reserva, contra, nueva }) => (
                <div key={reserva.id} className="p-3 rounded-md border border-[#FFD166]/40 bg-[#FFD166]/5">
                  <p><strong className="text-white">«{reserva.texto}»</strong> choca con «{contra.texto}» en la {SALAS[contra.sala].nombre} ({cuando(contra)}).</p>
                  {nueva ? <p className="text-[#00E5FF] mt-1">→ Hueco libre más cercano: {cuando(nueva)}{nueva.sala !== reserva.sala ? `, ${SALAS[nueva.sala].nombre}` : ''}.</p> : <p className="text-[#F28482] mt-1">→ No hay hueco esta semana: se avisa al cliente para otra fecha.</p>}
                </div>
              ))}
            </Paso>
            <Paso n={4} visible={paso >= 4} icono={CalendarCheck} titulo="Crear las reservas en la nube">
              <p><strong className="text-white">{res.finales.length} reservas</strong> confirmadas, sin ningún choque. Desde ahora, el sistema impide reservar un hueco ocupado.</p>
            </Paso>
            <Paso n={5} visible={paso >= 5} icono={Boxes} titulo="Convertir las notas en tareas">
              {res.tareas.length === 0 ? <p>No había notas sueltas.</p> : res.tareas.map((t, i) => (
                <p key={i}><span className="font-mano text-lg text-[#FFF59D]">«{t.nota}»</span> → <span className="text-white">{t.destino}</span></p>
              ))}
            </Paso>
            <Paso n={6} visible={paso >= 6} icono={MessageCircle} titulo="Avisar a los clientes">
              <p>Se envía un WhatsApp automático a cada cliente{res.solapes.length ? ', y a quien se le ha movido la reserva se le propone el nuevo hueco' : ''}. Nadie tiene que coger el teléfono.</p>
            </Paso>
          </ol>
          <button type="button" onClick={onVolver} className="text-sm text-[#8D93AB] hover:text-white flex items-center gap-2"><ArrowLeft className="w-4 h-4" /> Volver a la agenda de papel para cambiarla</button>
        </div>

        {/* WHATSAPP */}
        <div className="mx-auto w-full max-w-sm lg:sticky lg:top-[calc(var(--alto-cabecera,200px)+16px)] rounded-[2rem] border-4 border-[#2A2D36] bg-[#0b141a] overflow-hidden shadow-2xl">
          <div className="flex items-center gap-3 px-4 py-3 bg-[#202c33]">
            <span className="w-9 h-9 rounded-full bg-[#00E5FF] text-[#0B0C10] font-bold flex items-center justify-center">F</span>
            <div><p className="text-white text-sm font-semibold">Fotarto · Avisos</p><p className="text-[11px] text-[#8D93AB]">mensajes automáticos</p></div>
            <MessageCircle className="w-5 h-5 text-[#8D93AB] ml-auto" />
          </div>
          <div className="p-3 space-y-2 h-[420px] overflow-y-auto" style={{ backgroundImage: 'radial-gradient(rgba(255,255,255,0.03) 1px, transparent 1px)', backgroundSize: '14px 14px' }}>
            {mensajes.map((m, i) => (
              <div key={i} className={`max-w-[88%] rounded-lg px-3 py-2 text-[13px] leading-snug ${m.movida ? 'bg-[#4d3b00]' : 'bg-[#005c4b]'} text-[#e9edef] ${i === 0 ? 'animate-in' : ''}`}>
                {m.t}
                <span className="block text-right text-[10px] text-white/50 mt-1">{m.h} ✓✓</span>
              </div>
            ))}
          </div>
        </div>

      </div>

      {/* CALENDARIO A TODO EL ANCHO */}
        <div className={`transition-opacity duration-700 ${paso >= 4 ? 'opacity-100' : 'opacity-30'}`}>
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-xl font-bold text-white flex items-center gap-2"><CalendarCheck className="w-5 h-5 text-[#00E5FF]" /> Reservas · semana 47</h3>
            <div className="flex gap-3">{Object.keys(SALAS).map((s) => <Etiqueta key={s} sala={s} />)}</div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-5 gap-3">
            {DIAS.map((d, i) => (
              <div key={d} className="rounded-lg bg-[#151720] border border-[#8D93AB]/25 p-3 min-h-[120px]">
                <p className="text-xs uppercase tracking-wider text-[#8D93AB] mb-2">{d}</p>
                <div className="space-y-2">
                  {todas.filter((r) => r.dia === i).sort((a, b) => a.inicio - b.inicio).map((r) => (
                    <div key={r.id} className="rounded-md p-2 text-xs bg-[#0B0C10]" style={{ borderLeft: `3px solid ${SALAS[r.sala].color}` }}>
                      <p className="text-white font-semibold flex items-center gap-1"><Clock className="w-3 h-3" />{hora(r.inicio)}–{hora(r.inicio + r.dur)}</p>
                      <p className="text-[#C9CDD8] leading-snug">{r.texto}</p>
                      <Etiqueta sala={r.sala} />
                      {r.movida && <p className="mt-1 text-[#FFD166]">Movida (antes {cuando(r.origen)})</p>}
                      {r.asignada && <p className="mt-1 text-[#00E5FF]">Sala asignada por el sistema</p>}
                      {r.nueva && <p className="mt-1 text-[#38E86B]">Reservada online</p>}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* PRUEBA DE RESERVA */}
          <div className="mt-6 p-5 rounded-xl border border-[#00E5FF]/40 bg-[#00E5FF]/5">
            <h4 className="font-bold text-white mb-1">Pruébalo: reserva como un cliente</h4>
            <p className="text-sm text-[#8D93AB] mb-4">Intenta reservar un hueco ocupado (por ejemplo, la Sala BBC el miércoles a las 17:00) y mira qué hace el sistema.</p>
            <div className="grid grid-cols-2 md:grid-cols-5 gap-2 max-w-4xl">
              <input value={form.texto} onChange={(e) => setForm({ ...form, texto: e.target.value })} placeholder="Tu nombre" aria-label="Nombre" className="col-span-2 md:col-span-1 bg-[#0B0C10] border border-[#8D93AB]/50 rounded-md p-2 text-white text-sm focus:outline-none focus:border-[#00E5FF]" />
              <select aria-label="Sala" value={form.sala} onChange={(e) => setForm({ ...form, sala: e.target.value })} className="bg-[#0B0C10] border border-[#8D93AB]/50 rounded-md p-2 text-white text-sm">
                {Object.entries(SALAS).map(([k, s]) => <option key={k} value={k}>{s.corto}</option>)}
              </select>
              <select aria-label="Día" value={form.dia} onChange={(e) => setForm({ ...form, dia: Number(e.target.value) })} className="bg-[#0B0C10] border border-[#8D93AB]/50 rounded-md p-2 text-white text-sm">
                {DIAS.map((d, i) => <option key={d} value={i}>{d}</option>)}
              </select>
              <select aria-label="Hora" value={form.inicio} onChange={(e) => setForm({ ...form, inicio: Number(e.target.value) })} className="bg-[#0B0C10] border border-[#8D93AB]/50 rounded-md p-2 text-white text-sm">
                {HORAS.map((m) => <option key={m} value={m}>{hora(m)}</option>)}
              </select>
              <select aria-label="Duración" value={form.dur} onChange={(e) => setForm({ ...form, dur: Number(e.target.value) })} className="bg-[#0B0C10] border border-[#8D93AB]/50 rounded-md p-2 text-white text-sm">
                {DURACIONES.map((d) => <option key={d} value={d}>{durTxt(d)}</option>)}
              </select>
            </div>
            <button type="button" onClick={() => reservar()} className="mt-3 w-full md:w-auto px-5 py-2.5 rounded-md bg-[#00E5FF] text-[#0B0C10] font-bold text-sm hover:bg-white transition-colors">Comprobar y reservar</button>
            {aviso?.tipo === 'error' && (
              <div className="mt-3 p-3 rounded-md border border-[#F28482]/50 bg-[#F28482]/10 text-sm">
                <p className="text-white"><strong>Ese hueco está ocupado</strong> por «{aviso.contra.texto}» ({hora(aviso.contra.inicio)}–{hora(aviso.contra.inicio + aviso.contra.dur)}). En papel, esto habría sido un solapamiento.</p>
                {aviso.alternativa && (
                  <button type="button" onClick={() => { setForm({ ...form, dia: aviso.alternativa.dia, inicio: aviso.alternativa.inicio, sala: aviso.alternativa.sala }); reservar({ dia: aviso.alternativa.dia, inicio: aviso.alternativa.inicio, sala: aviso.alternativa.sala }); }}
                    className="mt-2 inline-flex items-center gap-2 px-3 py-1.5 rounded-md bg-[#0B0C10] border border-[#00E5FF] text-[#00E5FF] font-semibold">
                    Reservar el hueco libre más cercano: {cuando(aviso.alternativa)} <ArrowRight className="w-4 h-4" />
                  </button>
                )}
              </div>
            )}
            {aviso?.tipo === 'ok' && (
              <p className="mt-3 text-sm text-[#38E86B] flex items-center gap-2"><CheckCircle2 className="w-4 h-4" /> Reserva confirmada: {cuando(aviso.r)} en la {SALAS[aviso.r.sala].nombre}. Te llega el WhatsApp de confirmación.</p>
            )}
          </div>
        </div>

      {/* KANBAN + STOCK */}
      <div className="grid lg:grid-cols-[minmax(0,1.6fr)_minmax(0,1fr)] gap-8 items-start">
        <div className="contents">
          <div>
            <h3 className="text-xl font-bold text-white mb-1">Tablero Kanban · Funkos 3D y restauraciones</h3>
            <p className="text-sm text-[#8D93AB] mb-4">Pulsa «Avanzar» para mover un encargo. Al terminarlo, el cliente recibe el aviso por WhatsApp; al empezar un Funko, se descuenta la resina.</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              {COLUMNAS.map((c, ci) => (
                <div key={c} className="rounded-lg bg-[#151720] border border-[#8D93AB]/25 p-3 min-h-[160px]">
                  <p className="text-xs uppercase tracking-wider mb-3 font-bold" style={{ color: ['#8D93AB', '#FFD166', '#38E86B'][ci] }}>{c} · {kanban.filter((k) => k.col === ci).length}</p>
                  <div className="space-y-2">
                    {kanban.filter((k) => k.col === ci).map((k) => (
                      <div key={k.id} className="rounded-md bg-[#0B0C10] border border-[#8D93AB]/25 p-2.5 text-sm">
                        <p className="text-white">{k.t}</p>
                        {ci < 2 ? (
                          <button type="button" onClick={() => avanzar(k.id)} className="mt-2 text-xs font-semibold text-[#00E5FF] flex items-center gap-1 hover:text-white">Avanzar <ArrowRight className="w-3 h-3" /></button>
                        ) : <p className="mt-1 text-xs text-[#38E86B] flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Cliente avisado</p>}
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div>
            <h3 className="text-xl font-bold text-white mb-4">Inventario con alertas</h3>
            <div className="space-y-4">
              {[
                { n: 'Resina premium (botes)', v: resina, max: 12, min: MIN_RESINA },
                { n: 'Papel fotográfico A4 (hojas)', v: 140, max: 500, min: 100 },
              ].map((s) => {
                const bajo = s.v < s.min;
                return (
                  <div key={s.n}>
                    <div className="flex justify-between text-sm mb-1"><span className="text-white">{s.n}</span><span className={bajo ? 'text-[#F28482] font-bold' : 'text-[#8D93AB]'}>{s.v} · mínimo {s.min}</span></div>
                    <div className="h-2.5 rounded-full bg-[#2A2D36] overflow-hidden"><div className="h-full rounded-full transition-all duration-500" style={{ width: `${(s.v / s.max) * 100}%`, background: bajo ? '#F28482' : '#00E5FF' }} /></div>
                    {bajo && <p className="text-xs text-[#F28482] mt-1 flex items-center gap-1"><AlertTriangle className="w-3 h-3" /> Por debajo del mínimo: pedido automático de 6 botes enviado al proveedor.</p>}
                  </div>
                );
              })}
              <div className="flex items-center gap-3 text-sm p-3 rounded-md bg-[#151720] border border-[#8D93AB]/25">
                <PackageSearch className="w-5 h-5 text-[#00E5FF] shrink-0" />
                <p className="text-[#8D93AB]"><span className="text-white font-semibold">Tarjeta SD-07 · Boda Sánchez-Ortega</span> — localizada: armario 2, cajón B (etiquetada al entrar en el estudio).</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* ANTES / AHORA */}
      <div>
        <h3 className="text-2xl font-playfair font-bold text-white mb-4">Antes y ahora</h3>
        <div className="overflow-x-auto rounded-xl border border-[#8D93AB]/30">
          <table className="w-full text-sm">
            <thead><tr className="bg-[#151720] text-left"><th className="p-3 text-[#F28482]">Antes (papel)</th><th className="p-3 text-[#00E5FF]">Ahora (digital)</th></tr></thead>
            <tbody>
              {[
                ['Agenda de papel en recepción', 'Reservas online en la nube, en tiempo real'],
                ['Solapamientos descubiertos al llegar el cliente', 'El sistema no deja reservar un hueco ocupado y propone el hueco libre más cercano'],
                ['Llamadas sin respuesta para avisar', 'WhatsApp automático al terminar cada encargo'],
                ['Encargos en notas sueltas', 'Tablero Kanban: pendiente, en curso, terminado'],
                ['Stock de resina y papel «a ojo»', 'Inventario con mínimos y pedido automático'],
                ['Material que se pierde', 'Material etiquetado y localizado'],
              ].map(([a, b]) => (
                <tr key={a} className="border-t border-[#8D93AB]/20"><td className="p-3 text-[#8D93AB]">{a}</td><td className="p-3 text-white">{b}</td></tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
