import React from 'react';

// ---------------------------------------------------------------------------
// Boceto a mano del escáner 3D de fotogrametría y del proceso de la figura realista
// ---------------------------------------------------------------------------
const LAPIZ = '#3b3b3f';
const TQ = '#0097AE';
const mano = { fontFamily: "'Caveat', 'Segoe Print', cursive" };

// Filtro que hace temblar ligeramente las líneas, como dibujadas a lápiz
const Filtro = ({ id }) => (
  <defs>
    <filter id={id}>
      <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="2" seed="7" />
      <feDisplacementMap in="SourceGraphic" scale="2.2" />
    </filter>
    <pattern id={`${id}-rayado`} width="6" height="6" patternUnits="userSpaceOnUse" patternTransform="rotate(35)">
      <line x1="0" y1="0" x2="0" y2="6" stroke={LAPIZ} strokeWidth="0.7" opacity="0.45" />
    </pattern>
    <marker id={`${id}-flecha`} viewBox="0 0 10 10" refX="8" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse">
      <path d="M0 0 L10 5 L0 10" fill="none" stroke={LAPIZ} strokeWidth="1.6" />
    </marker>
  </defs>
);

function Camarita({ x, y, ang }) {
  return (
    <g transform={`translate(${x} ${y}) rotate(${ang})`}>
      <rect x="-9" y="-6" width="18" height="12" rx="2" fill="#f4efe4" stroke={LAPIZ} strokeWidth="1.4" />
      <circle cx="9" cy="0" r="4" fill="#f4efe4" stroke={TQ} strokeWidth="1.6" />
    </g>
  );
}

export function BocetoEscaner() {
  const postes = [-72, -48, -24, 0, 24, 48, 72];
  const cx = 320;
  return (
    <svg viewBox="0 0 640 430" className="w-full h-auto" role="img" aria-label="Boceto del escáner 3D: anillo de postes con cámaras a tres alturas alrededor de una persona sobre una plataforma giratoria, con paneles de luz difusa">
      <Filtro id="esc" />
      <rect width="640" height="430" fill="#f4efe4" />
      <g filter="url(#esc)" fill="none" stroke={LAPIZ} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
        {/* anillo superior y suelo */}
        <ellipse cx={cx} cy="70" rx="250" ry="32" strokeDasharray="7 6" />
        <ellipse cx={cx} cy="372" rx="250" ry="34" strokeDasharray="3 6" opacity="0.6" />
        {/* plataforma giratoria */}
        <path d={`M${cx - 110} 352 A110 22 0 0 0 ${cx + 110} 352 L${cx + 110} 364 A110 22 0 0 1 ${cx - 110} 364 Z`} fill="url(#esc-rayado)" />
        <ellipse cx={cx} cy="352" rx="110" ry="22" fill="#f4efe4" />
        <path d={`M${cx + 70} 386 q 40 6 60 -10`} markerEnd="url(#esc-flecha)" />
        {/* persona */}
        <circle cx={cx} cy="128" r="22" fill="#f4efe4" />
        <path d={`M${cx - 30} 160 q30 -12 60 0 l8 70 l-10 2 l-6 -48 l-2 58 l-8 98 h-14 l-4 -86 l-4 86 h-14 l-8 -98 l-2 -58 l-6 48 l-10 -2 Z`} fill="#f4efe4" />
        <path d={`M${cx - 8} 128 h0 M${cx + 8} 128 h0`} strokeWidth="3" />
        {/* paneles de luz difusa */}
        <rect x="40" y="110" width="44" height="120" rx="4" fill="url(#esc-rayado)" />
        <rect x="556" y="110" width="44" height="120" rx="4" fill="url(#esc-rayado)" />
        <path d="M84 150 l30 6 M84 180 l30 0 M84 210 l30 -6 M556 150 l-30 6 M556 180 l-30 0 M556 210 l-30 -6" strokeDasharray="3 4" opacity="0.6" />
        {/* postes con cámaras a tres alturas */}
        {postes.map((g) => {
          const r = (g * Math.PI) / 180;
          const x = cx + Math.sin(r) * 220;
          const yTop = 70 + Math.cos(r) * 26, yBot = 372 + Math.cos(r) * 28;
          return <line key={g} x1={x} y1={yTop} x2={x} y2={yBot} strokeWidth={g === 0 ? 1 : 1.8} opacity={g === 0 ? 0.35 : 1} />;
        })}
        {/* rayos de algunas cámaras hacia la persona */}
        {[-48, 48, -72, 72].map((g, i) => {
          const r = (g * Math.PI) / 180; const x = cx + Math.sin(r) * 220;
          const y = [130, 200, 270][i % 3];
          return <line key={g} x1={x} y1={y} x2={cx + (g < 0 ? -26 : 26)} y2={y - 6} stroke={TQ} strokeDasharray="4 5" strokeWidth="1.3" />;
        })}
      </g>
      {postes.filter((g) => g !== 0).map((g) => {
        const r = (g * Math.PI) / 180; const x = cx + Math.sin(r) * 220;
        return [130, 200, 270].map((y) => <Camarita key={`${g}-${y}`} x={x} y={y} ang={g < 0 ? 0 : 180} />);
      })}
      {/* anotaciones */}
      <g style={mano} fill={LAPIZ} fontSize="21">
        <text x="20" y="30">Escáner de fotogrametría · Fotarto</text>
        <text x="350" y="24" fill={TQ}>≈ 60 cámaras disparan a la vez</text>
        <text x="20" y="262">luz difusa:</text>
        <text x="20" y="282">sin sombras</text>
        <text x="420" y="410">plataforma giratoria</text>
        <text x="20" y="54" fontSize="18">solo hay que estar quieto/a 2 segundos</text>
        <text x="40" y="410">anillo de postes con cámaras a 3 alturas</text>
      </g>
      <g filter="url(#esc)" fill="none" stroke={LAPIZ} strokeWidth="1.3">
        <path d="M250 60 q40 10 46 50" markerEnd="url(#esc-flecha)" />
        <path d="M200 400 q-30 -10 -38 -60" markerEnd="url(#esc-flecha)" />
      </g>
    </svg>
  );
}

// Cinco viñetas del proceso
const PASOS = [
  { t: 'Escaneo', d: 'Todas las cámaras disparan a la vez: tu pose queda congelada.' },
  { t: 'Malla 3D', d: 'Las fotos se unen en una nube de puntos y luego en una malla con color.' },
  { t: 'Retoque', d: 'Limpiamos la malla, cerramos huecos y ajustamos la base.' },
  { t: 'Impresión a color', d: 'Se imprime a todo color en resina, capa a capa.' },
  { t: 'Acabado', d: 'Barnizado, control de calidad y aviso por WhatsApp.' },
];

function Vineta({ n }) {
  const comun = { fill: 'none', stroke: LAPIZ, strokeWidth: 1.6, strokeLinecap: 'round', strokeLinejoin: 'round' };
  return (
    <g filter="url(#pro)" {...comun}>
      {n === 0 && (<>
        <circle cx="80" cy="44" r="10" fill="#f4efe4" /><path d="M66 58 h28 l4 40 h-8 l-2 30 h-16 l-2 -30 h-8 Z" fill="#f4efe4" />
        <rect x="14" y="60" width="22" height="15" rx="2" /><circle cx="36" cy="67" r="4" stroke={TQ} />
        <rect x="124" y="60" width="22" height="15" rx="2" /><circle cx="124" cy="67" r="4" stroke={TQ} />
        <path d="M40 67 l22 0 M120 67 l-22 0" stroke={TQ} strokeDasharray="3 4" />
        <path d="M30 20 l6 8 M80 14 v10 M130 20 l-6 8" stroke={TQ} />
      </>)}
      {n === 1 && (<>
        {Array.from({ length: 42 }).map((_, i) => { const a = i * 2.4, r = 6 + (i % 7) * 4.5; return <circle key={i} cx={52 + Math.cos(a) * r * 0.8} cy={70 + Math.sin(a) * r} r="1.2" fill={LAPIZ} stroke="none" />; })}
        <path d="M84 70 h12" markerEnd="url(#pro-flecha)" />
        <path d="M112 42 l16 -8 l16 10 l2 22 l-6 24 l-14 12 l-14 -10 l-4 -24 Z M112 42 l18 18 l16 -16 M130 60 l-16 6 l20 22 M130 60 l12 28 M114 66 l-4 0" />
      </>)}
      {n === 2 && (<>
        <rect x="22" y="26" width="116" height="74" rx="5" fill="#f4efe4" /><path d="M70 100 v12 M54 116 h52" />
        <circle cx="80" cy="52" r="10" /><path d="M68 66 h24 l3 26 h-30 Z" />
        <path d="M118 104 l26 -40 l6 4 l-26 40 l-8 4 Z" stroke={TQ} />
      </>)}
      {n === 3 && (<>
        <rect x="30" y="18" width="100" height="104" rx="6" fill="#f4efe4" /><path d="M30 40 h100 M44 108 h72" />
        <rect x="52" y="30" width="56" height="6" fill={TQ} stroke={TQ} opacity="0.6" />
        <circle cx="80" cy="64" r="8" /><path d="M71 74 h18 l2 20 h-22 Z" />
        <path d="M60 100 h40" strokeDasharray="2 3" /><path d="M64 104 h32" strokeDasharray="2 3" />
      </>)}
      {n === 4 && (<>
        <ellipse cx="80" cy="112" rx="34" ry="8" fill="#f4efe4" /><circle cx="80" cy="46" r="11" fill="#f4efe4" />
        <path d="M66 60 h28 l3 34 h-8 l-1 16 h-16 l-1 -16 h-8 Z" fill="#f4efe4" />
        <path d="M122 30 l4 10 l10 4 l-10 4 l-4 10 l-4 -10 l-10 -4 l10 -4 Z M36 36 l2 6 l6 2 l-6 2 l-2 6 l-2 -6 l-6 -2 l6 -2 Z" stroke={TQ} />
      </>)}
    </g>
  );
}

export function BocetoProceso() {
  return (
    <div className="flex lg:grid lg:grid-cols-5 gap-3 overflow-x-auto snap-x snap-mandatory -mx-4 px-4 sm:-mx-6 sm:px-6 lg:mx-0 lg:px-0 pb-2 no-scrollbar">
      {PASOS.map((p, i) => (
        <figure key={p.t} className="snap-start shrink-0 w-[44%] sm:w-[30%] lg:w-auto rounded-lg overflow-hidden border border-[#d8ccb0] bg-[#f4efe4]">
          <svg viewBox="0 0 160 130" className="w-full h-auto" role="img" aria-label={`Paso ${i + 1}: ${p.t}`}>
            <Filtro id="pro" />
            <text x="10" y="24" style={mano} fontSize="22" fill={TQ}>{i + 1}</text>
            <Vineta n={i} />
          </svg>
          <figcaption className="px-3 pb-3 -mt-1">
            <p className="font-mano text-2xl text-[#1f3a93] leading-none">{p.t}</p>
            <p className="text-xs text-[#4a4a50] mt-1 leading-snug">{p.d}</p>
          </figcaption>
        </figure>
      ))}
    </div>
  );
}
