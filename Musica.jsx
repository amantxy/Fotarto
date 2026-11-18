import React, { useEffect, useRef, useState } from 'react';
import { Music, X, Play, Pause, SkipBack, SkipForward, Shuffle, Repeat, Volume2, Upload, Link2, Trash2, ListMusic, Minus } from 'lucide-react';

// ---------------------------------------------------------------------------
// Reproductor flotante: «Añade tu propia playlist» y reprodúcela durante tu sesión.
// Canciones subidas desde el dispositivo (no salen de él) o enlace de Spotify,
// YouTube o SoundCloud. Sigue sonando al cambiar de pestaña.
// ---------------------------------------------------------------------------
const tiempo = (s) => (Number.isFinite(s) ? `${Math.floor(s / 60)}:${String(Math.floor(s % 60)).padStart(2, '0')}` : '0:00');
const limpiaNombre = (n) => n.replace(/\.[^.]+$/, '').replace(/[_]+/g, ' ').trim();

// Convierte un enlace normal en uno que se puede incrustar
export function enlaceIncrustable(url) {
  try {
    const u = new URL(url.trim());
    const host = u.hostname.replace(/^www\./, '');
    if (host === 'open.spotify.com') {
      const m = u.pathname.match(/\/(playlist|album|track|artist|episode|show)\/([A-Za-z0-9]+)/);
      if (m) return { tipo: 'Spotify', src: `https://open.spotify.com/embed/${m[1]}/${m[2]}`, alto: 352 };
    }
    if (host === 'youtube.com' || host === 'm.youtube.com' || host === 'music.youtube.com') {
      const lista = u.searchParams.get('list');
      if (lista) return { tipo: 'YouTube', src: `https://www.youtube.com/embed/videoseries?list=${lista}`, alto: 220 };
      const v = u.searchParams.get('v');
      if (v) return { tipo: 'YouTube', src: `https://www.youtube.com/embed/${v}`, alto: 220 };
    }
    if (host === 'youtu.be') return { tipo: 'YouTube', src: `https://www.youtube.com/embed/${u.pathname.slice(1)}`, alto: 220 };
    if (host === 'soundcloud.com') return { tipo: 'SoundCloud', src: `https://w.soundcloud.com/player/?url=${encodeURIComponent(u.href)}&color=%2300e5ff&visual=false`, alto: 300 };
  } catch (e) { /* enlace no válido */ }
  return null;
}

export default function Musica() {
  const audio = useRef(null);
  const [abierto, setAbierto] = useState(false);
  const [modo, setModo] = useState('canciones');
  const [lista, setLista] = useState([]); // { id, nombre, url }
  const [actual, setActual] = useState(-1);
  const [sonando, setSonando] = useState(false);
  const [pos, setPos] = useState(0);
  const [dur, setDur] = useState(0);
  const [vol, setVol] = useState(0.8);
  const [aleatorio, setAleatorio] = useState(false);
  const [repetir, setRepetir] = useState(false);
  const [enlace, setEnlace] = useState(() => { try { return localStorage.getItem('fotarto-playlist') || ''; } catch (e) { return ''; } });
  const [texto, setTexto] = useState(enlace);
  const [error, setError] = useState('');

  const listaRef = useRef(lista);
  listaRef.current = lista;
  const incrustado = enlace ? enlaceIncrustable(enlace) : null;
  const cancion = lista[actual];

  const reproducir = (i) => {
    const l = listaRef.current;
    if (i < 0 || i >= l.length) return;
    setActual(i);
    const a = audio.current;
    a.src = l[i].url;
    a.play().then(() => setSonando(true)).catch(() => setSonando(false));
  };
  const siguiente = (dir = 1) => {
    if (!lista.length) return;
    if (aleatorio && lista.length > 1) {
      let n; do { n = Math.floor(Math.random() * lista.length); } while (n === actual);
      reproducir(n); return;
    }
    const n = actual + dir;
    if (n >= lista.length) { if (repetir) reproducir(0); else { setSonando(false); } return; }
    reproducir(Math.max(0, n));
  };
  const alternar = () => {
    const a = audio.current;
    if (!cancion) { reproducir(0); return; }
    if (a.paused) a.play().then(() => setSonando(true)).catch(() => {}); else { a.pause(); setSonando(false); }
  };

  const anadir = (archivos) => {
    const nuevos = [...archivos].filter((f) => f.type.startsWith('audio/') || /\.(mp3|m4a|aac|wav|ogg|flac|opus)$/i.test(f.name))
      .map((f) => ({ id: `${f.name}-${f.size}-${Math.random()}`, nombre: limpiaNombre(f.name), url: URL.createObjectURL(f) }));
    if (!nuevos.length) { setError('No hemos encontrado archivos de audio. Prueba con MP3, M4A, WAV u OGG.'); return; }
    setError('');
    const empezarEn = listaRef.current.length;
    const r = [...listaRef.current, ...nuevos];
    listaRef.current = r;
    setLista(r);
    if (actual === -1 || !sonando) reproducir(empezarEn);
  };
  const quitar = (i) => {
    URL.revokeObjectURL(lista[i].url);
    setLista((l) => l.filter((_, j) => j !== i));
    if (i === actual) { audio.current.pause(); audio.current.removeAttribute('src'); setSonando(false); setActual(-1); }
    else if (i < actual) setActual((a) => a - 1);
  };
  const guardarEnlace = () => {
    if (!texto.trim()) { setEnlace(''); try { localStorage.removeItem('fotarto-playlist'); } catch (e) { /* */ } return; }
    if (!enlaceIncrustable(texto)) { setError('Pega un enlace de Spotify, YouTube o SoundCloud (por ejemplo, el de «Compartir» de tu playlist).'); return; }
    setError(''); setEnlace(texto.trim());
    try { localStorage.setItem('fotarto-playlist', texto.trim()); } catch (e) { /* */ }
    audio.current?.pause(); setSonando(false);
  };

  useEffect(() => { if (audio.current) audio.current.volume = vol; }, [vol]);

  // controles en la pantalla de bloqueo del móvil
  useEffect(() => {
    if (!('mediaSession' in navigator) || !cancion) return;
    navigator.mediaSession.metadata = new window.MediaMetadata({ title: cancion.nombre, artist: 'Tu playlist · Fotarto', album: 'Sesión en Fotarto' });
    navigator.mediaSession.setActionHandler('play', alternar);
    navigator.mediaSession.setActionHandler('pause', alternar);
    navigator.mediaSession.setActionHandler('nexttrack', () => siguiente(1));
    navigator.mediaSession.setActionHandler('previoustrack', () => siguiente(-1));
  });

  const Btn = ({ onClick, label, activo, children, grande }) => (
    <button type="button" onClick={onClick} aria-label={label} title={label} aria-pressed={activo}
      className={`${grande ? 'w-12 h-12 bg-[#00E5FF] text-[#0B0C10] hover:bg-white' : `w-9 h-9 ${activo ? 'text-[#00E5FF]' : 'text-[#C9CDD8] hover:text-white'}`} rounded-full flex items-center justify-center transition-colors`}>
      {children}
    </button>
  );

  return (
    <div className="font-montserrat">
      <audio ref={audio} onTimeUpdate={(e) => setPos(e.currentTarget.currentTime)} onLoadedMetadata={(e) => setDur(e.currentTarget.duration)}
        onEnded={() => (repetir && lista.length === 1 ? reproducir(actual) : siguiente(1))} onPause={() => setSonando(false)} onPlay={() => setSonando(true)} />

      {/* botón lateral */}
      {!abierto && (
        <button type="button" onClick={() => setAbierto(true)} aria-label="Abrir el reproductor: añade tu propia playlist"
          className="fixed z-[80] right-0 top-1/2 -translate-y-1/2 flex flex-col items-center gap-2 pl-2.5 pr-2 py-4 rounded-l-2xl bg-[#00E5FF] text-[#0B0C10] shadow-[0_0_25px_rgba(0,229,255,0.45)] hover:pr-3 transition-all">
          {sonando ? (
            <span className="flex items-end gap-[3px] h-5" aria-hidden="true">
              {[0, 1, 2, 3].map((i) => <span key={i} className="w-[3px] bg-[#0B0C10] rounded-full animate-[eq_0.9s_ease-in-out_infinite]" style={{ animationDelay: `${i * 0.15}s`, height: '100%' }} />)}
            </span>
          ) : <Music className="w-5 h-5" />}
          <span className="[writing-mode:vertical-rl] rotate-180 text-[11px] font-extrabold tracking-[0.2em]">TU PLAYLIST</span>
        </button>
      )}

      {/* panel */}
      <aside aria-label="Reproductor de música"
        className={`fixed z-[80] right-0 sm:right-4 bottom-0 sm:bottom-auto sm:top-1/2 sm:-translate-y-1/2 w-full sm:w-[360px] max-h-[85vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl border-2 border-[#00E5FF] bg-[#0E1016]/95 backdrop-blur shadow-[0_0_35px_rgba(0,229,255,0.3)] transition-all duration-300 ${abierto ? 'opacity-100 translate-x-0' : 'opacity-0 pointer-events-none translate-x-8'}`}>
        <div className="p-5">
          <div className="flex items-start justify-between gap-3 mb-1">
            <div>
              <p className="text-[#00E5FF] font-extrabold tracking-[0.12em] text-sm">AÑADE TU PROPIA PLAYLIST</p>
              <p className="text-xs text-[#8D93AB]">…y reprodúcela durante tu sesión</p>
            </div>
            <div className="flex">
              <button type="button" onClick={() => setAbierto(false)} aria-label="Minimizar (la música sigue sonando)" title="Minimizar" className="p-1.5 text-[#8D93AB] hover:text-white"><Minus className="w-5 h-5" /></button>
              <button type="button" onClick={() => { audio.current.pause(); setAbierto(false); }} aria-label="Cerrar y pausar" title="Cerrar y pausar" className="p-1.5 text-[#8D93AB] hover:text-white"><X className="w-5 h-5" /></button>
            </div>
          </div>

          <div className="flex gap-2 my-4">
            {[['canciones', 'Tus canciones', ListMusic], ['enlace', 'Enlace de playlist', Link2]].map(([k, t, I]) => (
              <button key={k} type="button" onClick={() => { setModo(k); setError(''); }} aria-pressed={modo === k}
                className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-full text-xs font-bold border ${modo === k ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF]' : 'border-[#8D93AB]/40 text-[#8D93AB]'}`}>
                <I className="w-4 h-4" />{t}
              </button>
            ))}
          </div>

          {modo === 'canciones' && (
            <>
              <div className="rounded-xl bg-[#151720] border border-[#8D93AB]/25 p-4">
                <p className="text-white font-semibold truncate">{cancion ? cancion.nombre : 'Ninguna canción todavía'}</p>
                <p className="text-xs text-[#8D93AB] mb-3">{cancion ? `${actual + 1} de ${lista.length}` : 'Sube tus canciones para empezar'}</p>
                <input type="range" aria-label="Progreso" min="0" max={dur || 0} step="0.1" value={Math.min(pos, dur || 0)} disabled={!cancion}
                  onChange={(e) => { audio.current.currentTime = Number(e.target.value); setPos(Number(e.target.value)); }} className="w-full accent-[#00E5FF]" />
                <div className="flex justify-between text-[11px] text-[#8D93AB] -mt-1"><span>{tiempo(pos)}</span><span>{tiempo(dur)}</span></div>
                <div className="flex items-center justify-between mt-2">
                  <Btn onClick={() => setAleatorio((x) => !x)} label="Aleatorio" activo={aleatorio}><Shuffle className="w-4 h-4" /></Btn>
                  <Btn onClick={() => (pos > 3 ? (audio.current.currentTime = 0) : siguiente(-1))} label="Anterior"><SkipBack className="w-5 h-5" /></Btn>
                  <Btn onClick={alternar} label={sonando ? 'Pausar' : 'Reproducir'} grande>{sonando ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-0.5" />}</Btn>
                  <Btn onClick={() => siguiente(1)} label="Siguiente"><SkipForward className="w-5 h-5" /></Btn>
                  <Btn onClick={() => setRepetir((x) => !x)} label="Repetir" activo={repetir}><Repeat className="w-4 h-4" /></Btn>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <Volume2 className="w-4 h-4 text-[#8D93AB]" />
                  <input type="range" aria-label="Volumen" min="0" max="1" step="0.01" value={vol} onChange={(e) => setVol(Number(e.target.value))} className="flex-1 accent-[#00E5FF]" />
                </div>
              </div>

              <label className="mt-4 flex items-center justify-center gap-2 px-4 py-3 rounded-full border-2 border-dashed border-[#00E5FF]/60 text-[#00E5FF] font-bold text-sm cursor-pointer hover:bg-[#00E5FF]/10"
                onDragOver={(e) => e.preventDefault()} onDrop={(e) => { e.preventDefault(); anadir(e.dataTransfer.files); }}>
                <Upload className="w-4 h-4" /> Añadir canciones
                <input type="file" accept="audio/*" multiple className="sr-only" onChange={(e) => { anadir(e.target.files); e.target.value = ''; }} />
              </label>

              {lista.length > 0 && (
                <ol className="mt-3 space-y-1 max-h-48 overflow-y-auto pr-1">
                  {lista.map((c, i) => (
                    <li key={c.id} className={`flex items-center gap-2 rounded-lg px-2 py-1.5 ${i === actual ? 'bg-[#00E5FF]/10' : 'hover:bg-white/5'}`}>
                      <button type="button" onClick={() => reproducir(i)} className={`flex-1 text-left text-sm truncate ${i === actual ? 'text-[#00E5FF] font-semibold' : 'text-[#C9CDD8]'}`}>
                        <span className="text-[#8D93AB] mr-2">{i + 1}.</span>{c.nombre}
                      </button>
                      <button type="button" onClick={() => quitar(i)} aria-label={`Quitar ${c.nombre}`} className="p-1 text-[#8D93AB] hover:text-[#F28482]"><Trash2 className="w-3.5 h-3.5" /></button>
                    </li>
                  ))}
                </ol>
              )}
              <p className="text-[11px] text-[#8D93AB] mt-3">Tus canciones se reproducen desde tu dispositivo: no se suben a ningún servidor.</p>
            </>
          )}

          {modo === 'enlace' && (
            <>
              <div className="flex gap-2">
                <input value={texto} onChange={(e) => setTexto(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && guardarEnlace()} placeholder="Pega aquí el enlace de tu playlist" aria-label="Enlace de la playlist"
                  className="flex-1 min-w-0 bg-[#0B0C10] border border-[#8D93AB]/50 rounded-md px-3 py-2 text-sm text-white focus:outline-none focus:border-[#00E5FF]" />
                <button type="button" onClick={guardarEnlace} className="px-3 rounded-md bg-[#00E5FF] text-[#0B0C10] font-bold text-sm hover:bg-white">Poner</button>
              </div>
              <p className="text-[11px] text-[#8D93AB] mt-2">Spotify, YouTube o SoundCloud: usa el botón «Compartir → Copiar enlace» de tu playlist.</p>
            </>
          )}

          {/* el reproductor incrustado se mantiene aunque cambies de modo o minimices, para que no se corte la música */}
          {incrustado && (
            <div className={modo === 'enlace' ? 'mt-4' : 'hidden'}>
              <p className="text-xs text-[#8D93AB] mb-2">Sonando desde {incrustado.tipo}</p>
              <iframe title={`Tu playlist de ${incrustado.tipo}`} src={incrustado.src} width="100%" height={incrustado.alto} loading="lazy"
                allow="autoplay; clipboard-write; encrypted-media; fullscreen; picture-in-picture" className="rounded-xl border-0" />
            </div>
          )}

          {error && <p className="mt-3 text-xs text-[#F28482]">{error}</p>}

          <div className="mt-4 p-3 rounded-lg bg-[#00E5FF]/10 border border-[#00E5FF]/30 text-xs text-[#C9CDD8]">
            🎧 ¿Vienes al estudio? Trae esta playlist y la pondremos en los altavoces de la sala durante tu sesión de fotos.
          </div>
        </div>
      </aside>
    </div>
  );
}
