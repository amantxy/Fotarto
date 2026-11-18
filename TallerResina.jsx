import React from 'react';

// ---------------------------------------------------------------------------
// Ilustración del taller privado de impresión 3D: almacén ventilado con
// 5 impresoras de resina, extractor, estación de lavado y curado y armario de resinas
// ---------------------------------------------------------------------------
function Impresora({ x, n }) {
  // cuerpo inferior, cubierta tintada y piloto turquesa
  return (
    <g transform={`translate(${x} 0)`}>
      <rect x="0" y="232" width="62" height="34" rx="4" fill="#2b2e35" />
      <rect x="6" y="240" width="22" height="12" rx="2" fill="#0d1f26" />
      <rect x="8" y="242" width="18" height="8" rx="1" fill="#00E5FF" opacity="0.85" />
      <circle cx="50" cy="249" r="3" fill="#38E86B" />
      <rect x="3" y="150" width="56" height="84" rx="5" fill="#5b4a2e" opacity="0.55" stroke="#8a6d3b" strokeOpacity="0.7" />
      <rect x="27" y="160" width="8" height="66" fill="#9aa0a6" opacity="0.8" />
      <rect x="12" y="186" width="38" height="5" rx="1" fill="#c9ced6" />
      <path d={`M22 191 h18 l-3 ${10 + (n % 3) * 6} h-12 Z`} fill="#d9c8a8" opacity="0.9" />
      <rect x="10" y="222" width="42" height="9" rx="1" fill="#1a1b20" />
      <rect x="3" y="150" width="56" height="10" rx="5" fill="#3a3a40" opacity="0.8" />
      <text x="31" y="280" textAnchor="middle" fontSize="9" fill="#8D93AB" fontFamily="Montserrat, Arial">{`#${n}`}</text>
    </g>
  );
}

export default function TallerResina({ className = '' }) {
  return (
    <svg viewBox="0 0 560 340" preserveAspectRatio="xMidYMid slice" className={className} role="img" aria-label="Ilustración del taller privado de impresión 3D: almacén cerrado con cinco impresoras de resina Elegoo sobre una mesa, extractor de aire, estación de lavado y curado y armario de resinas">
      <defs>
        <linearGradient id="tr-pared" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#3a3f48" /><stop offset="1" stopColor="#2a2e35" /></linearGradient>
        <linearGradient id="tr-suelo" x1="0" x2="0" y1="0" y2="1"><stop offset="0" stopColor="#4b505a" /><stop offset="1" stopColor="#30343b" /></linearGradient>
        <radialGradient id="tr-luz" cx="0.5" cy="0" r="0.8"><stop offset="0" stopColor="#00E5FF" stopOpacity="0.18" /><stop offset="1" stopColor="#00E5FF" stopOpacity="0" /></radialGradient>
      </defs>
      {/* habitación */}
      <rect width="560" height="340" fill="#1d2026" />
      <polygon points="60,20 500,20 500,270 60,270" fill="url(#tr-pared)" />
      <polygon points="0,0 60,20 60,270 0,340" fill="#23272e" />
      <polygon points="560,0 500,20 500,270 560,340" fill="#23272e" />
      <polygon points="60,270 500,270 560,340 0,340" fill="url(#tr-suelo)" />
      <rect x="60" y="20" width="440" height="250" fill="url(#tr-luz)" />
      {/* tira LED del techo */}
      <rect x="120" y="24" width="320" height="5" rx="2" fill="#00E5FF" opacity="0.9" />
      {/* extractor de aire con flujo */}
      <g transform="translate(424 46) scale(0.85)">
        <rect width="70" height="70" rx="6" fill="#20242b" stroke="#8D93AB" strokeOpacity="0.5" />
        <circle cx="35" cy="35" r="26" fill="#14171c" stroke="#8D93AB" strokeOpacity="0.6" />
        {[0, 72, 144, 216, 288].map((a) => <path key={a} d="M35 35 q 14 -4 20 -16" stroke="#C9CDD8" strokeWidth="5" strokeLinecap="round" fill="none" transform={`rotate(${a} 35 35)`} />)}
        <circle cx="35" cy="35" r="5" fill="#00E5FF" />
      </g>
      {[0, 1, 2].map((i) => <path key={i} d={`M482 ${70 + i * 14} q 20 -6 40 0 t 34 -4`} stroke="#7BDFF2" strokeWidth="2" fill="none" strokeDasharray="5 6" opacity="0.7" />)}
      <text x="462" y="142" textAnchor="middle" fontSize="11" fill="#7BDFF2" fontFamily="Montserrat, Arial">Extracción al exterior</text>
      {/* armario de resinas */}
      <g transform="translate(70 36) scale(0.8)">
        <rect width="74" height="132" rx="4" fill="#191c22" stroke="#8D93AB" strokeOpacity="0.4" />
        {[0, 1, 2].map((f) => <rect key={f} x="4" y={36 + f * 32} width="66" height="3" fill="#3a3f48" />)}
        {[0, 1, 2, 3, 4, 5].map((i) => <rect key={i} x={8 + (i % 3) * 21} y={(i < 3 ? 14 : 46)} width="14" height="22" rx="2" fill={['#3d7bff', '#9aa0a6', '#f2c230', '#38e86b', '#c0392b', '#e8dcc6'][i]} opacity="0.85" />)}
        <rect x="10" y="80" width="54" height="16" rx="2" fill="#f2c230" />
        <text x="37" y="92" textAnchor="middle" fontSize="8" fontWeight="700" fill="#0b0c10" fontFamily="Montserrat, Arial">RESINAS</text>
        <text x="37" y="120" textAnchor="middle" fontSize="7.5" fill="#C9CDD8" fontFamily="Montserrat, Arial">lejos de la luz</text>
      </g>
      {/* aviso de seguridad */}
      <g transform="translate(150 50)">
        <polygon points="22,0 44,38 0,38" fill="#f2c230" stroke="#0b0c10" strokeWidth="2" />
        <text x="22" y="32" textAnchor="middle" fontSize="22" fontWeight="800" fill="#0b0c10" fontFamily="Arial">!</text>
        <text x="58" y="16" fontSize="10" fill="#C9CDD8" fontFamily="Montserrat, Arial">Vapores tóxicos</text>
        <text x="58" y="30" fontSize="10" fill="#C9CDD8" fontFamily="Montserrat, Arial">Usa protección</text>
      </g>
      {/* mesa con las 5 impresoras */}
      <rect x="70" y="266" width="420" height="8" rx="2" fill="#5b6070" />
      <rect x="80" y="274" width="8" height="40" fill="#3a3f48" /><rect x="472" y="274" width="8" height="40" fill="#3a3f48" />
      {[0, 1, 2, 3, 4].map((i) => <Impresora key={i} x={86 + i * 80} n={i + 1} />)}
      {/* estación de lavado y curado */}
      <g transform="translate(330 74)">
        <rect width="70" height="52" rx="6" fill="#20242b" stroke="#8D93AB" strokeOpacity="0.4" />
        <circle cx="35" cy="26" r="16" fill="#3a2a5a" stroke="#8a4dff" strokeWidth="2" />
        <text x="35" y="-6" textAnchor="middle" fontSize="9" fill="#C9CDD8" fontFamily="Montserrat, Arial">Lavado y curado UV</text>
      </g>
      {/* rótulo */}
      <rect x="0" y="0" width="230" height="26" fill="#0b0c10" opacity="0.75" />
      <text x="12" y="17" fontSize="11" fontWeight="700" fill="#00E5FF" fontFamily="Montserrat, Arial">TALLER 3D · SOLO PERSONAL</text>
    </svg>
  );
}
