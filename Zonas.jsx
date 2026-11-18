import React, { useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, ChevronRight, CheckCircle2, Euro, Users, Lock } from 'lucide-react';
import TallerResina from './TallerResina.jsx';

// ---------------------------------------------------------------------------
// Zonas del estudio: cada una es un botón con su imagen y abre su ficha
// ---------------------------------------------------------------------------
const ZONAS = [
  {
    id: 'multiusos', t: 'Sala 1: Multiusos', img: 'assets/img/sala-multiusos.jpg',
    d: 'Ciclorama blanco, raíles de iluminación en el techo y ventanas de luz natural.',
    largo: 'La sala más versátil del estudio. El ciclorama blanco curvo hace desaparecer las esquinas, y los raíles del techo permiten colgar los focos donde se necesiten sin trípodes por el suelo.',
    equipo: ['Ciclorama blanco de 4 m', 'Raíl de techo con 4 focos LED regulables', 'Dos ventanas de luz natural con cortinas', 'Trípodes y cámaras de estudio', 'Puesto de captura con ordenador', 'Escáner 3D para «Tu Funko en 3D»'],
    para: ['Retratos y books', 'Fotografía de producto', 'Fotos de carnet', 'Escaneo para Funkos 3D'],
    precio: '30 € / hora', aforo: 'Hasta 6 personas',
  },
  {
    id: 'bbc', t: 'Sala 2: Eventos BBC', img: 'assets/img/sala-bbc.jpg',
    d: 'Ambiente cálido y elegante para bodas, bautizos y comuniones.',
    largo: 'Una sala con aire de salón clásico: molduras blancas, sofá Chester y luz cálida. Pensada para que las familias estén cómodas y las fotos tengan un acabado elegante y atemporal.',
    equipo: ['Paredes con molduras clásicas', 'Sofá Chester y alfombra', 'Pantalla para ver las fotos al momento', 'Iluminación cálida regulable', 'Expositor de álbumes'],
    para: ['Bodas y prebodas', 'Bautizos', 'Comuniones', 'Fotos de familia'],
    precio: 'Packs desde 199 €', aforo: 'Hasta 12 personas',
  },
  {
    id: 'cine', t: 'Sala 3: Cine de Acción', img: 'assets/img/sala-cine.jpg',
    d: 'Black box con focos, tubos LED, máquinas de humo y cámaras de vídeo.',
    largo: 'Una «caja negra» donde la luz se controla al cien por cien. Los tubos LED de colores y las máquinas de humo permiten crear ambientes de cine, videoclip o publicidad.',
    equipo: ['Paredes y suelo negros (black box)', 'Focos Fresnel con viseras', 'Tubos LED RGB', '2 máquinas de humo', 'Cámaras de vídeo 4K y estabilizador', 'Atrezo para escenas de acción'],
    para: ['Cortometrajes y rodajes', 'Videoclips', 'Publicidad', 'Retratos de clave baja'],
    precio: '45 € / hora', aforo: 'Hasta 10 personas',
  },
  {
    id: 'recepcion', t: 'Recepción y exposición', img: 'assets/img/sala-recepcion.jpg',
    d: 'Atención al cliente y vitrinas donde se exponen los Funkos 3D terminados.',
    largo: 'La entrada al estudio. Aquí te atendemos, gestionamos las reservas en la nube y exponemos en las vitrinas los Funkos 3D ya terminados. Las figuras se imprimen en el taller privado, fuera de la vista del público.',
    equipo: ['Mostrador con tabletas para reservas', 'Vitrinas iluminadas con Funkos terminados', 'Pantalla con el estado de los encargos (Kanban)', 'Mesa de pintado a mano de las figuras'],
    para: ['Atención y reservas', 'Recogida de encargos', 'Exposición de Funkos 3D'],
    precio: 'Funko 3D: 49,99 €', aforo: 'Zona de paso',
  },
  {
    id: 'edicion', t: 'Edición y Poscopia', img: 'assets/img/sala-edicion.jpg',
    d: 'Puestos de retoque, impresión fotográfica y restauración digital.',
    largo: 'El cuarto oscuro del siglo XXI. Aquí se retocan las sesiones, se restauran fotos antiguas y se imprimen las copias y los álbumes en papel fotográfico profesional.',
    equipo: ['3 puestos de edición con monitores calibrados', 'Tableta gráfica para retoque', 'Impresora fotográfica de gran formato', 'Escáner e impresora multifunción', 'Servidor con copias de seguridad'],
    para: ['Retoque de sesiones', 'Restauración de fotos antiguas', 'Impresión de copias y álbumes'],
    precio: 'Según encargo', aforo: 'Uso interno',
  },
  {
    id: 'taller3d', t: 'Taller de impresión 3D', privado: true, Ilustracion: TallerResina,
    d: 'Almacén ventilado y cerrado al público con 5 impresoras de resina Elegoo Saturn 4 Ultra 16K.',
    largo: 'La resina líquida desprende vapores y es tóxica antes de curarse, así que las impresoras están en un almacén aparte, cerrado al público y con extracción de aire continua hacia el exterior. Aquí se imprimen los Funkos y las figuras realistas, se lavan, se curan con luz UV y pasan a pintura.',
    equipo: [
      '5 × Elegoo Saturn 4 Ultra 16K: pantalla 16K de 10" y resolución XY de 14 × 19 µm',
      'Cuba calefactada a 30 °C y cámara con IA que detecta fallos de impresión',
      'Extractor de aire con salida al exterior y renovación continua',
      'Estación de lavado y curado UV',
      'Armario de resinas protegido de la luz',
      'Equipo de protección: guantes de nitrilo, gafas y mascarilla con filtro',
    ],
    para: ['Funkos 3D', 'Figuras realistas', 'Piezas de atrezo'],
    precio: 'Zona privada', aforo: 'Solo personal autorizado',
  },
];

function Ficha({ z, onCerrar, onReservar }) {
  const cerrarRef = useRef(null);
  useEffect(() => {
    cerrarRef.current?.focus();
    const tecla = (e) => e.key === 'Escape' && onCerrar();
    document.addEventListener('keydown', tecla);
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.removeEventListener('keydown', tecla); document.body.style.overflow = prev; };
  }, [onCerrar]);

  // se dibuja directamente en <body> para que la animación de la sección no la desplace
  return createPortal(
    <div className="font-montserrat fixed inset-0 z-[90] flex items-end sm:items-center justify-center bg-black/75 backdrop-blur-sm p-0 sm:p-6 animate-in" onClick={onCerrar} role="dialog" aria-modal="true" aria-label={z.t}>
      <div className="relative w-full max-w-4xl max-h-[92vh] overflow-y-auto rounded-t-2xl sm:rounded-2xl bg-[#0E1016] border-2 border-[#00E5FF] glow-box" onClick={(e) => e.stopPropagation()}>
        <button ref={cerrarRef} type="button" onClick={onCerrar} aria-label="Cerrar" className="absolute top-3 right-3 z-10 p-2 rounded-full bg-black/70 text-white hover:bg-[#00E5FF] hover:text-[#0B0C10]"><X className="w-5 h-5" /></button>
        {z.Ilustracion ? <z.Ilustracion className="w-full max-h-[50vh] block" /> : <img src={z.img} alt={`${z.t} por dentro`} className="w-full max-h-[50vh] object-cover" />}
        {z.privado && <p className="flex items-center gap-2 px-6 md:px-8 pt-5 text-sm font-semibold text-[#FFD166]"><Lock className="w-4 h-4" /> Zona sin acceso al público por seguridad: la resina sin curar es tóxica y desprende olor.</p>}
        <div className="p-6 md:p-8 grid md:grid-cols-[minmax(0,1.2fr)_minmax(0,1fr)] gap-8">
          <div>
            <h3 className="text-3xl font-playfair font-bold text-[#00E5FF] mb-3">{z.t}</h3>
            <p className="text-[#C9CDD8] leading-relaxed mb-5">{z.largo}</p>
            <p className="text-xs uppercase tracking-wider text-[#8D93AB] mb-2">Equipamiento</p>
            <ul className="space-y-1.5">
              {z.equipo.map((e) => <li key={e} className="flex gap-2 text-sm text-[#C9CDD8]"><CheckCircle2 className="w-4 h-4 text-[#00E5FF] shrink-0 mt-0.5" />{e}</li>)}
            </ul>
          </div>
          <div className="space-y-5">
            <div>
              <p className="text-xs uppercase tracking-wider text-[#8D93AB] mb-2">Ideal para</p>
              <div className="flex flex-wrap gap-2">{z.para.map((p) => <span key={p} className="px-3 py-1 rounded-full border border-[#8D93AB]/40 text-sm text-white">{p}</span>)}</div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 rounded-lg bg-[#151720] border border-[#8D93AB]/25"><Euro className="w-4 h-4 text-[#00E5FF] mb-1" /><p className="text-xs text-[#8D93AB]">Precio</p><p className="text-white font-bold">{z.precio}</p></div>
              <div className="p-3 rounded-lg bg-[#151720] border border-[#8D93AB]/25"><Users className="w-4 h-4 text-[#00E5FF] mb-1" /><p className="text-xs text-[#8D93AB]">Aforo</p><p className="text-white font-bold">{z.aforo}</p></div>
            </div>
            <button type="button" onClick={onReservar} className="w-full px-5 py-3 rounded-full bg-[#00E5FF] text-[#0B0C10] font-bold hover:bg-white transition-colors">Reservar o pedir información</button>
          </div>
        </div>
      </div>
    </div>,
    document.body,
  );
}

export default function Zonas({ onReservar }) {
  const [abierta, setAbierta] = useState(null);
  const z = ZONAS.find((x) => x.id === abierta);
  const cerrar = useCallback(() => setAbierta(null), []);
  return (
    <>
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-3 md:gap-6">
        {ZONAS.map((zona) => (
          <button key={zona.id} type="button" onClick={() => setAbierta(zona.id)} aria-label={`Ver ${zona.t} por dentro`}
            className="group text-left rounded-xl overflow-hidden border border-[#8D93AB]/30 bg-[#151720] hover:border-[#00E5FF] hover:-translate-y-1 transition-all duration-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-[#00E5FF]">
            <div className="relative h-28 sm:h-36 md:h-44 overflow-hidden">
              {zona.Ilustracion
                ? <zona.Ilustracion className="w-full h-full transition-transform duration-500 group-hover:scale-105" />
                : <img src={zona.img} alt="" loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />}
              {zona.privado && <span className="absolute top-1.5 left-1.5 px-1.5 py-0.5 rounded bg-[#FFD166] text-[10px] sm:text-[11px] font-bold text-[#0B0C10] flex items-center gap-1"><Lock className="w-3 h-3" /> Privado</span>}
              <span className="absolute bottom-1.5 right-1.5 px-1.5 py-0.5 rounded bg-black/70 text-[10px] sm:text-[11px] font-semibold text-[#00E5FF]">{zona.precio}</span>
            </div>
            <div className="p-3 md:p-5">
              <h3 className="text-sm sm:text-base md:text-lg font-bold text-white mb-1 leading-tight">{zona.t}</h3>
              <p className="hidden sm:block text-[#8D93AB] text-sm mb-3">{zona.d}</p>
              <span className="inline-flex items-center gap-1 text-xs sm:text-sm font-semibold text-[#00E5FF] group-hover:gap-2 transition-all">Ver por dentro <ChevronRight className="w-4 h-4" /></span>
            </div>
          </button>
        ))}
      </div>
      {z && <Ficha z={z} onCerrar={cerrar} onReservar={() => { setAbierta(null); onReservar(); }} />}
    </>
  );
}
