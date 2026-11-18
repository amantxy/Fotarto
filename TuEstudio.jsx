import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { calcomania } from './logo3d.js';
import { Camera, Lightbulb, Download, RotateCcw, Info } from 'lucide-react';

// ---------------------------------------------------------------------------
// DATOS: luces, esquemas de iluminación y planos de cámara
// ---------------------------------------------------------------------------

// az: ángulo en grados alrededor del modelo (0 = desde la cámara, + = a la derecha de la imagen)
// el: altura en grados (0 = a la altura de los ojos, + = por encima)
// dist: distancia al rostro en metros · int: intensidad 0-1 · suave: 0 (dura) - 1 (difusa)
const LUCES_BASE = {
  principal: { nombre: 'Principal', color: '#FFD166', on: true, az: 45, el: 40, dist: 1.4, int: 0.9, suave: 0.4, tono: 'neutra' },
  relleno: { nombre: 'Relleno', color: '#7BDFF2', on: true, az: -50, el: 10, dist: 1.6, int: 0.2, suave: 0.9, tono: 'neutra' },
  contra: { nombre: 'Contra', color: '#F28482', on: false, az: -140, el: 30, dist: 1.4, int: 0.6, suave: 0.2, tono: 'neutra' },
  fondo: { nombre: 'Fondo', color: '#B8F2E6', on: true, az: 180, el: -10, dist: 0.9, int: 0.25, suave: 1, tono: 'neutra' },
};

const ESQUEMAS = {
  rembrandt: {
    nombre: 'Rembrandt',
    desc: 'Luz principal a unos 45° del rostro y por encima de los ojos. En la mejilla que queda en sombra aparece un pequeño triángulo de luz bajo el ojo. Es dramático y clásico, ideal para retratos con carácter.',
    luces: { principal: { on: true, az: 50, el: 42, int: 0.95, suave: 0.2 }, relleno: { on: true, az: -50, el: 10, int: 0.05, suave: 0.9 }, contra: { on: false }, fondo: { on: true, int: 0.2 } },
    fondo: 'gris',
  },
  bucle: {
    nombre: 'Bucle (Loop)',
    desc: 'Luz principal a 30-40° y algo elevada. La sombra de la nariz forma un pequeño «bucle» hacia la comisura de los labios sin tocar la sombra de la mejilla. Es el esquema más versátil y favorecedor.',
    luces: { principal: { on: true, az: 35, el: 32, int: 0.9, suave: 0.35 }, relleno: { on: true, az: -45, el: 5, int: 0.15, suave: 1 }, contra: { on: false }, fondo: { on: true, int: 0.3 } },
    fondo: 'gris',
  },
  mariposa: {
    nombre: 'Mariposa (Paramount)',
    desc: 'Luz frontal y alta, justo encima de la cámara. Deja una sombra con forma de mariposa bajo la nariz y marca los pómulos. Muy usada en fotografía de belleza y moda.',
    luces: { principal: { on: true, az: 0, el: 48, int: 0.9, suave: 0.35 }, relleno: { on: false }, contra: { on: false }, fondo: { on: true, int: 0.25 } },
    fondo: 'gris',
  },
  dividida: {
    nombre: 'Dividida (Split)',
    desc: 'Luz principal a 90°, totalmente lateral: media cara queda iluminada y la otra media en sombra. Transmite misterio, fuerza y tensión.',
    luces: { principal: { on: true, az: 90, el: 5, int: 0.9, suave: 0.3 }, relleno: { on: false }, contra: { on: false }, fondo: { on: false } },
    fondo: 'negro',
  },
  almeja: {
    nombre: 'Almeja (Clamshell)',
    desc: 'Luz principal alta y frontal y un relleno (o reflector) desde abajo, como las dos valvas de una almeja. Suaviza arrugas y ojeras: es un clásico de la fotografía de belleza.',
    luces: { principal: { on: true, az: 0, el: 40, int: 0.8, suave: 0.85 }, relleno: { on: true, az: 0, el: -30, int: 0.4, suave: 1 }, contra: { on: false }, fondo: { on: true, int: 0.35 } },
    fondo: 'gris',
  },
  contraluz: {
    nombre: 'Contraluz (Rim)',
    desc: 'Las luces están detrás del modelo y dibujan su silueta con un borde brillante. Separa al sujeto del fondo y crea un aire cinematográfico.',
    luces: { principal: { on: true, az: 135, el: 20, int: 1, suave: 0.2 }, relleno: { on: true, az: 0, el: 0, int: 0.06, suave: 1 }, contra: { on: true, az: -135, el: 20, int: 1, suave: 0.2 }, fondo: { on: false } },
    fondo: 'negro',
  },
  claveAlta: {
    nombre: 'Clave alta',
    desc: 'Luz suave y abundante desde delante y desde los lados, con el fondo blanco muy iluminado. Las sombras casi desaparecen: aspecto limpio, alegre y luminoso.',
    luces: { principal: { on: true, az: 20, el: 25, int: 0.8, suave: 1 }, relleno: { on: true, az: -35, el: 10, int: 0.6, suave: 1 }, contra: { on: false }, fondo: { on: true, int: 1 } },
    fondo: 'blanco',
  },
  claveBaja: {
    nombre: 'Clave baja',
    desc: 'Predominan las sombras y el fondo oscuro; solo se iluminan zonas concretas del rostro, con una luz de contra que perfila el pelo. Ambiente dramático, típico del cine negro.',
    luces: { principal: { on: true, az: 70, el: 25, int: 0.8, suave: 0.15 }, relleno: { on: false }, contra: { on: true, az: -145, el: 35, int: 0.5, suave: 0.2 }, fondo: { on: false } },
    fondo: 'negro',
  },
};

const PLANOS = {
  PPP: { nombre: 'Primerísimo primer plano', corto: 'PPP', alto: 0.17, centro: 0.035, desc: 'De las cejas a la barbilla. Máxima intensidad emocional: la mirada lo es todo y se aprecia cada matiz de la luz en la piel.' },
  PP: { nombre: 'Primer plano', corto: 'PP', alto: 0.34, centro: 0.05, desc: 'El rostro completo y el arranque de los hombros. Es el plano clásico del retrato.' },
  PMC: { nombre: 'Plano medio corto', corto: 'PMC', alto: 0.56, centro: -0.06, desc: 'Hasta el pecho. Muestra el rostro y parte de la ropa; muy usado en fotos de perfil profesional.' },
  PM: { nombre: 'Plano medio', corto: 'PM', alto: 0.92, centro: -0.23, desc: 'Hasta la cintura. Aporta contexto: postura, hombros y gestualidad.' },
};

const ANGULOS = {
  picado: { nombre: 'Picado', el: 28, desc: 'La cámara mira desde arriba: el sujeto parece más pequeño o vulnerable.' },
  normal: { nombre: 'Normal', el: 0, desc: 'A la altura de los ojos: el punto de vista más neutral y natural.' },
  contrapicado: { nombre: 'Contrapicado', el: -22, desc: 'Desde abajo: transmite poder, seguridad o grandeza.' },
};

const POSES = {
  frontal: { nombre: 'Frontal', giro: 0 },
  tresCuartos: { nombre: 'Tres cuartos', giro: 35 },
  perfil: { nombre: 'Perfil', giro: 80 },
};

// Colores de luz: temperaturas de color (en Kelvin) y geles de colores
const TONOS = {
  vela: { nombre: 'Vela (1900 K)', hex: '#FF9329', grupo: 'temp' },
  tungsteno: { nombre: 'Tungsteno (3200 K)', hex: '#FFC58A', grupo: 'temp' },
  calida: { nombre: 'Cálida (4000 K)', hex: '#FFD9B0', grupo: 'temp' },
  neutra: { nombre: 'Luz de día (5600 K)', hex: '#FFFFFF', grupo: 'temp' },
  nublado: { nombre: 'Nublado (7000 K)', hex: '#DCE7FF', grupo: 'temp' },
  fria: { nombre: 'Sombra fría (9000 K)', hex: '#BFD3FF', grupo: 'temp' },
  rojo: { nombre: 'Gel rojo', hex: '#FF2D2D', grupo: 'gel' },
  naranja: { nombre: 'Gel naranja (CTO)', hex: '#FF8A1F', grupo: 'gel' },
  ambar: { nombre: 'Gel ámbar', hex: '#FFB300', grupo: 'gel' },
  amarillo: { nombre: 'Gel amarillo', hex: '#FFE94D', grupo: 'gel' },
  verde: { nombre: 'Gel verde', hex: '#38E86B', grupo: 'gel' },
  turquesa: { nombre: 'Gel turquesa Fotarto', hex: '#00E5FF', grupo: 'gel' },
  azul: { nombre: 'Gel azul (CTB)', hex: '#3D7BFF', grupo: 'gel' },
  violeta: { nombre: 'Gel violeta', hex: '#8A4DFF', grupo: 'gel' },
  magenta: { nombre: 'Gel magenta', hex: '#FF2DD1', grupo: 'gel' },
  rosa: { nombre: 'Gel rosa', hex: '#FF8FC4', grupo: 'gel' },
};

const FONDOS = {
  negro: { nombre: 'Negro', hex: '#0E0F12' },
  grisOscuro: { nombre: 'Gris marengo', hex: '#2E3138' },
  gris: { nombre: 'Gris', hex: '#5E636E' },
  blanco: { nombre: 'Blanco', hex: '#F2F2F2' },
  crema: { nombre: 'Crema', hex: '#E8DCC6' },
  azulNoche: { nombre: 'Azul noche', hex: '#14233F' },
  turquesa: { nombre: 'Turquesa Fotarto', hex: '#00A5BD' },
  croma: { nombre: 'Verde croma', hex: '#1FA34A' },
  burdeos: { nombre: 'Burdeos', hex: '#5A1424' },
  mostaza: { nombre: 'Mostaza', hex: '#C9962B' },
  rosa: { nombre: 'Rosa pastel', hex: '#F2C4CE' },
};

// Un color puede ser uno de la lista o uno libre elegido con el selector (#rrggbb)
const hexTono = (t) => (TONOS[t] ? TONOS[t].hex : t);
const hexFondo = (f) => (FONDOS[f] ? FONDOS[f].hex : f);
const nombreColor = (lista, c) => (lista[c] ? lista[c].nombre : `Personalizado (${c.toUpperCase()})`);

const aplicarEsquema = (id) => {
  const e = ESQUEMAS[id];
  const luces = {};
  for (const k of Object.keys(LUCES_BASE)) luces[k] = { ...LUCES_BASE[k], ...(e.luces[k] || {}) };
  return luces;
};

const rad = (g) => (g * Math.PI) / 180;

// ---------------------------------------------------------------------------
// ESCENA 3D
// ---------------------------------------------------------------------------
function crearEscena(canvas) {
  const renderer = new THREE.WebGLRenderer({ canvas, antialias: true, preserveDrawingBuffer: true });
  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.0;
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFShadowMap;

  const scene = new THREE.Scene();
  const camara = new THREE.PerspectiveCamera(24, 0.8, 0.05, 20);

  // Luz ambiente muy baja para que las sombras no sean negro absoluto
  const ambiente = new THREE.HemisphereLight(0xffffff, 0x222222, 0.06);
  scene.add(ambiente);

  // Fondo (papel de estudio)
  const fondoMat = new THREE.MeshStandardMaterial({ color: FONDOS.gris.hex, roughness: 1 });
  const fondo = new THREE.Mesh(new THREE.PlaneGeometry(6, 4), fondoMat);
  fondo.position.set(0, -0.2, -1.3);
  fondo.receiveShadow = true;
  scene.add(fondo);

  // Sujeto: cabeza 3D + cuello y torso con el polo de Fotarto
  const sujeto = new THREE.Group();
  scene.add(sujeto);

  const piel = new THREE.MeshStandardMaterial({ color: 0xffffff, roughness: 0.55, metalness: 0 });
  const tela = new THREE.MeshStandardMaterial({ color: 0x15161a, roughness: 0.85 });
  const ribete = new THREE.MeshStandardMaterial({ color: 0x00b8cc, roughness: 0.6 });

  // ---- Cuerpo del maniquí: continúa el busto 3D con el polo de Fotarto ----
  // Pieza torneada (como en un torno): perfil [radio, altura] que gira alrededor del eje vertical
  const torneada = (perfil, mat, seg = 40) => {
    // el perfil debe ir de abajo arriba para que las caras miren hacia fuera
    const pts = perfil[0][1] > perfil[perfil.length - 1][1] ? [...perfil].reverse() : perfil;
    const m = new THREE.Mesh(new THREE.LatheGeometry(pts.map(([r, y]) => new THREE.Vector2(r, y)), seg), mat);
    m.castShadow = m.receiveShadow = true;
    return m;
  };

  // Torso: hombros, pecho, cintura y cadera
  const torso = torneada([
    [0.0, -0.95], [0.152, -0.95], [0.157, -0.86], [0.15, -0.74], [0.142, -0.62], [0.146, -0.52],
    [0.155, -0.42], [0.16, -0.32], [0.166, -0.24], [0.176, -0.18], [0.18, -0.14], [0.165, -0.118], [0.12, -0.108], [0.0, -0.105],
  ], tela, 56);
  torso.scale.set(1, 1, 0.6);
  torso.position.z = -0.05;
  sujeto.add(torso);

  // Logotipo de Fotarto bordado: pecho (lado izquierdo de quien lo lleva) y espalda
  const logoPecho = calcomania('pecho', 0.085);
  logoPecho.position.set(0.075, -0.235, 0.042);
  logoPecho.rotation.y = 0.3;
  sujeto.add(logoPecho);
  const logoEspalda = calcomania('espalda', 0.2);
  logoEspalda.position.set(0, -0.29, -0.152);
  logoEspalda.rotation.y = Math.PI;
  sujeto.add(logoEspalda);

  // Costuras turquesa laterales del polo (como el uniforme real)
  for (const lado of [-1, 1]) {
    const costura = new THREE.Mesh(new THREE.CylinderGeometry(0.0035, 0.0035, 0.78, 8), ribete);
    costura.position.set(lado * 0.147, -0.6, -0.05);
    costura.rotation.z = lado * -0.03;
    sujeto.add(costura);
  }
  // Bajo del polo
  const bajo = new THREE.Mesh(new THREE.TorusGeometry(0.153, 0.004, 8, 56), ribete);
  bajo.rotation.x = Math.PI / 2; bajo.scale.set(1, 0.6, 1); bajo.position.set(0, -0.9, -0.05);
  sujeto.add(bajo);

  // Brazos articulados: hombro → manga → brazo → codo → antebrazo → mano
  const pielLisa = new THREE.MeshStandardMaterial({ color: 0xc69a82, roughness: 0.62 });
  for (const lado of [-1, 1]) {
    const hombro = new THREE.Group();
    hombro.position.set(lado * 0.178, -0.155, -0.05);
    hombro.rotation.z = lado * 0.13;
    sujeto.add(hombro);

    const deltoide = new THREE.Mesh(new THREE.SphereGeometry(0.056, 28, 20), tela);
    deltoide.scale.set(1, 0.85, 0.92);
    deltoide.castShadow = deltoide.receiveShadow = true;
    hombro.add(deltoide);
    // manga del polo (algo más ancha que el brazo) y su puño turquesa
    hombro.add(torneada([[0.0, 0.0], [0.056, 0.0], [0.055, -0.06], [0.052, -0.145], [0.05, -0.165], [0.0, -0.165]], tela));
    const puno = new THREE.Mesh(new THREE.TorusGeometry(0.0495, 0.0045, 8, 32), ribete);
    puno.rotation.x = Math.PI / 2; puno.position.y = -0.162;
    hombro.add(puno);
    // «f» bordada en la manga
    const logoManga = calcomania('manga', 0.038);
    logoManga.position.set(lado * 0.0565, -0.075, 0);
    logoManga.rotation.y = lado * Math.PI / 2;
    hombro.add(logoManga);
    // brazo hasta el codo
    hombro.add(torneada([[0.0, -0.13], [0.045, -0.13], [0.042, -0.21], [0.036, -0.28], [0.03, -0.3], [0.0, -0.305]], pielLisa));
    const codo = new THREE.Group();
    codo.position.y = -0.29;
    codo.rotation.x = -0.22; // antebrazo ligeramente hacia delante
    hombro.add(codo);
    const articulacion = new THREE.Mesh(new THREE.SphereGeometry(0.034, 20, 14), pielLisa);
    articulacion.castShadow = true;
    codo.add(articulacion);
    codo.add(torneada([[0.0, 0.015], [0.03, 0.01], [0.037, -0.04], [0.036, -0.1], [0.03, -0.19], [0.025, -0.25], [0.0, -0.255]], pielLisa));
    // mano relajada
    const mano = new THREE.Mesh(new THREE.SphereGeometry(0.05, 24, 18), pielLisa);
    mano.scale.set(0.62, 1.45, 0.34);
    mano.position.set(lado * -0.004, -0.31, 0.004);
    mano.rotation.y = lado * 0.5;
    mano.castShadow = mano.receiveShadow = true;
    codo.add(mano);
    const pulgar = new THREE.Mesh(new THREE.CapsuleGeometry(0.011, 0.04, 4, 10), pielLisa);
    pulgar.position.set(lado * -0.022, -0.285, 0.018);
    pulgar.rotation.z = lado * 0.5;
    codo.add(pulgar);
  }

  // Focos
  const focos = {};
  for (const k of Object.keys(LUCES_BASE)) {
    const s = new THREE.SpotLight(0xffffff, 1, 0, rad(28), 0.5, 2);
    s.castShadow = k !== 'fondo';
    s.shadow.mapSize.set(k === 'principal' ? 2048 : 1024, k === 'principal' ? 2048 : 1024);
    s.shadow.bias = -0.00008;
    s.shadow.normalBias = 0.0008;
    s.shadow.camera.near = 0.2;
    s.shadow.camera.far = 5;
    scene.add(s);
    scene.add(s.target);
    focos[k] = s;
  }

  const estado = { renderer, scene, camara, sujeto, piel, fondoMat, focos, cabezaLista: false, centroCara: new THREE.Vector3(0, 0, 0) };

  // Cargar la cabeza 3D
  const tex = new THREE.TextureLoader();
  const mapa = tex.load('assets/modelo/piel.jpg', () => estado.pintar && estado.pintar());
  mapa.colorSpace = THREE.SRGBColorSpace;
  const relieve = tex.load('assets/modelo/relieve.jpg', () => estado.pintar && estado.pintar());
  piel.map = mapa;
  piel.normalMap = relieve;
  piel.normalScale = new THREE.Vector2(0.6, 0.6);
  // Por debajo de la base del cuello, el busto se «viste» con el polo negro y su ribete turquesa
  piel.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying float vAltura;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvAltura = position.y;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying float vAltura;')
      .replace('#include <map_fragment>', `#include <map_fragment>
        float esTela = 1.0 - smoothstep(-1.86, -1.82, vAltura);
        float esRibete = smoothstep(-1.86, -1.83, vAltura) * (1.0 - smoothstep(-1.76, -1.73, vAltura));
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.0075, 0.008, 0.0102), esTela);
        diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.0, 0.48, 0.6), esRibete);`)
      .replace('#include <roughnessmap_fragment>', '#include <roughnessmap_fragment>\nroughnessFactor = mix(roughnessFactor, 0.85, step(vAltura, -1.73));');
  };
  piel.needsUpdate = true;

  new GLTFLoader().load('assets/modelo/cabeza.glb', (gltf) => {
    let malla = null;
    gltf.scene.traverse((o) => { if (o.isMesh && !malla) malla = o; });
    if (!malla) return;
    // Medidas del busto (unidades del modelo): coronilla 3.97, barbilla ≈ -1.0, ojos ≈ 1.65, corte del pecho -3.97
    const g = malla.geometry;
    const esc = 0.046; // barbilla-coronilla ≈ 23 cm
    const cabeza = new THREE.Mesh(g, piel);
    cabeza.scale.setScalar(esc);
    cabeza.position.set(0, 0.085 - 1.65 * esc, -0.3 * esc);
    cabeza.castShadow = cabeza.receiveShadow = true;
    sujeto.add(cabeza);
    estado.cabezaLista = true;
    estado.pintar && estado.pintar();
  });

  return estado;
}

function actualizarEscena(e, { luces, plano, angulo, pose, fondo }) {
  const { camara, sujeto, focos, fondoMat, renderer, scene } = e;
  const W = renderer.domElement.clientWidth || 400, H = renderer.domElement.clientHeight || 500;
  renderer.setSize(W, H, false);
  camara.aspect = W / H;

  // Pose del modelo
  sujeto.rotation.y = rad(-POSES[pose].giro);

  // Punto de interés: los ojos están a ~0.085 m sobre el origen
  const ojos = new THREE.Vector3(0, 0.085, 0);

  // Cámara según plano y ángulo
  const p = PLANOS[plano];
  const objetivo = new THREE.Vector3(0, p.centro, 0);
  const altoVisible = p.alto / Math.min(1, camara.aspect / 0.8);
  const dist = (altoVisible / 2) / Math.tan(rad(camara.fov / 2));
  const el = rad(ANGULOS[angulo].el);
  camara.position.set(0, objetivo.y + Math.sin(el) * dist, Math.cos(el) * dist);
  camara.lookAt(objetivo);
  camara.updateProjectionMatrix();

  // Fondo
  fondoMat.color.set(hexFondo(fondo));

  // Focos (posición relativa al estudio, no al modelo)
  for (const [k, l] of Object.entries(luces)) {
    const s = focos[k];
    s.visible = l.on;
    if (!l.on) continue;
    const a = rad(l.az), b = rad(l.el);
    if (k === 'fondo') {
      // detrás del modelo, apuntando al papel del fondo
      s.position.set(Math.sin(a) * 0.3, ojos.y + Math.sin(b) * 0.6, -0.55);
      s.target.position.set(0, ojos.y - 0.05, -1.3);
      s.angle = rad(50);
      s.intensity = l.int * 3;
    } else {
      s.position.set(Math.sin(a) * Math.cos(b) * l.dist, ojos.y + Math.sin(b) * l.dist, Math.cos(a) * Math.cos(b) * l.dist);
      s.target.position.copy(ojos);
      s.angle = rad(34);
      s.intensity = l.int * 2.4; // con caída física: más cerca = más luz
    }
    s.penumbra = 0.25 + l.suave * 0.75;
    s.shadow.radius = 1 + l.suave * 5;
    s.shadow.blurSamples = 12;
    s.color.set(hexTono(l.tono));
    s.target.updateMatrixWorld();
  }
  renderer.render(scene, camara);
}

// ---------------------------------------------------------------------------
// PLANO CENITAL (esquema de luz arrastrable)
// ---------------------------------------------------------------------------
function PlanoCenital({ luces, seleccion, onSeleccion, onMover, pose }) {
  const svgRef = useRef(null);
  const arrastre = useRef(null);
  const T = 300, C = T / 2, RMAX = 125;
  const dist2r = (d) => 35 + ((d - 0.6) / (2.4 - 0.6)) * (RMAX - 35);
  const r2dist = (r) => 0.6 + ((Math.min(RMAX, Math.max(35, r)) - 35) / (RMAX - 35)) * (2.4 - 0.6);

  const pos = (l, k) => {
    if (k === 'fondo') return { x: C + Math.sin(rad(l.az)) * 30, y: C - 60 };
    const r = dist2r(l.dist);
    return { x: C + Math.sin(rad(l.az)) * r, y: C + Math.cos(rad(l.az)) * r };
  };

  const punto = (ev) => {
    const svg = svgRef.current;
    const rect = svg.getBoundingClientRect();
    return { x: ((ev.clientX - rect.left) / rect.width) * T - C, y: ((ev.clientY - rect.top) / rect.height) * T - C };
  };

  const mover = (ev) => {
    const k = arrastre.current;
    if (!k) return;
    ev.preventDefault();
    const { x, y } = punto(ev);
    const az = Math.round((Math.atan2(x, y) * 180) / Math.PI);
    onMover(k, { az, dist: Math.round(r2dist(Math.hypot(x, y)) * 100) / 100 });
  };

  return (
    <svg
      ref={svgRef}
      viewBox={`0 0 ${T} ${T}`}
      className="w-full max-w-[340px] mx-auto touch-none select-none"
      onPointerMove={mover}
      onPointerUp={() => (arrastre.current = null)}
      onPointerLeave={() => (arrastre.current = null)}
      role="img"
      aria-label="Esquema de luz visto desde arriba: arrastra los focos para moverlos"
    >
      <rect x="0" y="0" width={T} height={T} rx="16" fill="#0E1016" stroke="#8D93AB55" />
      {/* rejilla */}
      {[45, 85, 125].map((r) => <circle key={r} cx={C} cy={C} r={r} fill="none" stroke="#8D93AB22" strokeDasharray="3 5" />)}
      {[0, 45, 90, 135].map((a) => (
        <line key={a} x1={C + Math.sin(rad(a)) * 130} y1={C + Math.cos(rad(a)) * 130} x2={C - Math.sin(rad(a)) * 130} y2={C - Math.cos(rad(a)) * 130} stroke="#8D93AB18" />
      ))}
      {/* fondo */}
      <rect x={C - 70} y={14} width={140} height={8} rx="3" fill="#8D93AB66" />
      <text x={C} y={36} textAnchor="middle" fill="#8D93AB" fontSize="10">FONDO</text>
      {/* cámara */}
      <g transform={`translate(${C} ${T - 22})`}>
        <rect x="-14" y="-9" width="28" height="18" rx="4" fill="#00E5FF" />
        <rect x="-6" y="-16" width="12" height="8" rx="2" fill="#00E5FF" />
        <circle cx="0" cy="0" r="5" fill="#0B0C10" />
      </g>
      <line x1={C} y1={T - 40} x2={C} y2={C + 22} stroke="#00E5FF55" strokeDasharray="4 4" />
      {/* modelo */}
      <g transform={`translate(${C} ${C}) rotate(${-POSES[pose].giro})`}>
        <ellipse cx="0" cy="0" rx="26" ry="14" fill="#2A2D36" stroke="#8D93AB" />
        <circle cx="0" cy="2" r="11" fill="#C9A38A" />
        <path d="M -4 12 L 0 18 L 4 12 Z" fill="#C9A38A" />
      </g>
      {/* haces y focos */}
      {Object.entries(luces).map(([k, l]) => {
        const { x, y } = pos(l, k);
        const sel = seleccion === k;
        const tx = k === 'fondo' ? C : C, ty = k === 'fondo' ? 18 : C;
        return (
          <g key={k} opacity={l.on ? 1 : 0.35}>
            {l.on && <line x1={x} y1={y} x2={tx} y2={ty} stroke={l.color} strokeOpacity="0.45" strokeWidth={2 + l.suave * 6} strokeLinecap="round" />}
            <g
              transform={`translate(${x} ${y})`}
              style={{ cursor: k === 'fondo' ? 'pointer' : 'grab' }}
              onPointerDown={(ev) => {
                onSeleccion(k);
                if (k !== 'fondo') { arrastre.current = k; ev.currentTarget.ownerSVGElement.setPointerCapture?.(ev.pointerId); }
              }}
            >
              <circle r="22" fill="transparent" />
              {sel && <circle r="17" fill="none" stroke="#FFFFFF" strokeWidth="2" />}
              <circle r="12" fill={l.color} stroke="#0B0C10" strokeWidth="2" />
              <text y="4" textAnchor="middle" fontSize="11" fontWeight="700" fill="#0B0C10">{l.nombre[0]}</text>
            </g>
          </g>
        );
      })}
    </svg>
  );
}

// ---------------------------------------------------------------------------
// COMPONENTE PRINCIPAL
// ---------------------------------------------------------------------------
const Chip = ({ activo, onClick, children, title }) => (
  <button
    type="button"
    onClick={onClick}
    title={title}
    className={`px-3 py-1.5 rounded-full border text-sm font-semibold transition-colors whitespace-nowrap ${
      activo ? 'border-[#00E5FF] bg-[#00E5FF]/10 text-[#00E5FF]' : 'border-[#8D93AB]/40 text-[#8D93AB] hover:text-white hover:border-[#8D93AB]'
    }`}
  >
    {children}
  </button>
);

// Fila de muestras de color, con selector libre opcional
const Muestras = ({ lista, grupo, valor, onElegir, libre, grande }) => {
  const tam = grande ? 'w-9 h-9' : 'w-8 h-8';
  const personal = !lista[valor];
  return (
    <div className="flex flex-wrap gap-2 items-center">
      {Object.entries(lista).filter(([, c]) => !grupo || c.grupo === grupo).map(([id, c]) => (
        <button key={id} type="button" title={c.nombre} aria-label={c.nombre} aria-pressed={valor === id} onClick={() => onElegir(id)}
          className={`${tam} rounded-full border-2 transition-transform ${valor === id ? 'border-white scale-110 ring-2 ring-[#00E5FF]' : 'border-[#8D93AB]/40 hover:scale-105'}`}
          style={{ background: c.hex }} />
      ))}
      {libre && (
        <label title="Elegir cualquier color" className={`${tam} relative rounded-full border-2 cursor-pointer overflow-hidden ${personal ? 'border-white ring-2 ring-[#00E5FF]' : 'border-[#8D93AB]/40'}`}
          style={{ background: personal ? valor : 'conic-gradient(#ff2d2d, #ffe94d, #38e86b, #00e5ff, #3d7bff, #ff2dd1, #ff2d2d)' }}>
          <span className="sr-only">Elegir cualquier color</span>
          <input type="color" value={personal ? valor : '#00E5FF'} onChange={(e) => onElegir(e.target.value)} className="absolute inset-0 opacity-0 cursor-pointer" />
        </label>
      )}
    </div>
  );
};

const Deslizador = ({ etiqueta, valor, min, max, paso, onChange, formato }) => (
  <label className="block">
    <div className="flex justify-between text-xs text-[#8D93AB] mb-1">
      <span>{etiqueta}</span>
      <span className="text-white font-semibold">{formato ? formato(valor) : valor}</span>
    </div>
    <input type="range" min={min} max={max} step={paso} value={valor} onChange={(e) => onChange(parseFloat(e.target.value))} className="w-full accent-[#00E5FF]" />
  </label>
);

export default function TuEstudio() {
  const canvasRef = useRef(null);
  const escena = useRef(null);
  const [esquema, setEsquema] = useState('rembrandt');
  const [luces, setLuces] = useState(() => aplicarEsquema('rembrandt'));
  const [fondo, setFondo] = useState(ESQUEMAS.rembrandt.fondo);
  const [plano, setPlano] = useState('PP');
  const [angulo, setAngulo] = useState('normal');
  const [pose, setPose] = useState('frontal');
  const [seleccion, setSeleccion] = useState('principal');
  const [cargando, setCargando] = useState(true);
  const [error, setError] = useState(false);

  const params = useRef();
  params.current = { luces, plano, angulo, pose, fondo };

  // Crear la escena una sola vez
  useEffect(() => {
    let e;
    try {
      e = crearEscena(canvasRef.current);
    } catch (err) {
      setError(true);
      return;
    }
    escena.current = e;
    window.__escena = e;
    let pedido = false;
    e.pintar = () => {
      if (pedido) return;
      pedido = true;
      requestAnimationFrame(() => {
        pedido = false;
        actualizarEscena(e, params.current);
        if (e.cabezaLista) setCargando(false);
      });
    };
    const ro = new ResizeObserver(() => e.pintar());
    ro.observe(canvasRef.current);
    e.pintar();
    return () => { ro.disconnect(); e.renderer.dispose(); };
  }, []);

  // Acceso para pruebas automáticas
  useEffect(() => { window.__estudio = { setLuces, setPlano, setAngulo, setPose, setFondo, aplicarEsquema }; }, []);

  // Repintar solo cuando cambia algo (ahorra batería en el móvil)
  useEffect(() => { escena.current && escena.current.pintar(); }, [luces, plano, angulo, pose, fondo]);

  const elegirEsquema = (id) => {
    setEsquema(id);
    setLuces(aplicarEsquema(id));
    setFondo(ESQUEMAS[id].fondo);
  };

  const cambiarLuz = (k, cambios) => {
    setEsquema('personalizado');
    setLuces((prev) => ({ ...prev, [k]: { ...prev[k], ...cambios } }));
  };

  const descargar = () => {
    const c = canvasRef.current;
    if (!c) return;
    const a = document.createElement('a');
    a.download = `fotarto-${esquema}-${plano}.png`;
    a.href = c.toDataURL('image/png');
    a.click();
  };

  const l = luces[seleccion];
  const info = esquema === 'personalizado'
    ? { nombre: 'Esquema personalizado', desc: 'Has movido las luces a tu gusto. Prueba a comparar con los esquemas clásicos para ver qué cambia en las sombras de la nariz, los ojos y los pómulos.' }
    : ESQUEMAS[esquema];

  return (
    <section className="animate-in fade-in slide-in-from-bottom-4 duration-700">
      <h2 className="text-4xl md:text-5xl font-playfair font-bold text-[#00E5FF] mb-3">Tu estudio</h2>
      <p className="text-lg text-[#8D93AB] mb-8 max-w-4xl">
        Diseña tu propio esquema de luz y mira cómo cae sobre un rostro real según el plano de cámara. Elige un esquema clásico o arrastra los focos en el plano del estudio.
      </p>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,420px)] gap-8 items-start">
        {/* VISOR 3D: en el móvil se queda fijo arriba para ver el efecto mientras se mueven los controles */}
        <div className="sticky top-[var(--alto-cabecera,118px)] lg:top-[calc(var(--alto-cabecera,200px)+16px)] z-20 -mx-6 px-6 pb-2 bg-[#0B0C10] lg:mx-0 lg:px-0 lg:pb-0 lg:bg-transparent">
          <div className="relative rounded-xl overflow-hidden border-2 border-[#00E5FF] glow-box bg-[#0E0F12]">
            <canvas ref={canvasRef} className="block w-full h-[42vh] lg:h-[calc(100vh-var(--alto-cabecera,200px)-48px)] lg:min-h-[420px]" aria-label={`Simulación: ${info.nombre}, ${PLANOS[plano].nombre}, ángulo ${ANGULOS[angulo].nombre.toLowerCase()}`} />
            {(cargando || error) && (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-[#8D93AB] gap-3 bg-[#0E0F12]/80">
                <Camera className={`w-10 h-10 text-[#00E5FF] ${error ? '' : 'animate-pulse'}`} />
                <span className="text-sm tracking-widest uppercase text-center px-4">{error ? 'Tu navegador no admite gráficos 3D (WebGL)' : 'Montando el set…'}</span>
              </div>
            )}
            <div className="absolute top-3 left-3 flex flex-wrap gap-2 text-xs font-semibold">
              <span className="px-2 py-1 rounded bg-black/60 text-[#00E5FF]">{PLANOS[plano].corto}</span>
              <span className="px-2 py-1 rounded bg-black/60 text-white">{info.nombre}</span>
            </div>
            <button type="button" onClick={descargar} aria-label="Descargar foto"
              className="absolute bottom-3 right-3 flex items-center gap-2 px-3 py-2 rounded-md bg-[#00E5FF] text-[#0B0C10] font-bold text-sm hover:bg-white transition-colors shadow-lg">
              <Download className="w-4 h-4" /> <span className="hidden sm:inline">Descargar foto</span>
            </button>
          </div>
        </div>

        {/* CONTROLES */}
        <div className="space-y-6">
          <div className="p-5 rounded-xl border border-[#8D93AB]/30 bg-[#151720]">
            <h3 className="font-bold text-white mb-3 flex items-center gap-2"><Lightbulb className="w-5 h-5 text-[#00E5FF]" /> Esquema de luz</h3>
            <div className="flex flex-wrap gap-2">
              {Object.entries(ESQUEMAS).map(([id, e]) => <Chip key={id} activo={esquema === id} onClick={() => elegirEsquema(id)}>{e.nombre}</Chip>)}
            </div>
            <p className="text-sm text-[#8D93AB] mt-4 leading-relaxed"><strong className="text-white">{info.nombre}.</strong> {info.desc}</p>
          </div>

          <div className="p-5 rounded-xl border border-[#8D93AB]/30 bg-[#151720] space-y-4">
            <h3 className="font-bold text-white flex items-center gap-2"><Camera className="w-5 h-5 text-[#00E5FF]" /> Cámara y modelo</h3>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#8D93AB] mb-2">Plano</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(PLANOS).map(([id, p]) => <Chip key={id} activo={plano === id} onClick={() => setPlano(id)} title={p.nombre}>{p.corto}</Chip>)}
              </div>
              <p className="text-sm text-[#8D93AB] mt-2"><strong className="text-white">{PLANOS[plano].nombre}:</strong> {PLANOS[plano].desc}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#8D93AB] mb-2">Ángulo de cámara</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(ANGULOS).map(([id, a]) => <Chip key={id} activo={angulo === id} onClick={() => setAngulo(id)}>{a.nombre}</Chip>)}
              </div>
              <p className="text-sm text-[#8D93AB] mt-2">{ANGULOS[angulo].desc}</p>
            </div>
            <div>
              <p className="text-xs uppercase tracking-wider text-[#8D93AB] mb-2">Pose del modelo</p>
              <div className="flex flex-wrap gap-2">
                {Object.entries(POSES).map(([id, p]) => <Chip key={id} activo={pose === id} onClick={() => setPose(id)}>{p.nombre}</Chip>)}
              </div>
            </div>
          </div>

          <div className="p-5 rounded-xl border border-[#8D93AB]/30 bg-[#151720]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-bold text-white">Plano del estudio</h3>
              <button type="button" onClick={() => elegirEsquema(esquema === 'personalizado' ? 'rembrandt' : esquema)} className="text-xs text-[#8D93AB] hover:text-white flex items-center gap-1">
                <RotateCcw className="w-3.5 h-3.5" /> Restablecer
              </button>
            </div>
            <PlanoCenital luces={luces} seleccion={seleccion} onSeleccion={setSeleccion} onMover={cambiarLuz} pose={pose} />
            <p className="text-xs text-[#8D93AB] mt-2 flex gap-1.5"><Info className="w-4 h-4 shrink-0" /> Arrastra los focos para moverlos alrededor del modelo. Toca uno para ajustarlo.</p>

            <div className="flex flex-wrap gap-2 mt-4">
              {Object.entries(luces).map(([k, x]) => (
                <button key={k} type="button" onClick={() => setSeleccion(k)}
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm font-semibold ${seleccion === k ? 'border-white text-white' : 'border-[#8D93AB]/40 text-[#8D93AB]'}`}>
                  <span className="w-3 h-3 rounded-full" style={{ background: x.color, opacity: x.on ? 1 : 0.3 }} /> {x.nombre}
                </button>
              ))}
            </div>

            <div className="mt-4 p-4 rounded-lg bg-[#0B0C10] border border-[#8D93AB]/20 space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-bold text-white">Luz {l.nombre.toLowerCase()}</span>
                <button type="button" onClick={() => cambiarLuz(seleccion, { on: !l.on })}
                  className={`px-3 py-1 rounded-full text-xs font-bold ${l.on ? 'bg-[#00E5FF] text-[#0B0C10]' : 'bg-[#2A2D36] text-[#8D93AB]'}`}>
                  {l.on ? 'Encendida' : 'Apagada'}
                </button>
              </div>
              <Deslizador etiqueta="Intensidad" valor={l.int} min={0} max={1} paso={0.05} onChange={(v) => cambiarLuz(seleccion, { int: v })} formato={(v) => `${Math.round(v * 100)} %`} />
              {seleccion !== 'fondo' && (
                <>
                  <Deslizador etiqueta="Altura" valor={l.el} min={-40} max={80} paso={1} onChange={(v) => cambiarLuz(seleccion, { el: v })} formato={(v) => `${v}°`} />
                  <Deslizador etiqueta="Posición alrededor del modelo" valor={l.az} min={-180} max={180} paso={1} onChange={(v) => cambiarLuz(seleccion, { az: v })} formato={(v) => `${v}°`} />
                  <Deslizador etiqueta="Dureza → suavidad (softbox)" valor={l.suave} min={0} max={1} paso={0.05} onChange={(v) => cambiarLuz(seleccion, { suave: v })} formato={(v) => (v < 0.35 ? 'Dura' : v < 0.7 ? 'Media' : 'Suave')} />
                </>
              )}
              <div>
                <p className="text-xs text-[#8D93AB] mb-2">Color de la luz: <span className="text-white font-semibold">{nombreColor(TONOS, l.tono)}</span></p>
                <p className="text-[11px] uppercase tracking-wider text-[#8D93AB]/80 mb-1.5">Temperatura de color</p>
                <Muestras lista={TONOS} grupo="temp" valor={l.tono} onElegir={(c) => cambiarLuz(seleccion, { tono: c })} />
                <p className="text-[11px] uppercase tracking-wider text-[#8D93AB]/80 mt-3 mb-1.5">Geles de color</p>
                <Muestras lista={TONOS} grupo="gel" valor={l.tono} onElegir={(c) => cambiarLuz(seleccion, { tono: c })} libre />
              </div>
            </div>

            <div className="mt-4">
              <p className="text-xs text-[#8D93AB] mb-2">Color del fondo: <span className="text-white font-semibold">{nombreColor(FONDOS, fondo)}</span></p>
              <Muestras lista={FONDOS} valor={fondo} onElegir={(c) => { setFondo(c); setEsquema('personalizado'); }} libre grande />
            </div>
          </div>
        </div>
      </div>
      <p className="text-xs text-[#8D93AB] mt-8">Modelo 3D «Lee Perry-Smith» de Infinite-Realities, con licencia Creative Commons Atribución 3.0 (CC BY 3.0). Ropa, luces y estudio virtual: Fotarto.</p>
    </section>
  );
}
