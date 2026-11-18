import React, { useEffect, useRef, useState } from 'react';
import { Camera, Upload, ScanFace, Check, Loader2, AlertTriangle, ArrowUp, RotateCcw, ShieldCheck } from 'lucide-react';
import Funko3D, { OPCIONES_FUNKO, FUNKO_INICIAL } from './Funko3D.jsx';

// ---------------------------------------------------------------------------
// CRÉAME: detección facial real en el navegador (face-api: detector + 68 puntos
// faciales). Con los puntos se colocan las zonas de muestreo sobre la cara y se
// deducen piel, ojos, pelo (color y largo), barba y accesorios.
// La foto no sale del dispositivo.
// ---------------------------------------------------------------------------
const MAX = 720; // lado mayor del lienzo de trabajo

let cargaModelos = null;
async function modelos() {
  if (!cargaModelos) {
    cargaModelos = (async () => {
      const fa = await import('@vladmandic/face-api/dist/face-api.esm.js');
      try { await fa.tf.setBackend('webgl'); } catch { await fa.tf.setBackend('cpu'); }
      await fa.tf.ready();
      const url = new URL('assets/faceapi/', document.baseURI).href;
      await Promise.all([fa.nets.tinyFaceDetector.loadFromUri(url), fa.nets.faceLandmark68Net.loadFromUri(url)]);
      return fa;
    })();
    cargaModelos.catch(() => { cargaModelos = null; });
  }
  return cargaModelos;
}

// ---------- utilidades de color ----------
const hex = ([r, g, b]) => `#${[r, g, b].map((v) => Math.round(Math.max(0, Math.min(255, v))).toString(16).padStart(2, '0')).join('')}`;
const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
const lum = (c) => 0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2];
const ycc = ([r, g, b]) => [lum([r, g, b]), 128 - 0.169 * r - 0.331 * g + 0.5 * b, 128 + 0.5 * r - 0.419 * g - 0.081 * b];
function hsv([r, g, b]) {
  r /= 255; g /= 255; b /= 255;
  const mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0;
  if (d) h = mx === r ? ((g - b) / d) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4;
  return [(h * 60 + 360) % 360, mx ? d / mx : 0, mx];
}
const mediana = (px) => {
  if (!px.length) return null;
  const m = (k) => px.map((c) => c[k]).sort((a, b) => a - b)[Math.floor(px.length / 2)];
  return [m(0), m(1), m(2)];
};
const clamp01 = (v) => Math.max(0, Math.min(1, v));

// ---------- análisis a partir de los 68 puntos ----------
function analizar(ctx, W, H, pts) {
  const data = ctx.getImageData(0, 0, W, H).data;
  const P = pts.map((p) => [p.x, p.y]);
  const media = (ids) => ids.reduce((a, i) => [a[0] + P[i][0] / ids.length, a[1] + P[i][1] / ids.length], [0, 0]);
  const ojoI = media([36, 37, 38, 39, 40, 41]);
  const ojoD = media([42, 43, 44, 45, 46, 47]);
  const O = [(ojoI[0] + ojoD[0]) / 2, (ojoI[1] + ojoD[1]) / 2];
  const D = Math.hypot(ojoD[0] - ojoI[0], ojoD[1] - ojoI[1]); // distancia entre ojos = unidad
  const ex = [(ojoD[0] - ojoI[0]) / D, (ojoD[1] - ojoI[1]) / D];
  const ey = [-ex[1], ex[0]];
  // coordenadas locales (u a lo ancho, v hacia abajo, en unidades D) ⇄ imagen
  const aImg = (u, v) => [O[0] + (u * ex[0] + v * ey[0]) * D, O[1] + (u * ex[1] + v * ey[1]) * D];
  const aLoc = ([x, y]) => { const dx = x - O[0], dy = y - O[1]; return [(dx * ex[0] + dy * ex[1]) / D, (dx * ey[0] + dy * ey[1]) / D]; };
  const L = P.map(aLoc);
  const pix = (x, y) => {
    x = Math.round(x); y = Math.round(y);
    if (x < 0 || y < 0 || x >= W || y >= H) return null;
    const i = (y * W + x) * 4;
    return [data[i], data[i + 1], data[i + 2]];
  };
  const zonas = []; // para dibujarlas encima de la foto
  const zona = (u0, u1, v0, v1, nombre) => {
    const out = []; const paso = Math.max(0.012, (u1 - u0) / 40);
    for (let v = v0; v <= v1; v += paso) for (let u = u0; u <= u1; u += paso) { const c = pix(...aImg(u, v)); if (c) out.push(c); }
    if (nombre) zonas.push({ nombre, esquinas: [aImg(u0, v0), aImg(u1, v0), aImg(u1, v1), aImg(u0, v1)] });
    out.total = Math.round(((u1 - u0) / paso + 1) * ((v1 - v0) / paso + 1));
    return out;
  };

  const cejaV = Math.min(...[17, 18, 19, 20, 21, 22, 23, 24, 25, 26].map((i) => L[i][1]));
  const barbillaV = L[8][1];
  const anchoCara = (L[16][0] - L[0][0]) / 2;
  const bocaV = (L[51][1] + L[57][1]) / 2;

  // PIEL: mejillas a los dos lados de la nariz
  const mejI = [(L[2][0] + L[31][0]) / 2, (L[2][1] + L[31][1]) / 2 - 0.05];
  const mejD = [(L[14][0] + L[35][0]) / 2, (L[14][1] + L[35][1]) / 2 - 0.05];
  const muestrasPiel = [...zona(mejI[0] - 0.13, mejI[0] + 0.13, mejI[1] - 0.1, mejI[1] + 0.1, 'Piel'), ...zona(mejD[0] - 0.13, mejD[0] + 0.13, mejD[1] - 0.1, mejD[1] + 0.1, 'Piel')]
    .filter((c) => lum(c) > 35 && lum(c) < 248);
  const piel = mediana(muestrasPiel) || [200, 160, 130];
  const pY = ycc(piel);
  const esPiel = (c) => { const q = ycc(c); return Math.abs(q[1] - pY[1]) < 11 && Math.abs(q[2] - pY[2]) < 13 && q[0] > pY[0] * 0.5 && q[0] < pY[0] * 1.45; };
  const homogeneidad = muestrasPiel.filter(esPiel).length / Math.max(1, muestrasPiel.length);

  // FONDO: esquinas superiores de la foto
  const fondos = [];
  for (const [x0, y0] of [[0, 0], [W * 0.88, 0]]) { const px = []; for (let y = y0; y < H * 0.1; y += 3) for (let x = x0; x < x0 + W * 0.12; x += 3) { const c = pix(x, y); if (c) px.push(c); } if (px.length) fondos.push(mediana(px)); }
  const esFondo = (c) => fondos.some((f) => dist(c, f) < 34);

  // PELO: franja por encima de la frente
  const franja = zona(-0.62, 0.62, cejaV - 1.25, cejaV - 0.6, 'Pelo');
  const pelos = franja.filter((c) => !esPiel(c) && !esFondo(c));
  const pielArriba = franja.filter(esPiel).length / Math.max(1, franja.length);
  const partePelo = pelos.length / Math.max(1, franja.length);
  let pelo = mediana(pelos);
  // gorro / sombrero: color plano y poco natural para un pelo, o algo más ancho que la cabeza
  let gorro = 'nada', confGorro = 0;
  if (pelo && partePelo > 0.5) {
    const [h, s, v] = hsv(pelo);
    const disp = pelos.reduce((a, c) => a + dist(c, pelo), 0) / pelos.length;
    const raro = (s > 0.5 && (h > 55 && h < 330)) || (v > 0.82 && s < 0.12) || (s > 0.72 && v > 0.45);
    const lado = [...zona(-1.85, -1.45, cejaV - 0.75, cejaV - 0.5), ...zona(1.45, 1.85, cejaV - 0.75, cejaV - 0.5)];
    const ala = lado.filter((c) => dist(c, pelo) < 30).length / Math.max(1, lado.length);
    if (ala > 0.55 && !esFondo(pelo)) { gorro = 'sombrero'; confGorro = 0.55 + ala * 0.3; }
    else if (raro && disp < 32) { gorro = 'gorra'; confGorro = 0.55 + (32 - disp) / 80; }
  }
  // con gorra o sombrero el pelo se busca en las sienes y los lados
  let peloTapado = false;
  if (gorro !== 'nada') {
    const tapa = pelo;
    const lados = [...zona(-anchoCara - 0.3, -anchoCara + 0.05, -0.7, 0.3), ...zona(anchoCara - 0.05, anchoCara + 0.3, -0.7, 0.3)]
      .filter((c) => !esPiel(c) && !esFondo(c) && dist(c, tapa) > 45);
    pelo = lados.length > 12 ? mediana(lados) : null;
    peloTapado = !pelo;
  }
  // LARGO DEL PELO
  const ref = pelo || [40, 30, 25];
  const comoPelo = (c) => dist(c, ref) < 52 && !esPiel(c) && !esFondo(c);
  const parte = (px) => px.filter(comoPelo).length / Math.max(1, px.length);
  const ld = (s, v0, v1, nombre) => parte(zona(s < 0 ? -anchoCara - 0.55 : anchoCara + 0.08, s < 0 ? -anchoCara - 0.08 : anchoCara + 0.55, v0, v1, nombre));
  const sienes = Math.min(ld(-1, -0.2, 0.5), ld(1, -0.2, 0.5));
  const barbillaLados = Math.min(ld(-1, bocaV, barbillaV, 'Largo'), ld(1, bocaV, barbillaV, 'Largo'));
  const hombros = Math.min(ld(-1, barbillaV + 0.1, barbillaV + 0.75, 'Largo'), ld(1, barbillaV + 0.1, barbillaV + 0.75, 'Largo'));
  const volumen = parte(zona(-0.6, 0.6, cejaV - 1.85, cejaV - 1.45));
  let peinado = 'corto', largo = 'Corto', confLargo;
  if (gorro === 'nada' && partePelo < 0.22 && pielArriba > 0.35) { peinado = 'calvo'; largo = 'Sin pelo'; confLargo = 0.6 + pielArriba * 0.35; }
  else if (gorro === 'nada' && partePelo < 0.45 && pielArriba > 0.25) { peinado = 'rapado'; largo = 'Rapado'; confLargo = 0.62; }
  else if (hombros > 0.32) { peinado = 'largo'; largo = 'Largo (por debajo de los hombros)'; confLargo = 0.6 + hombros * 0.35; }
  else if (barbillaLados > 0.32) { peinado = 'largo'; largo = 'Media melena'; confLargo = 0.58 + barbillaLados * 0.3; }
  else if (gorro === 'nada' && volumen > 0.55 && sienes > 0.5) { peinado = 'afro'; largo = 'Mucho volumen'; confLargo = 0.6 + volumen * 0.25; }
  else confLargo = 0.62 + (1 - Math.max(hombros, barbillaLados)) * 0.3;

  // OJOS: iris dentro de cada ojo, sin pupila ni blanco
  const iris = [];
  for (const [ids, centro] of [[[36, 37, 38, 39, 40, 41], ojoI], [[42, 43, 44, 45, 46, 47], ojoD]]) {
    const ancho = Math.hypot(P[ids[3]][0] - P[ids[0]][0], P[ids[3]][1] - P[ids[0]][1]);
    const alto = (Math.hypot(P[ids[1]][0] - P[ids[5]][0], P[ids[1]][1] - P[ids[5]][1]) + Math.hypot(P[ids[2]][0] - P[ids[4]][0], P[ids[2]][1] - P[ids[4]][1])) / 2;
    const r = Math.min(ancho * 0.22, alto * 0.48);
    for (let dy = -r; dy <= r; dy += 0.5) for (let dx = -r; dx <= r; dx += 0.5) {
      const d = Math.hypot(dx, dy) / r;
      if (d > 1 || d < 0.3) continue;
      const c = pix(centro[0] + dx, centro[1] + dy);
      if (!c) continue;
      const [, s, v] = hsv(c);
      if (v > 0.12 && !(v > 0.72 && s < 0.18) && !esPiel(c)) iris.push(c);
    }
  }
  const colorIris = mediana(iris) || [70, 45, 30];
  const oscuridadOjos = lum(colorIris);
  let ojos = 'marron', confOjos = 0.55;
  {
    const [h, s, v] = hsv(colorIris);
    if (v < 0.2) { ojos = 'marron'; confOjos = 0.7; }
    else if (h >= 170 && h <= 260 && s > 0.1) { ojos = 'azul'; confOjos = 0.55 + clamp01(s) * 0.4; }
    else if (h >= 70 && h < 170 && s > 0.1) { ojos = 'verde'; confOjos = 0.5 + clamp01(s) * 0.4; }
    else if (s < 0.14 && v > 0.32) { ojos = 'gris'; confOjos = 0.55; }
    else if (h >= 28 && h < 70 && v > 0.33 && s > 0.3) { ojos = 'avellana'; confOjos = 0.52; }
    else { ojos = 'marron'; confOjos = 0.6 + (1 - v) * 0.3; }
  }

  // GAFAS: de sol (ojos muy oscuros y planos) o graduadas (montura en el puente y bajo los ojos)
  let gafas = 'nada', confGafas;
  const zonaOjos = [...zona(-0.75, -0.25, -0.15, 0.15, 'Gafas'), ...zona(0.25, 0.75, -0.15, 0.15, 'Gafas')];
  const oscuros = zonaOjos.filter((c) => lum(c) < lum(piel) * 0.42).length / Math.max(1, zonaOjos.length);
  const puente = zona(-0.09, 0.09, -0.12, 0.06, 'Gafas');
  const marcoPuente = puente.filter((c) => !esPiel(c) && Math.abs(lum(c) - lum(piel)) > 28).length / Math.max(1, puente.length);
  const bajo = [...zona(-0.75, -0.3, 0.26, 0.4), ...zona(0.3, 0.75, 0.26, 0.4)];
  const marcoBajo = bajo.filter((c) => !esPiel(c)).length / Math.max(1, bajo.length);
  if (oscuros > 0.6) { gafas = 'sol'; confGafas = 0.5 + oscuros * 0.45; }
  else if (marcoPuente > 0.35 && marcoBajo > 0.18) { gafas = 'vista'; confGafas = 0.45 + (marcoPuente + marcoBajo) * 0.35; }
  else confGafas = 0.6 + (1 - Math.max(marcoPuente, marcoBajo)) * 0.3;

  // BARBA, BIGOTE, PERILLA: zonas más oscuras que la piel y que no son piel
  const vello = (px) => px.filter((c) => !esPiel(c) && lum(c) < lum(piel) * 0.8).length / Math.max(1, px.length);
  const menton = vello(zona(L[7][0] + 0.05, L[9][0] - 0.05, L[57][1] + 0.08, barbillaV - 0.1, 'Barba'));
  const carrillos = Math.min(
    vello(zona(L[4][0] + 0.12, L[48][0] - 0.1, L[48][1] - 0.05, L[57][1], 'Barba')),
    vello(zona(L[54][0] + 0.1, L[12][0] - 0.12, L[54][1] - 0.05, L[57][1], 'Barba')));
  const labioSup = vello(zona(L[48][0] + 0.06, L[54][0] - 0.06, L[33][1] + 0.05, L[51][1] - 0.04, 'Bigote'));
  let barba = 'nada', confBarba, tipoBarba = 'Sin barba';
  if (menton > 0.42 && carrillos > 0.3) { barba = 'barba'; tipoBarba = 'Barba completa'; confBarba = 0.55 + (menton + carrillos) * 0.22; }
  else if (menton > 0.42) { barba = 'perilla'; tipoBarba = labioSup > 0.4 ? 'Perilla y bigote' : 'Perilla'; confBarba = 0.5 + menton * 0.35; }
  else if (menton > 0.21 && (carrillos > 0.15 || labioSup > 0.4)) { barba = 'barba'; tipoBarba = 'Barba de pocos días'; confBarba = 0.5 + (menton + labioSup) * 0.2; }
  else if (labioSup > 0.45) { barba = 'bigote'; tipoBarba = 'Bigote'; confBarba = 0.5 + labioSup * 0.35; }
  else confBarba = 0.62 + (1 - Math.max(menton, carrillos, labioSup)) * 0.33;

  // PENDIENTES: puntos brillantes o dorados bajo el lóbulo de la oreja
  let pendientes = false, confPend;
  {
    const lobulo = (s) => zona(s < 0 ? L[2][0] - 0.32 : L[14][0] + 0.06, s < 0 ? L[2][0] - 0.06 : L[14][0] + 0.32, L[2][1] - 0.05, L[4][1] + 0.1, 'Pendientes');
    const brillos = (px) => px.filter((c) => { const [h, s, v] = hsv(c); return (v > 0.86 && s < 0.2 && lum(c) > lum(piel) * 1.18) || (h > 38 && h < 58 && s > 0.45 && v > 0.65); }).length / Math.max(1, px.length);
    const b = Math.max(brillos(lobulo(-1)), brillos(lobulo(1)));
    pendientes = b > 0.015 && b < 0.25;
    confPend = pendientes ? 0.45 + Math.min(0.35, b * 6) : 0.6;
  }

  // ROPA: debajo de la barbilla
  const ropaPx = zona(-0.7, 0.7, barbillaV + 1.1, barbillaV + 1.4, 'Ropa').filter((c) => !esPiel(c));
  const ropa = ropaPx.length > 20 ? mediana(ropaPx) : null;

  // nombres legibles
  const nombrePelo = (() => {
    if (peloTapado) return 'Tapado';
    if (!pelo || peinado === 'calvo') return '—';
    const [h, s, v] = hsv(pelo);
    if (v < 0.2) return s > 0.3 ? 'Castaño oscuro' : 'Negro';
    if (s < 0.16 && v > 0.42) return 'Canoso';
    if ((h < 22 || h > 345) && s > 0.42 && v > 0.3) return 'Pelirrojo';
    if (h >= 22 && h < 55 && v > 0.52 && s > 0.2) return 'Rubio';
    if (v < 0.32) return 'Castaño oscuro';
    return 'Castaño';
  })();
  const confPelo = pelo ? 0.5 + clamp01(partePelo) * 0.45 : 0.5;

  // la piel suele salir más apagada en las fotos: se aviva un poco para la figura
  const pielFunko = hex(piel.map((x) => x * 1.06 + 8));
  const peloFunko = pelo ? hex(pelo.map((x) => x * 1.12 + 4)) : '#3b2618';

  return {
    zonas, cara: { O, D },
    medidas: { menton, carrillos, labioSup, partePelo, pielArriba, sienes, barbillaLados, hombros, volumen, oscuros, marcoPuente, marcoBajo, iris: hex(colorIris), pelo: pelo && hex(pelo), piel: hex(piel), ropa: ropa && hex(ropa), gorro },
    rasgos: [
      { k: 'Piel', valor: 'Tono detectado', color: pielFunko, conf: 0.55 + homogeneidad * 0.42 },
      { k: 'Ojos', valor: OPCIONES_FUNKO.ojos[ojos].nombre, color: hex(colorIris), conf: Math.min(0.92, confOjos) },
      { k: 'Color de pelo', valor: nombrePelo, color: pelo && peinado !== 'calvo' ? peloFunko : null, conf: confPelo },
      { k: 'Largo del pelo', valor: largo, conf: Math.min(0.95, confLargo) },
      { k: 'Barba', valor: tipoBarba, conf: Math.min(0.95, confBarba) },
      { k: 'Gafas', valor: { nada: 'Sin gafas', vista: 'Gafas graduadas', sol: 'Gafas de sol' }[gafas], conf: Math.min(0.95, confGafas) },
      { k: 'En la cabeza', valor: { nada: 'Nada', gorra: 'Gorra o gorro', sombrero: 'Sombrero' }[gorro], conf: gorro === 'nada' ? 0.7 : Math.min(0.9, confGorro) },
      { k: 'Pendientes', valor: pendientes ? 'Sí (posibles)' : 'No se ven', conf: Math.min(0.85, confPend) },
      ...(ropa ? [{ k: 'Ropa', valor: 'Color de la camiseta', color: hex(ropa), conf: 0.75 }] : []),
    ],
    funko: {
      piel: pielFunko, pelo: peloFunko, ojos, peinado, barba, gafas, gorro,
      accesorios: pendientes ? ['pendientes'] : [],
      ropaColor: ropa ? hex(ropa) : '#1B1C20',
      oscuridadOjos,
    },
  };
}

const PASOS = ['Cargando el detector facial', 'Buscando tu cara', 'Colocando 68 puntos faciales', 'Midiendo el tono de piel', 'Analizando el pelo', 'Leyendo el color de ojos', 'Buscando barba o bigote', 'Buscando accesorios'];

export default function FunkoCreame({ onCrear }) {
  const [foto, setFoto] = useState(null);
  const [paso, setPaso] = useState(-1); // -1 nada · 0..7 en curso · 8 terminado
  const [error, setError] = useState('');
  const [res, setRes] = useState(null);
  const [uniforme, setUniforme] = useState(false);
  const [aviso, setAviso] = useState('');
  const img = useRef(null);
  const lienzo = useRef(null);
  const anim = useRef(0);

  const cargar = (f) => {
    if (!f) return;
    setRes(null); setError(''); setAviso(''); setPaso(-1);
    setFoto(URL.createObjectURL(f));
  };

  const espera = (ms) => new Promise((r) => setTimeout(r, ms));

  // dibujo de la capa: barrido mientras se analiza y puntos/zonas al terminar
  const dibujar = (estado) => {
    const cv = lienzo.current, i = img.current;
    if (!cv || !i) return;
    const k = cv.width / i.naturalWidth;
    const c = cv.getContext('2d');
    c.clearRect(0, 0, cv.width, cv.height);
    const t = performance.now() / 1000;
    if (estado.barrido) {
      const y = ((Math.sin(t * 1.8) + 1) / 2) * cv.height;
      const gr = c.createLinearGradient(0, y - 40, 0, y + 4);
      gr.addColorStop(0, 'rgba(0,229,255,0)'); gr.addColorStop(1, 'rgba(0,229,255,0.35)');
      c.fillStyle = gr; c.fillRect(0, y - 40, cv.width, 44);
      c.fillStyle = '#00E5FF'; c.fillRect(0, y, cv.width, 2);
    }
    if (estado.caja) {
      const { x, y, width: w, height: h } = estado.caja;
      const L = Math.min(w, h) * 0.18;
      c.strokeStyle = '#00E5FF'; c.lineWidth = Math.max(2, cv.width / 220);
      c.beginPath();
      [[x, y, 1, 1], [x + w, y, -1, 1], [x, y + h, 1, -1], [x + w, y + h, -1, -1]].forEach(([a, b, sx, sy]) => {
        c.moveTo((a + sx * L) * k, b * k); c.lineTo(a * k, b * k); c.lineTo(a * k, (b + sy * L) * k);
      });
      c.stroke();
    }
    if (estado.zonas) {
      c.lineWidth = 1;
      estado.zonas.forEach((z) => {
        c.strokeStyle = 'rgba(255,255,255,0.45)'; c.setLineDash([4, 3]);
        c.beginPath(); z.esquinas.forEach(([x, y], n) => (n ? c.lineTo(x * k, y * k) : c.moveTo(x * k, y * k))); c.closePath(); c.stroke();
      });
      c.setLineDash([]);
    }
    if (estado.puntos) {
      const n = estado.cuantos ?? estado.puntos.length;
      const r = Math.max(1.6, cv.width / 260);
      // líneas de contorno (mandíbula, cejas, nariz, ojos, boca)
      const tramos = [[0, 16], [17, 21], [22, 26], [27, 30], [31, 35], [36, 41, true], [42, 47, true], [48, 59, true], [60, 67, true]];
      c.strokeStyle = 'rgba(0,229,255,0.45)'; c.lineWidth = Math.max(1, cv.width / 500);
      tramos.forEach(([a, b, cerrar]) => {
        if (a >= n) return;
        c.beginPath();
        for (let j = a; j <= Math.min(b, n - 1); j++) { const p = estado.puntos[j]; j === a ? c.moveTo(p.x * k, p.y * k) : c.lineTo(p.x * k, p.y * k); }
        if (cerrar && b < n) c.closePath();
        c.stroke();
      });
      c.fillStyle = '#00E5FF';
      estado.puntos.slice(0, n).forEach((p) => { c.beginPath(); c.arc(p.x * k, p.y * k, r, 0, Math.PI * 2); c.fill(); });
    }
  };

  useEffect(() => () => cancelAnimationFrame(anim.current), []);

  const escanear = async () => {
    const i = img.current;
    if (!i || !i.naturalWidth) return;
    setError(''); setRes(null); setAviso('');
    const cv = lienzo.current;
    cv.width = Math.min(1000, i.naturalWidth); cv.height = Math.round(cv.width * (i.naturalHeight / i.naturalWidth));
    const estado = { barrido: true };
    const bucle = () => { dibujar(estado); anim.current = requestAnimationFrame(bucle); };
    cancelAnimationFrame(anim.current); bucle();
    try {
      setPaso(0);
      const fa = await modelos();
      setPaso(1);
      // lienzo de trabajo
      const k = Math.min(1, MAX / Math.max(i.naturalWidth, i.naturalHeight));
      const W = Math.round(i.naturalWidth * k), H = Math.round(i.naturalHeight * k);
      const t = document.createElement('canvas'); t.width = W; t.height = H;
      const ctx = t.getContext('2d', { willReadFrequently: true });
      ctx.drawImage(i, 0, 0, W, H);
      let dets = await fa.detectAllFaces(t, new fa.TinyFaceDetectorOptions({ inputSize: 416, scoreThreshold: 0.35 })).withFaceLandmarks();
      if (!dets.length) dets = await fa.detectAllFaces(t, new fa.TinyFaceDetectorOptions({ inputSize: 608, scoreThreshold: 0.25 })).withFaceLandmarks();
      if (!dets.length) throw new Error('sin-cara');
      const buenas = dets.filter((x) => x.detection.score >= 0.5);
      if (buenas.length) dets = buenas;
      dets.sort((a, b) => b.detection.box.area - a.detection.box.area);
      if (dets.length > 1) setAviso(`Hemos encontrado ${dets.length} caras: usamos la más grande.`);
      const d = dets[0];
      const aOrig = (p) => ({ x: p.x / k, y: p.y / k });
      const box = d.detection.box;
      estado.caja = { x: box.x / k, y: box.y / k, width: box.width / k, height: box.height / k };
      await espera(450);
      setPaso(2);
      const puntos = d.landmarks.positions.map(aOrig);
      estado.puntos = puntos;
      for (let n = 0; n <= 68; n += 4) { estado.cuantos = n; await espera(28); }
      estado.cuantos = 68;
      const r = analizar(ctx, W, H, d.landmarks.positions);
      for (let s = 3; s < PASOS.length; s++) { setPaso(s); await espera(380); }
      estado.barrido = false;
      estado.zonas = r.zonas.map((z) => ({ ...z, esquinas: z.esquinas.map(([x, y]) => [x / k, y / k]) }));
      r.confianzaCara = d.detection.score;
      setRes(r);
      window.__creame = r.medidas;
      setPaso(PASOS.length);
      await espera(60);
    } catch (e) {
      estado.barrido = false;
      setPaso(-1);
      setError(e.message === 'sin-cara'
        ? 'No hemos encontrado ninguna cara. Prueba con una foto de frente, con buena luz y la cara despejada.'
        : 'No se ha podido cargar el detector facial. Revisa tu conexión y vuelve a intentarlo.');
    } finally {
      cancelAnimationFrame(anim.current);
      dibujar(estado);
    }
  };

  const funkoRes = res && {
    ...FUNKO_INICIAL,
    ...res.funko,
    objeto: 'camara',
    ropa: uniforme ? 'uniforme' : 'camiseta',
    ropaColor: uniforme ? 'negro' : res.funko.ropaColor,
  };
  const pasarlo = () => onCrear(funkoRes);

  const analizando = paso >= 0 && paso < PASOS.length;

  return (
    <div className="rounded-2xl border-2 border-[#00E5FF] glow-box bg-[#0E1016] p-4 sm:p-6 md:p-8">
      <div className="flex flex-wrap items-center gap-3 mb-2">
        <span className="px-3 py-1 rounded-full bg-[#00E5FF] text-[#0B0C10] text-sm font-extrabold tracking-[0.25em]">¡CRÉAME!</span>
        <h3 className="text-2xl md:text-3xl font-playfair font-bold text-white">Tu Funko a partir de una foto</h3>
      </div>
      <p className="text-[#8D93AB] mb-2 max-w-3xl">Sube una foto de frente y nuestro escáner facial localiza tu cara, coloca 68 puntos sobre ella y reconoce tu tono de piel, el color de tus ojos, el color y el largo de tu pelo, si llevas barba, bigote o perilla y accesorios como gafas, gorra o pendientes.</p>
      <p className="text-xs text-[#8D93AB] mb-6 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-[#00E5FF]" /> La foto se analiza en tu propio dispositivo: no se envía a ningún sitio.</p>

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
        <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] gap-6 lg:gap-8 items-start">
          {/* foto + capa de detección */}
          <div className="space-y-3">
            <div className="relative rounded-xl overflow-hidden bg-[#2A2D36] mx-auto max-w-md">
              <img ref={img} src={foto} alt="Tu foto" className="block w-full h-auto max-h-[70vh] object-contain" onLoad={escanear} />
              <canvas ref={lienzo} className="absolute inset-0 w-full h-full pointer-events-none" />
              {analizando && (
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-[#0B0C10]/80 text-[#00E5FF] text-xs font-bold flex items-center gap-1.5"><ScanFace className="w-4 h-4" /> Escaneando…</div>
              )}
              {res && (
                <div className="absolute top-2 left-2 px-2.5 py-1 rounded-full bg-[#0B0C10]/80 text-[#00E5FF] text-xs font-bold flex items-center gap-1.5"><Check className="w-4 h-4" /> Cara detectada · {Math.round(res.confianzaCara * 100)} %</div>
              )}
            </div>
            {!analizando && (
              <button type="button" onClick={escanear} className="mx-auto flex items-center gap-1.5 text-xs text-[#8D93AB] hover:text-white"><RotateCcw className="w-3.5 h-3.5" /> Volver a escanear</button>
            )}
          </div>

          <div className="space-y-4">
            {/* pasos del escaneo */}
            {(analizando || error) && (
              <ol className="p-4 rounded-lg bg-[#151720] border border-[#8D93AB]/30 space-y-2 text-sm">
                {PASOS.map((t, n) => (
                  <li key={t} className={`flex items-center gap-2 ${n < paso ? 'text-[#C9CDD8]' : n === paso ? 'text-white font-semibold' : 'text-[#8D93AB]/50'}`}>
                    {n < paso ? <Check className="w-4 h-4 text-[#00E5FF]" /> : n === paso ? <Loader2 className="w-4 h-4 animate-spin text-[#00E5FF]" /> : <span className="w-4 h-4 rounded-full border border-current" />}
                    {t}
                  </li>
                ))}
              </ol>
            )}
            {error && (
              <p className="p-4 rounded-lg border border-[#ff6b6b]/50 bg-[#ff6b6b]/10 text-[#ffb3b3] text-sm flex gap-2"><AlertTriangle className="w-5 h-5 shrink-0" />{error}</p>
            )}

            {res && (
              <>
                {aviso && <p className="text-xs text-[#8D93AB]">{aviso}</p>}
                <div className="grid sm:grid-cols-[minmax(0,1fr)_minmax(0,200px)] gap-4 items-start">
                  <div className="p-4 rounded-lg bg-[#151720] border border-[#8D93AB]/30">
                    <p className="text-white font-semibold mb-3">Esto es lo que ha reconocido el escáner</p>
                    <ul className="space-y-2.5">
                      {res.rasgos.map((r) => (
                        <li key={r.k} className="text-sm">
                          <div className="flex items-center justify-between gap-2">
                            <span className="text-[#8D93AB]">{r.k}</span>
                            <span className="flex items-center gap-1.5 text-white font-semibold text-right">
                              {r.color && <span className="w-4 h-4 rounded-full border border-white/30 shrink-0" style={{ background: r.color }} />}
                              {r.valor}
                            </span>
                          </div>
                          <div className="mt-1 h-1 rounded-full bg-[#2A2D36] overflow-hidden" title={`Confianza ${Math.round(r.conf * 100)} %`}>
                            <div className="h-full rounded-full bg-[#00E5FF]" style={{ width: `${Math.round(r.conf * 100)}%`, opacity: 0.45 + r.conf * 0.55 }} />
                          </div>
                        </li>
                      ))}
                    </ul>
                    <p className="text-[11px] text-[#8D93AB] mt-3">La barra indica la seguridad del escáner en cada rasgo.</p>
                  </div>
                  <div className="space-y-2">
                    <Funko3D opciones={funkoRes} etiqueta="Tu Funko desde la foto" />
                  </div>
                </div>
                <label className="flex items-center gap-3 text-sm text-white cursor-pointer">
                  <input type="checkbox" checked={uniforme} onChange={(e) => setUniforme(e.target.checked)} className="w-5 h-5 accent-[#00E5FF]" />
                  Vestirme con el uniforme de Fotarto
                </label>
                <button type="button" onClick={pasarlo} className="inline-flex items-center gap-2 px-6 py-3 rounded-full bg-[#00E5FF] text-[#0B0C10] font-bold hover:bg-white transition-colors">
                  <ArrowUp className="w-5 h-5" /> Usar este Funko y retocarlo
                </button>
                <p className="text-xs text-[#8D93AB]">Si algo no cuadra, cámbialo en «Personalízalo» y añade a mano los accesorios que quieras.</p>
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
