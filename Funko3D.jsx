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

// Opciones de personalización (los colores pueden ser de la lista o uno libre en #rrggbb)
export const OPCIONES_FUNKO = {
  piel: { claro: { nombre: 'Clara', hex: '#F6D5BD' }, medio: { nombre: 'Media', hex: '#F2C6A2' }, tostado: { nombre: 'Tostada', hex: '#D49A72' }, moreno: { nombre: 'Morena', hex: '#B07850' }, oscuro: { nombre: 'Oscura', hex: '#7A4B30' } },
  pelo: { castano: { nombre: 'Castaño', hex: '#3B2618' }, negro: { nombre: 'Negro', hex: '#151212' }, rubio: { nombre: 'Rubio', hex: '#D8B160' }, pelirrojo: { nombre: 'Pelirrojo', hex: '#A8431E' }, gris: { nombre: 'Canoso', hex: '#A3A3A6' }, rosa: { nombre: 'Rosa', hex: '#F28AB8' }, turquesa: { nombre: 'Turquesa Fotarto', hex: '#00C8E0' } },
  peinado: { corto: 'Corto', largo: 'Melena', coleta: 'Coleta', mono: 'Moño', afro: 'Rizos', rapado: 'Rapado', calvo: 'Calvo' },
  barba: { nada: 'Sin barba', barba: 'Barba', bigote: 'Bigote', perilla: 'Perilla' },
  gafas: { nada: 'Sin gafas', vista: 'Gafas', sol: 'Gafas de sol' },
  gorro: { nada: 'Nada', gorra: 'Gorra Fotarto', sombrero: 'Sombrero', lana: 'Gorro de lana', diadema: 'Diadema', auriculares: 'Auriculares' },
  ojos: { clasico: { nombre: 'Clásicos Funko', hex: '#050505' }, marron: { nombre: 'Marrones', hex: '#6B3E1F' }, avellana: { nombre: 'Avellana', hex: '#9A7432' }, verde: { nombre: 'Verdes', hex: '#3E8E4F' }, azul: { nombre: 'Azules', hex: '#3D7BCF' }, gris: { nombre: 'Grises', hex: '#8A949E' } },
  accesorios: { pendientes: 'Pendientes', collar: 'Collar', bufanda: 'Bufanda', pajarita: 'Pajarita', reloj: 'Reloj', pecas: 'Pecas', mochila: 'Mochila' },
  ropa: { uniforme: 'Uniforme Fotarto', camiseta: 'Camiseta', sudadera: 'Sudadera', elegante: 'Traje', vestido: 'Vestido' },
  ropaColor: { blanco: { nombre: 'Blanco', hex: '#F2F2F2' }, negro: { nombre: 'Negro', hex: '#1B1C20' }, rojo: { nombre: 'Rojo', hex: '#C0392B' }, azul: { nombre: 'Azul', hex: '#2E5BBA' }, verde: { nombre: 'Verde', hex: '#2E8B57' }, rosa: { nombre: 'Rosa', hex: '#E85D9A' }, amarillo: { nombre: 'Amarillo', hex: '#F2C230' }, turquesa: { nombre: 'Turquesa', hex: '#00B8CC' } },
  objeto: { camara: 'Cámara', ramo: 'Ramo de flores', movil: 'Móvil', nada: 'Nada' },
};
export const COLOR_ROPA_DEFECTO = { uniforme: 'negro', camiseta: 'blanco', sudadera: 'rojo', elegante: 'rojo', vestido: 'rosa' };
export const FUNKO_INICIAL = { piel: 'medio', pelo: 'castano', ojos: 'clasico', peinado: 'corto', barba: 'nada', gafas: 'nada', gorro: 'nada', accesorios: [], ropa: 'uniforme', ropaColor: 'negro', objeto: 'camara', nombre: '' };
export const colorDe = (lista, v) => (lista[v] ? lista[v].hex : v);

// Texto con el nombre para la peana
function texturaNombre() {
  const c = document.createElement('canvas'); c.width = 1024; c.height = 96;
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 4;
  t.userData.dibujar = (txt) => {
    const ctx = c.getContext('2d');
    ctx.clearRect(0, 0, c.width, c.height);
    ctx.fillStyle = '#00E5FF';
    ctx.font = '700 64px "Montserrat", Arial, sans-serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText((txt || '').toUpperCase().slice(0, 18), c.width / 2, c.height / 2 + 4);
    t.needsUpdate = true;
  };
  return t;
}

function crearFunko() {
  const g = new THREE.Group();
  const P = {};
  const piel = mat(0xf2c6a2, 0.6);
  const pelo = mat(0x3b2618, 0.7);
  const tela = mat(0x141519, 0.85);
  const pantalon = mat(0x1d1e23, 0.8);
  const zapato = mat(0x0c0c0e, 0.4);
  const turquesa = mat(0x00c8e0, 0.45, { emissive: 0x003a42 });
  const negroBrillo = mat(0x050506, 0.15, { metalness: 0.2 });
  const blanco = mat(0xf4f4f4, 0.6);
  const acento = mat(0xc0392b, 0.5); // corbata del traje
  Object.assign(P, { piel, pelo, tela, acento });
  const grupo = (padre) => { const x = new THREE.Group(); padre.add(x); return x; };

  // peana con aro turquesa y nombre
  const peana = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.66, 0.1, 64), negroBrillo);
  peana.position.y = 0.05; peana.receiveShadow = true; g.add(peana);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(0.64, 0.012, 8, 80), turquesa);
  aro.rotation.x = Math.PI / 2; aro.position.y = 0.1; g.add(aro);
  const texNombre = texturaNombre();
  const banda = new THREE.Mesh(new THREE.CylinderGeometry(0.665, 0.665, 0.07, 64, 1, true, -Math.PI / 2.4, Math.PI / 1.2),
    new THREE.MeshStandardMaterial({ map: texNombre, transparent: true, depthWrite: false, roughness: 0.4, emissive: 0x00e5ff, emissiveMap: texNombre, emissiveIntensity: 0.4 }));
  banda.position.y = 0.045; g.add(banda);
  P.texNombre = texNombre;

  // piernas, zapatos y falda del vestido
  for (const s of [-1, 1]) {
    const pierna = caja(0.19, 0.34, 0.22, 0.07, pantalon); pierna.position.set(s * 0.115, 0.33, 0); g.add(pierna);
    const zap = caja(0.2, 0.11, 0.3, 0.05, zapato); zap.position.set(s * 0.115, 0.155, 0.04); g.add(zap);
  }
  P.falda = new THREE.Mesh(new THREE.CylinderGeometry(0.29, 0.36, 0.3, 40), tela);
  P.falda.position.y = 0.36; P.falda.castShadow = true; g.add(P.falda);

  // torso
  const torso = caja(0.54, 0.5, 0.34, 0.1, tela); torso.position.y = 0.72; g.add(torso);
  const cuello = new THREE.Mesh(new THREE.TorusGeometry(0.11, 0.028, 12, 40), tela);
  cuello.rotation.x = Math.PI / 2; cuello.scale.set(1, 0.8, 1); cuello.position.y = 0.97; g.add(cuello);

  // detalles del uniforme de Fotarto: ribetes, botones y logotipos
  P.uniforme = grupo(g);
  const bajo = caja(0.545, 0.03, 0.345, 0.015, turquesa); bajo.position.y = 0.48; P.uniforme.add(bajo);
  for (const s of [-1, 1]) {
    const costura = new THREE.Mesh(new THREE.BoxGeometry(0.012, 0.42, 0.014), turquesa);
    costura.position.set(s * 0.271, 0.71, 0); P.uniforme.add(costura);
  }
  const ribete = new THREE.Mesh(new THREE.TorusGeometry(0.115, 0.009, 8, 40), turquesa);
  ribete.rotation.x = Math.PI / 2; ribete.scale.set(1, 0.8, 1); ribete.position.y = 0.99; P.uniforme.add(ribete);
  for (let i = 0; i < 2; i++) { const bt = bola(0.012, tela); bt.position.set(0, 0.9 - i * 0.05, 0.172); P.uniforme.add(bt); }
  const lp = calcomania('pecho', 0.15); lp.position.set(0.13, 0.84, 0.1715); P.uniforme.add(lp);
  const le = calcomania('espalda', 0.34); le.position.set(0, 0.76, -0.1715); le.rotation.y = Math.PI; P.uniforme.add(le);

  // sudadera: capucha y bolsillo
  P.sudadera = grupo(g);
  const capucha = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.06, 14, 40), tela);
  capucha.rotation.x = Math.PI / 2.6; capucha.position.set(0, 0.98, -0.07); P.sudadera.add(capucha);
  const bolsillo = caja(0.3, 0.12, 0.02, 0.01, tela); bolsillo.position.set(0, 0.58, 0.171); P.sudadera.add(bolsillo);
  for (const s of [-1, 1]) { const cordon = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 8), blanco); cordon.position.set(s * 0.05, 0.89, 0.175); P.sudadera.add(cordon); }

  // traje: camisa blanca, corbata y solapas
  P.elegante = grupo(g);
  const camisa = new THREE.Mesh(new THREE.CircleGeometry(0.13, 3), blanco);
  camisa.position.set(0, 0.88, 0.172); camisa.rotation.z = -Math.PI / 2; camisa.scale.set(1, 0.8, 1); P.elegante.add(camisa);
  const nudo = caja(0.045, 0.04, 0.02, 0.01, acento); nudo.position.set(0, 0.93, 0.18); P.elegante.add(nudo);
  const corbata = caja(0.05, 0.22, 0.015, 0.012, acento); corbata.position.set(0, 0.8, 0.178); P.elegante.add(corbata);

  // brazos
  const hombro = (s) => new THREE.Vector3(s * 0.29, 0.9, 0);
  const codo = (s) => new THREE.Vector3(s * 0.33, 0.68, 0.12);
  const mano = (s) => new THREE.Vector3(s * 0.15, 0.66, 0.3);
  for (const s of [-1, 1]) {
    const finManga = new THREE.Vector3().lerpVectors(hombro(s), codo(s), 0.62);
    g.add(tramo(hombro(s), finManga, 0.085, tela));
    const puno = new THREE.Mesh(new THREE.TorusGeometry(0.083, 0.012, 8, 28), turquesa);
    puno.position.copy(finManga);
    puno.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3().subVectors(codo(s), hombro(s)).normalize());
    P.uniforme.add(puno);
    const fm = calcomania('manga', 0.07);
    const mid = new THREE.Vector3().lerpVectors(hombro(s), finManga, 0.45);
    fm.position.set(mid.x + s * 0.086, mid.y, mid.z); fm.rotation.y = s * Math.PI / 2; fm.rotation.z = s * -0.18;
    P.uniforme.add(fm);
    g.add(tramo(finManga, codo(s), 0.06, piel));
    g.add(tramo(codo(s), mano(s), 0.058, piel));
    const m = bola(0.075, piel, 1, 1, 0.9); m.position.copy(mano(s)); g.add(m);
  }

  // objetos en las manos
  P.camara = grupo(g);
  P.camara.position.set(0, 0.69, 0.33);
  P.camara.add(caja(0.26, 0.16, 0.11, 0.025, negroBrillo));
  const visor = caja(0.09, 0.05, 0.08, 0.015, negroBrillo); visor.position.set(-0.02, 0.1, 0); P.camara.add(visor);
  const objetivo = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.065, 0.09, 40), negroBrillo);
  objetivo.rotation.x = Math.PI / 2; objetivo.position.z = 0.09; P.camara.add(objetivo);
  const anillo = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.01, 8, 40), turquesa); anillo.position.z = 0.135; P.camara.add(anillo);
  const cristal = new THREE.Mesh(new THREE.CircleGeometry(0.05, 40), mat(0x0a3d4a, 0.05, { metalness: 0.6, emissive: 0x00303a }));
  cristal.position.z = 0.136; P.camara.add(cristal);
  const flash = bola(0.012, mat(0xffffff, 0.2, { emissive: 0x666666 })); flash.position.set(0.09, 0.05, 0.056); P.camara.add(flash);

  P.ramo = grupo(g);
  P.ramo.position.set(0, 0.66, 0.33);
  const papel = new THREE.Mesh(new THREE.ConeGeometry(0.1, 0.3, 24, 1, true), mat(0xfff4f8, 0.7, { side: THREE.DoubleSide }));
  papel.rotation.x = Math.PI; papel.position.y = -0.02; P.ramo.add(papel);
  const flores = [0xff5d8f, 0xffd166, 0xffffff, 0xff8fc4, 0xc77dff, 0xff5d8f, 0xffffff];
  flores.forEach((c, i) => { const a = (i / flores.length) * Math.PI * 2; const f = bola(0.045, mat(c, 0.6)); f.position.set(Math.cos(a) * 0.07, 0.15 + (i % 2) * 0.03, Math.sin(a) * 0.05); P.ramo.add(f); });
  const centro = bola(0.05, mat(0xff3d6e, 0.6)); centro.position.y = 0.19; P.ramo.add(centro);
  for (let i = 0; i < 4; i++) { const h = bola(0.035, mat(0x3a9d4f, 0.7), 1.6, 0.5, 1); h.position.set((i - 1.5) * 0.06, 0.1, 0.06); h.rotation.z = (i - 1.5) * 0.4; P.ramo.add(h); }

  P.movil = grupo(g);
  P.movil.position.set(0, 0.7, 0.32); P.movil.rotation.x = -0.35;
  P.movil.add(caja(0.12, 0.22, 0.02, 0.012, negroBrillo));
  const pantalla = new THREE.Mesh(new THREE.PlaneGeometry(0.1, 0.19), mat(0x00e5ff, 0.2, { emissive: 0x00a5bd, emissiveIntensity: 0.8 }));
  pantalla.position.z = 0.011; P.movil.add(pantalla);

  // cabeza estilo Funko
  const cabeza = new THREE.Group();
  cabeza.position.y = 1.43; g.add(cabeza);
  const cuelloPiel = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.1, 0.12, 24), piel);
  cuelloPiel.position.y = 1.02; g.add(cuelloPiel);
  cabeza.add(caja(0.98, 0.84, 0.84, 0.24, piel));
  for (const s of [-1, 1]) {
    const ojo = bola(0.085, mat(0x050505, 0.15), 1, 1, 0.45); ojo.position.set(s * 0.2, -0.04, 0.41); cabeza.add(ojo);
    const iris = bola(0.068, P.irisMat || (P.irisMat = mat(0x6b3e1f, 0.25)), 1, 1, 0.4); iris.position.set(s * 0.2, -0.04, 0.437); cabeza.add(iris);
    const pupila = bola(0.032, mat(0x020202, 0.1), 1, 1, 0.4); pupila.position.set(s * 0.2, -0.04, 0.452); cabeza.add(pupila);
    (P.iris || (P.iris = [])).push(iris, pupila);
    const brillo = bola(0.02, mat(0xffffff, 0.2, { emissive: 0x444444 })); brillo.position.set(s * 0.2 + 0.03, -0.0, 0.462); cabeza.add(brillo);
    const ceja = caja(0.15, 0.03, 0.03, 0.012, pelo); ceja.position.set(s * 0.2, 0.1, 0.415); ceja.rotation.z = s * -0.08; cabeza.add(ceja);
    const oreja = bola(0.07, piel, 0.6, 1, 0.9); oreja.position.set(s * 0.49, -0.04, 0); cabeza.add(oreja);
    const mejilla = bola(0.06, mat(0xf0a0a0, 0.7, { transparent: true, opacity: 0.35 }), 1, 0.6, 0.3); mejilla.position.set(s * 0.3, -0.16, 0.405); cabeza.add(mejilla);
  }
  P.nariz = bola(0.035, mat(0xe6b08c, 0.6), 1, 0.8, 0.7); P.nariz.position.set(0, -0.13, 0.42); cabeza.add(P.nariz);

  // peinados
  const pz = (w, h, d, r, x, y, z, padre, rz = 0) => { const m = caja(w, h, d, r, pelo); m.position.set(x, y, z); m.rotation.z = rz; padre.add(m); return m; };
  P.base = grupo(cabeza);
  pz(1.03, 0.34, 0.9, 0.16, 0, 0.3, -0.01, P.base);
  pz(1.03, 0.62, 0.36, 0.15, 0, 0.06, -0.28, P.base);
  pz(0.98, 0.16, 0.22, 0.07, -0.04, 0.24, 0.34, P.base, 0.05);
  P.mechon = pz(0.36, 0.2, 0.2, 0.08, 0.3, 0.2, 0.36, cabeza, -0.35);
  P.melena = grupo(cabeza);
  for (const s of [-1, 1]) pz(0.16, 0.86, 0.66, 0.07, s * 0.5, -0.12, -0.06, P.melena);
  pz(1.06, 0.95, 0.24, 0.1, 0, -0.12, -0.36, P.melena);
  P.coleta = grupo(cabeza);
  const lazo = new THREE.Mesh(new THREE.TorusGeometry(0.07, 0.025, 10, 28), turquesa); lazo.position.set(0, 0.22, -0.48); P.coleta.add(lazo);
  const cola = bola(0.15, pelo, 0.9, 1.6, 0.9); cola.position.set(0, -0.02, -0.55); P.coleta.add(cola);
  P.mono = grupo(cabeza);
  const mono = bola(0.2, pelo, 1, 0.85, 1); mono.position.set(0, 0.55, -0.12); P.mono.add(mono);
  const lazoMono = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.022, 10, 32), turquesa); lazoMono.rotation.x = Math.PI / 2; lazoMono.position.set(0, 0.47, -0.12); P.mono.add(lazoMono);
  P.afro = grupo(cabeza);
  for (let i = 0; i < 46; i++) {
    const a = i * 2.39996, y = 1 - (i / 45) * 1.15; const r = Math.sqrt(Math.max(0, 1 - y * y));
    const px = Math.cos(a) * r, pzz = Math.sin(a) * r;
    if (pzz > 0.55 && y < 0.55) continue; // deja la cara libre
    const b = bola(0.17, pelo); b.position.set(px * 0.56, 0.12 + y * 0.42, pzz * 0.5 - 0.04); P.afro.add(b);
  }
  P.rapado = grupo(cabeza);
  pz(1.0, 0.22, 0.87, 0.11, 0, 0.33, -0.01, P.rapado);
  pz(1.0, 0.5, 0.12, 0.05, 0, 0.1, -0.385, P.rapado);

  // barba, bigote y perilla
  P.barba = grupo(cabeza);
  const barba = caja(0.9, 0.3, 0.26, 0.12, pelo); barba.position.set(0, -0.3, 0.3); P.barba.add(barba);
  for (const s of [-1, 1]) pz(0.12, 0.34, 0.3, 0.05, s * 0.44, -0.12, 0.2, P.barba);
  P.bigote = grupo(cabeza);
  for (const s of [-1, 1]) pz(0.16, 0.05, 0.05, 0.02, s * 0.075, -0.2, 0.43, P.bigote, s * -0.2);
  P.perilla = grupo(cabeza);
  pz(0.16, 0.14, 0.08, 0.04, 0, -0.33, 0.41, P.perilla);

  // gafas
  P.gafas = grupo(cabeza);
  const montura = mat(0x111111, 0.3);
  for (const s of [-1, 1]) {
    const aroG = new THREE.Mesh(new THREE.TorusGeometry(0.12, 0.016, 10, 36), montura); aroG.position.set(s * 0.2, -0.04, 0.46); P.gafas.add(aroG);
    const patilla = new THREE.Mesh(new THREE.BoxGeometry(0.02, 0.02, 0.44), montura); patilla.position.set(s * 0.32, 0, 0.24); P.gafas.add(patilla);
  }
  const puente = new THREE.Mesh(new THREE.BoxGeometry(0.1, 0.018, 0.018), montura); puente.position.set(0, -0.0, 0.46); P.gafas.add(puente);
  P.cristales = grupo(P.gafas);
  for (const s of [-1, 1]) { const c = new THREE.Mesh(new THREE.CircleGeometry(0.115, 32), mat(0x0b1d26, 0.05, { metalness: 0.5, transparent: true, opacity: 0.92 })); c.position.set(s * 0.2, -0.04, 0.462); P.cristales.add(c); }

  // gorra de Fotarto y auriculares
  P.gorra = grupo(cabeza);
  const copa = caja(1.07, 0.32, 0.93, 0.15, turquesa); copa.position.set(0, 0.4, -0.01); P.gorra.add(copa);
  const visera = caja(0.62, 0.04, 0.34, 0.02, turquesa); visera.position.set(0, 0.27, 0.56); P.gorra.add(visera);
  const fGorra = calcomania('manga', 0.16); fGorra.material = fGorra.material.clone(); fGorra.material.color = new THREE.Color(0x0b0c10);
  fGorra.position.set(0, 0.42, 0.457); P.gorra.add(fGorra);
  P.auriculares = grupo(cabeza);
  const diadema = new THREE.Mesh(new THREE.TorusGeometry(0.56, 0.035, 12, 60, Math.PI), negroBrillo); diadema.position.y = 0.0; diadema.scale.set(1, 1.05, 1); P.auriculares.add(diadema);
  for (const s of [-1, 1]) {
    const cup = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.13, 0.09, 32), negroBrillo); cup.rotation.z = Math.PI / 2; cup.position.set(s * 0.54, -0.03, 0); P.auriculares.add(cup);
    const luz = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.012, 8, 32), turquesa); luz.rotation.y = Math.PI / 2; luz.position.set(s * 0.59, -0.03, 0); P.auriculares.add(luz);
  }

  // más tocados: sombrero, gorro de lana y diadema
  const fieltro = mat(0x2b2b30, 0.7);
  P.sombrero = grupo(cabeza);
  const ala = new THREE.Mesh(new THREE.CylinderGeometry(0.64, 0.66, 0.035, 48), fieltro); ala.position.y = 0.45; ala.scale.set(1, 1, 0.92); P.sombrero.add(ala);
  const copaS = new THREE.Mesh(new THREE.CylinderGeometry(0.38, 0.45, 0.26, 40), fieltro); copaS.position.y = 0.59; copaS.scale.set(1, 1, 0.88); P.sombrero.add(copaS);
  const cinta = new THREE.Mesh(new THREE.CylinderGeometry(0.452, 0.452, 0.06, 40, 1, true), turquesa); cinta.position.y = 0.5; cinta.scale.set(1, 1, 0.88); P.sombrero.add(cinta);
  const lanaMat = mat(0x00a5bd, 0.95);
  P.lana = grupo(cabeza);
  const cupula = caja(1.06, 0.34, 0.92, 0.17, lanaMat); cupula.position.y = 0.43; P.lana.add(cupula);
  const vuelta = caja(1.1, 0.15, 0.96, 0.07, mat(0x008a9e, 0.95)); vuelta.position.y = 0.27; P.lana.add(vuelta);
  for (let i = -4; i <= 4; i++) { const canale = new THREE.Mesh(new THREE.BoxGeometry(0.035, 0.13, 0.01), mat(0x007788, 1)); canale.position.set(i * 0.11, 0.27, 0.485); P.lana.add(canale); }
  const pompon = bola(0.14, mat(0xf4f4f4, 1)); pompon.position.y = 0.66; P.lana.add(pompon);
  P.diadema = grupo(cabeza);
  const aroD = new THREE.Mesh(new THREE.TorusGeometry(0.57, 0.04, 12, 60, Math.PI), turquesa); aroD.position.set(0, -0.07, 0.16); P.diadema.add(aroD);
  const lazoD = bola(0.07, turquesa, 1.6, 0.8, 0.6); lazoD.position.set(0.33, 0.42, 0.2); lazoD.rotation.z = -0.6; P.diadema.add(lazoD);

  // accesorios (se pueden combinar)
  const oro = mat(0xd9b25f, 0.25, { metalness: 0.8 });
  P.acc = {};
  P.acc.pendientes = grupo(cabeza);
  for (const s of [-1, 1]) { const a1 = bola(0.022, oro); a1.position.set(s * 0.49, -0.15, 0.03); const a2 = bola(0.03, oro); a2.position.set(s * 0.49, -0.21, 0.03); P.acc.pendientes.add(a1, a2); }
  P.acc.collar = grupo(g);
  const cadena = new THREE.Mesh(new THREE.TorusGeometry(0.135, 0.01, 8, 48), oro); cadena.rotation.x = Math.PI / 2 - 0.35; cadena.position.set(0, 0.96, 0.02); P.acc.collar.add(cadena);
  const colgante = bola(0.028, mat(0x00e5ff, 0.2, { metalness: 0.4 })); colgante.position.set(0, 0.88, 0.175); P.acc.collar.add(colgante);
  P.acc.bufanda = grupo(g);
  const lanaRoja = mat(0xc0392b, 0.95);
  const vueltaB = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.06, 14, 40), lanaRoja); vueltaB.rotation.x = Math.PI / 2; vueltaB.scale.set(1.05, 0.85, 1); vueltaB.position.y = 0.99; P.acc.bufanda.add(vueltaB);
  const caida = caja(0.1, 0.32, 0.04, 0.02, lanaRoja); caida.position.set(0.1, 0.82, 0.19); caida.rotation.z = 0.08; P.acc.bufanda.add(caida);
  P.acc.pajarita = grupo(g);
  const negroP = mat(0xc0392b, 0.45);
  for (const s of [-1, 1]) { const ala2 = new THREE.Mesh(new THREE.ConeGeometry(0.04, 0.08, 4), negroP); ala2.rotation.z = s * Math.PI / 2; ala2.scale.setScalar(1.3); ala2.position.set(s * 0.058, 0.9, 0.19); P.acc.pajarita.add(ala2); }
  const nudoP = bola(0.018, negroP); nudoP.scale.setScalar(1.3); nudoP.position.set(0, 0.9, 0.195); P.acc.pajarita.add(nudoP);
  P.acc.reloj = grupo(g);
  const muneca = new THREE.Vector3().lerpVectors(codo(-1), mano(-1), 0.72);
  const correa = new THREE.Mesh(new THREE.TorusGeometry(0.062, 0.016, 8, 28), negroBrillo);
  correa.position.copy(muneca); correa.quaternion.setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3().subVectors(mano(-1), codo(-1)).normalize());
  P.acc.reloj.add(correa);
  const esfera = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.015, 24), mat(0x00e5ff, 0.2, { emissive: 0x007a88 }));
  esfera.position.copy(muneca).add(new THREE.Vector3(-0.045, 0.03, 0)); esfera.rotation.z = Math.PI / 2.4; P.acc.reloj.add(esfera);
  P.acc.pecas = grupo(cabeza);
  const marron = mat(0x9a5a3a, 0.8);
  [[-0.32, -0.1], [-0.27, -0.14], [-0.35, -0.16], [-0.25, -0.09], [-0.3, -0.19]].forEach(([x, y]) => { for (const s of [-1, 1]) { const pc = bola(0.011, marron, 1, 1, 0.4); pc.position.set(s * -x * -1 * s * s, y, 0.421); pc.position.x = s * Math.abs(x); P.acc.pecas.add(pc); } });
  P.acc.mochila = grupo(g);
  const mochilaMat = mat(0x1a4a55, 0.8);
  const saco = caja(0.42, 0.46, 0.18, 0.08, mochilaMat); saco.position.set(0, 0.74, -0.26); P.acc.mochila.add(saco);
  const bolsilloM = caja(0.28, 0.16, 0.05, 0.04, mochilaMat); bolsilloM.position.set(0, 0.63, -0.36); P.acc.mochila.add(bolsilloM);
  for (const s of [-1, 1]) { const tira = caja(0.05, 0.42, 0.025, 0.01, mochilaMat); tira.position.set(s * 0.15, 0.76, 0.178); P.acc.mochila.add(tira); const hombrera = caja(0.06, 0.03, 0.36, 0.012, mochilaMat); hombrera.position.set(s * 0.15, 0.97, -0.02); P.acc.mochila.add(hombrera); }

  g.userData.partes = P;
  return g;
}

function aplicarOpciones(funko, o) {
  const P = funko.userData.partes;
  const tono = new THREE.Color(colorDe(OPCIONES_FUNKO.piel, o.piel));
  P.piel.color.copy(tono);
  P.nariz.material.color.copy(tono).multiplyScalar(0.92);
  P.pelo.color.set(colorDe(OPCIONES_FUNKO.pelo, o.pelo));
  const pe = o.peinado || 'corto';
  P.base.visible = ['corto', 'largo', 'coleta', 'mono'].includes(pe);
  P.mechon.visible = ['corto', 'largo'].includes(pe);
  P.melena.visible = pe === 'largo';
  P.coleta.visible = pe === 'coleta';
  P.mono.visible = pe === 'mono';
  P.afro.visible = pe === 'afro';
  P.rapado.visible = pe === 'rapado';
  P.barba.visible = o.barba === 'barba';
  P.bigote.visible = o.barba === 'bigote' || o.barba === 'barba';
  P.perilla.visible = o.barba === 'perilla';
  P.gafas.visible = o.gafas === 'vista' || o.gafas === 'sol';
  P.cristales.visible = o.gafas === 'sol';
  P.gorra.visible = o.gorro === 'gorra';
  P.auriculares.visible = o.gorro === 'auriculares';
  P.sombrero.visible = o.gorro === 'sombrero';
  P.lana.visible = o.gorro === 'lana';
  P.diadema.visible = o.gorro === 'diadema';
  if (['gorra', 'sombrero', 'lana'].includes(o.gorro)) { P.mechon.visible = false; P.mono.visible = false; P.afro.visible = false; }
  const ojos = o.ojos || 'clasico';
  P.iris.forEach((m) => { m.visible = ojos !== 'clasico'; });
  P.irisMat.color.set(colorDe(OPCIONES_FUNKO.ojos, ojos));
  const acc = o.accesorios || [];
  Object.entries(P.acc).forEach(([k, grp]) => { grp.visible = acc.includes(k); });
  const ropa = o.ropa || 'uniforme';
  P.uniforme.visible = ropa === 'uniforme';
  P.sudadera.visible = ropa === 'sudadera';
  P.elegante.visible = ropa === 'elegante';
  P.falda.visible = ropa === 'vestido';
  const colorRopa = colorDe(OPCIONES_FUNKO.ropaColor, o.ropaColor || 'negro');
  if (ropa === 'uniforme') P.tela.color.set('#141519');
  else if (ropa === 'elegante') { P.tela.color.set('#1D2433'); P.acento.color.set(colorRopa); }
  else P.tela.color.set(colorRopa);
  P.camara.visible = o.objeto === 'camara';
  P.ramo.visible = o.objeto === 'ramo';
  P.movil.visible = o.objeto === 'movil';
  P.texNombre.userData.dibujar(o.nombre || '');
}

export default function Funko3D({ opciones = FUNKO_INICIAL, etiqueta = 'Ejemplo · Tu Funko en 3D' }) {
  const funkoRef = useRef(null);
  const ref = useRef(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const canvas = ref.current;
    let renderer;
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: true, preserveDrawingBuffer: true });
    } catch (e) { setError(true); return undefined; }
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap;

    const scene = new THREE.Scene();
    const camara = new THREE.PerspectiveCamera(28, 0.8, 0.1, 50);
    camara.position.set(0, 1.25, 5.0);
    camara.lookAt(0, 1.0, 0);

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
    funkoRef.current = funko;
    aplicarOpciones(funko, opciones);
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

  useEffect(() => { if (funkoRef.current) aplicarOpciones(funkoRef.current, opciones); }, [opciones]);

  return (
    <div className="relative rounded-2xl overflow-hidden border-2 border-[#00E5FF] glow-box" style={{ background: 'radial-gradient(circle at 50% 40%, #16323a 0%, #0B0C10 70%)' }}>
      <canvas ref={ref} data-funko className="block w-full aspect-[4/5] cursor-grab active:cursor-grabbing touch-pan-y" aria-label="Funko personalizable en 3D: arrástralo para girarlo" />
      {error && <p className="absolute inset-0 flex items-center justify-center text-[#8D93AB] text-sm p-6 text-center">Tu navegador no admite gráficos 3D (WebGL).</p>}
      <span className="absolute top-3 left-3 px-2 py-1 rounded bg-black/60 text-xs font-bold text-[#00E5FF]">{etiqueta}</span>
      <span className="absolute bottom-3 left-1/2 -translate-x-1/2 px-3 py-1 rounded-full bg-black/60 text-xs text-[#C9CDD8] flex items-center gap-1.5"><Hand className="w-3.5 h-3.5" /> Arrastra para girarlo</span>
    </div>
  );
}
