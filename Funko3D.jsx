import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { calcomania } from './logo3d.js';
import { Hand } from 'lucide-react';

// ---------------------------------------------------------------------------
// Funko de ejemplo con el uniforme de Fotarto (figura 3D que se puede girar)
// ---------------------------------------------------------------------------
const mat = (color, rough = 0.55, extra = {}) => new THREE.MeshStandardMaterial({ color, roughness: rough, ...extra });

function caja(w, h, d, r, material) {
  const m = new THREE.Mesh(new RoundedBoxGeometry(w, h, d, 5, r), material);
  m.castShadow = m.receiveShadow = true;
  return m;
}
function bola(r, material, sx = 1, sy = 1, sz = 1) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 32, 24), material);
  m.scale.set(sx, sy, sz);
  m.castShadow = true;
  return m;
}
// Cilindro con extremos redondeados entre dos puntos (brazos, mangas)
function tramo(a, b, r, material) {
  const dir = new THREE.Vector3().subVectors(b, a);
  const largo = dir.length();
  const m = new THREE.Mesh(new THREE.CapsuleGeometry(r, Math.max(0.001, largo - 2 * r), 8, 20), material);
  m.position.copy(a).add(b).multiplyScalar(0.5);
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.normalize());
  m.castShadow = true;
  return m;
}

function crearFunko() {
  const g = new THREE.Group();
  const piel = mat(0xf2c6a2, 0.6);
  const pelo = mat(0x3b2618, 0.7);
  const polo = mat(0x141519, 0.85);
  const pantalon = mat(0x1d1e23, 0.8);
  const zapato = mat(0x0c0c0e, 0.4);
  const turquesa = mat(0x00c8e0, 0.45, { emissive: 0x003a42 });
  const negroBrillo = mat(0x050506, 0.15, { metalness: 0.2 });

  // peana
  const peana = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.1, 64), negroBrillo);
  peana.position.y = 0.05; peana.receiveShadow = true;
  g.add(peana);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.012, 8, 80), turquesa);
  aro.rotation.x = Math.PI / 2; aro.position.y = 0.1;
  g.add(aro);

  // piernas y zapatos
  for (const s of [-1, 1]) {
    const pierna = caja(0.19, 0.34, 0.22, 0.07, pantalon); pierna.position.set(s * 0.115, 0.33, 0); g.add(pierna);
    const zap = caja(0.2, 0.11, 0.3, 0.05, zapato); zap.position.set(s * 0.115, 0.155, 0.04); g.add(zap);
  }

  // torso con el polo de Fotarto
  const torso = caja(0.54, 0.5, 0.34, 0.1, polo); torso.position.y = 0.72; g.add(torso);
  const bajo = caja(0.545, 0.03, 0.345, 0.015, turquesa); bajo.position.y = 0.48; g.add(bajo);
  for (const s of [-1, 1]) {
    const costura = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.42, 0.014), turquesa);
    costura.position.set(s * 0.271, 0.71, 0); g.add(costura);
  }
  // cuello del polo con ribete y botones
  const cuello = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.028, 12, 40), polo);
  cuello.rotation.x = Math.PI / 2; cuello.scale.set(1, 0.8, 1); cuello.position.y = 0.97; g.add(cuello);
  const ribete = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.009, 8, 40), turquesa);
  ribete.rotation.x = Math.PI / 2; ribete.scale.set(1, 0.8, 1); ribete.position.y = 0.99; g.add(ribete);
  for (let i = 0; i < 2; i++) { const bt = bola(0.012, polo); bt.position.set(0, 0.9 - i * 0.05, 0.172); g.add(bt); }
  // logotipos: pecho, espalda
  const lp = calcomania('pecho', 0.15); lp.position.set(0.13, 0.84, 0.1715); g.add(lp);
  const le = calcomania('espalda', 0.34); le.position.set(0, 0.76, -0.1715); le.rotation.y = Math.PI; g.add(le);

  // brazos: manga del polo, puño turquesa, brazo y mano sujetando la cámara
  const hombro = (s) => new THREE.Vector3(s * 0.29, 0.9, 0);
  const codo = (s) => new THREE.Vector3(s * 0.33, 0.68, 0.12);
  const mano = (s) => new THREE.Vector3(s * 0.15, 0.66, 0.3);
  for (const s of [-1, 1]) {
    const finManga = new THREE.Vector3().lerpVectors(hombro(s), codo(s), 0.62);
    g.add(tramo(hombro(s), finManga, 0.085, polo));
    const puno = new THREE.Mesh(new THREE.TorusGeometry(0.083, 0.012, 8, 28), turquesa);
    puno.position.copy(finManga);
    puno.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3().subVectors(codo(s), hombro(s)).normalize());
    g.add(puno);
    const fm = calcomania('manga', 0.07);
    const mid = new THREE.Vector3().lerpVectors(hombro(s), finManga, 0.45);
    fm.position.set(mid.x + s * 0.086, mid.y, mid.z); fm.rotation.y = s * Math.PI / 2; fm.rotation.z = s * -0.18;
    g.add(fm);
    g.add(tramo(finManga, codo(s), 0.06, piel));
    g.add(tramo(codo(s), mano(s), 0.058, piel));
    const m = bola(0.075, piel, 1, 1, 0.9); m.position.copy(mano(s)); g.add(m);
  }

  // cámara de fotos entre las manos
  const cam = new THREE.Group();
  cam.position.set(0, 0.69, 0.33);
  const cuerpo = caja(0.26, 0.16, 0.11, 0.025, negroBrillo); cam.add(cuerpo);
  const visor = caja(0.09, 0.05, 0.08, 0.015, negroBrillo); visor.position.set(-0.02, 0.1, 0); cam.add(visor);
  const objetivo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.09, 40), negroBrillo);
  objetivo.rotation.x = Math.PI / 2; objetivo.position.z = 0.09; cam.add(objetivo);
  const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.01, 8, 40), turquesa); anillo.position.z = 0.135; cam.add(anillo);
  const cristal = new THREE.Mesh(new THREE.CircleGeometry(0.05, 40), mat(0x0a3d4a, 0.05, { metalness: 0.6, emissive: 0x00303a }));
  cristal.position.z = 0.136; cam.add(cristal);
  const flash = bola(0.012, mat(0xffffff, 0.2, { emissive: 0x666666 })); flash.position.set(0.09, 0.05, 0.056); cam.add(flash);
  g.add(cam);

  // cabeza estilo Funko
  const cabeza = new THREE.Group();
  cabeza.position.y = 1.43;
  g.add(cabeza);
  const cuelloPiel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.12, 24), piel);
  cuelloPiel.position.y = 1.02; g.add(cuelloPiel);
  cabeza.add(caja(0.98, 0.84, 0.84, 0.24, piel));
  for (const s of [-1, 1]) {
    const ojo = bola(0.085, mat(0x050505, 0.15), 1, 1, 0.45); ojo.position.set(s * 0.2, -0.04, 0.41); cabeza.add(ojo);
    const brillo = bola(0.02, mat(0xffffff, 0.2, { emissive: 0x444444 })); brillo.position.set(s * 0.2 + 0.03, -0.0, 0.445); cabeza.add(brillo);
    const ceja = caja(0.15, 0.03, 0.03, 0.012, pelo); ceja.position.set(s * 0.2, 0.1, 0.415); ceja.rotation.z = s * -0.08; cabeza.add(ceja);
    const oreja = bola(0.07, piel, 0.6, 1, 0.9); oreja.position.set(s * 0.49, -0.04, 0); cabeza.add(oreja);
    const mejilla = bola(0.06, mat(0xf0a0a0, 0.7, { transparent: true, opacity: 0.35 }), 1, 0.6, 0.3); mejilla.position.set(s * 0.3, -0.16, 0.405); cabeza.add(mejilla);
  }
  const nariz = bola(0.035, mat(0xe6b08c, 0.6), 1, 0.8, 0.7); nariz.position.set(0, -0.13, 0.42); cabeza.add(nariz);
  // pelo: casquete, nuca y flequillo
  const cas = caja(1.03, 0.34, 0.9, 0.16, pelo); cas.position.set(0, 0.3, -0.01); cabeza.add(cas);
  const nuca = caja(1.03, 0.62, 0.36, 0.15, pelo); nuca.position.set(0, 0.06, -0.28); cabeza.add(nuca);
  const fleq = caja(0.98, 0.16, 0.22, 0.07, pelo); fleq.position.set(-0.04, 0.24, 0.34); fleq.rotation.z = 0.05; cabeza.add(fleq);
  const mechon = caja(0.36, 0.2, 0.2, 0.08, pelo); mechon.position.set(0.3, 0.2, 0.36); mechon.rotation.z = -0.35; cabeza.add(mechon);

  return g;
}

export default function Funko3D() {
  const ref = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true });
    } catch (e) { setError(true); return undefined; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camara = new THREE.PerspectiveCamera(28, 0.8, 0.1, 50);
    camara.position.set(0, 1.2, 4.7);
    camara.lookAt(0, 0.95, 0);

    scene.add(new THREE.HemisphereLight(0xffffff, 0x223038, 1.1));
    const clave = new THREE.DirectionalLight(0xffffff, 2.4);
    clave.position.set(2.2, 3.5, 3.2); clave.castShadow = true;
    clave.shadow.mapSize.set(1024, 1024);
    Object.assign(clave.shadow.camera, { left: -1.5, right: 1.5, top: 2.2, bottom: -0.5, near: 0.5, far: 10 });
    clave.shadow.bias = -0.0005;
    scene.add(clave);
    const contra = new THREE.DirectionalLight(0x00e5ff, 2.2);
    contra.position.set(-2.5, 2.5, -3); scene.add(contra);
    const relleno = new THREE.DirectionalLight(0xffe2c4, 0.6);
    relleno.position.set(-3, 1, 2); scene.add(relleno);

    const funko = crearFunko();
    scene.add(funko);

    // girar: solo, o arrastrando con el dedo / ratón
    const reducido = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    let giro = -0.35, arrastrando = false, ultimoX = 0, pausaHasta = 0, visible = true, raf = 0, prev = performance.now();
    const abajo = (e) => { arrastrando = true; ultimoX = e.clientX; canvas.setPointerCapture?.(e.pointerId); };
    const mover = (e) => { if (!arrastrando) return; giro += (e.clientX - ultimoX) * 0.012; ultimoX = e.clientX; pausaHasta = performance.now() + 2500; };
    const arriba = () => { arrastrando = false; pausaHasta = performance.now() + 2500; };
    canvas.addEventListener('pointerdown', abajo);
    canvas.addEventListener('pointermove', mover);
    window.addEventListener('pointerup', arriba);

    const ajustar = () => {
      const w = canvas.clientWidth, h = canvas.clientHeight;
      renderer.setSize(w, h, false);
      camara.aspect = w / h; camara.updateProjectionMatrix();
    };
    const ro = new ResizeObserver(ajustar); ro.observe(canvas);
    const io = new IntersectionObserver(([e]) => { visible = e.isIntersecting; if (visible) bucle(); });
    io.observe(canvas);

    function bucle() {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame((t) => {
        const dt = Math.min(0.05, (t - prev) / 1000); prev = t;
        if (!arrastrando && !reducido && t > pausaHasta) giro += dt * 0.6;
        funko.rotation.y = giro;
        funko.position.y = reducido ? 0 : Math.sin(t / 900) * 0.015;
        renderer.render(scene, camara);
        if (visible && !document.hidden) bucle();
      });
    }
    const alVolver = () => { if (!document.hidden && visible) { prev = performance.now(); bucle(); } };
    document.addEventListener('visibilitychange', alVolver);
    ajustar();
    bucle();
    window.__funko = { funko, set: (r) => { giro = r; pausaHasta = performance.now() + 1e9; } };

    return () => {
      cancelAnimationFrame(raf); ro.disconnect(); io.disconnect();
      canvas.removeEventListener('pointerdown', abajo); canvas.removeEventListener('pointermove', mover);
      window.removeEventListener('pointerup', arriba); document.removeEventListener('visibilitychange', alVolver);
      renderer.dispose();
    };
  }, []);

  return (
    <div className="relative rounded-2xl overflow-hidden border-2 border-[#00E5FF] glow-box" style={{ background: 'radial-gradient(circle at 50% 40%, #16323a 0%, #0B0C10 70%)' }}>
      <canvas ref={ref} className="block w-full aspect-[4/5] cursor-grab active:cursor-grabbing touch-pan-y" aria-label="Funko de ejemplo con el uniforme de Fotarto: polo negro con ribetes turquesa, logotipo y una cámara en las manos" />
      {error && <p className="absolute inset-0 flex items-center justify-center text-[#8D93AB] text-sm p-6 text-center">Tu navegador no admite gráficos 3D (WebGL).</p>}
      <span className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 text-xs font-bold text-[#00E5FF]">Ejemplo · Tu Funko en 3D</span>
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-xs text-[#C9CDD8] flex items-center gap-1.5"><Hand className="w-3.5 h-3.5" /> Arrastra para girarlo</span>
    </div>
  );
}
