import * as THREE from 'three';

// Texturas del logotipo de Fotarto dibujadas en un lienzo, para «bordarlas» en la ropa 3D.
// tipo: 'pecho' (cámara + FOTARTO), 'espalda' (igual, más grande) o 'manga' (círculo con la f)
const TURQUESA = '#1EC8E6';
const PLATA = '#C9CED6';

function camara(ctx, cx, cy, w) {
  const h = w * 0.62;
  ctx.lineWidth = w * 0.07;
  ctx.lineJoin = 'round';
  ctx.strokeStyle = TURQUESA;
  // cuerpo y visor
  ctx.beginPath();
  ctx.moveTo(cx - w / 2, cy - h / 2 + h * 0.08);
  ctx.lineTo(cx - w * 0.18, cy - h / 2 + h * 0.08);
  ctx.lineTo(cx - w * 0.1, cy - h / 2 - h * 0.12);
  ctx.lineTo(cx + w * 0.1, cy - h / 2 - h * 0.12);
  ctx.lineTo(cx + w * 0.18, cy - h / 2 + h * 0.08);
  ctx.lineTo(cx + w / 2, cy - h / 2 + h * 0.08);
  ctx.lineTo(cx + w / 2, cy + h / 2);
  ctx.lineTo(cx - w / 2, cy + h / 2);
  ctx.closePath();
  ctx.stroke();
  // objetivo con diafragma
  const r = h * 0.36;
  ctx.strokeStyle = PLATA;
  ctx.beginPath(); ctx.arc(cx, cy + h * 0.06, r, 0, Math.PI * 2); ctx.stroke();
  ctx.fillStyle = TURQUESA;
  ctx.beginPath(); ctx.arc(cx, cy + h * 0.06, r * 0.72, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#0B0C10';
  ctx.lineWidth = w * 0.025;
  for (let i = 0; i < 6; i++) {
    const a = (i * Math.PI) / 3;
    ctx.beginPath();
    ctx.moveTo(cx + Math.cos(a) * r * 0.2, cy + h * 0.06 + Math.sin(a) * r * 0.2);
    ctx.lineTo(cx + Math.cos(a + 0.9) * r * 0.72, cy + h * 0.06 + Math.sin(a + 0.9) * r * 0.72);
    ctx.stroke();
  }
}

export function texturaLogo(tipo = 'pecho') {
  const c = document.createElement('canvas');
  const ctx = c.getContext('2d');
  if (tipo === 'manga') {
    c.width = c.height = 256;
    ctx.strokeStyle = TURQUESA;
    ctx.lineWidth = 14;
    ctx.beginPath(); ctx.arc(128, 128, 104, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = TURQUESA;
    ctx.font = 'italic 700 150px Georgia, "Times New Roman", serif';
    ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.fillText('f', 128, 136);
  } else {
    c.width = 512; c.height = 320;
    camara(ctx, 256, 100, 190);
    ctx.font = '700 96px "Montserrat", Arial, sans-serif';
    ctx.textBaseline = 'alphabetic';
    const t1 = 'FOT', t2 = 'ARTO';
    const w1 = ctx.measureText(t1).width, w2 = ctx.measureText(t2).width;
    const x0 = 256 - (w1 + w2) / 2;
    ctx.fillStyle = TURQUESA; ctx.fillText(t1, x0, 285);
    ctx.fillStyle = PLATA; ctx.fillText(t2, x0 + w1, 285);
  }
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = 4;
  return tex;
}

// Calcomanía plana con el logotipo (ligeramente separada de la tela para que no parpadee)
export function calcomania(tipo, ancho) {
  const tex = texturaLogo(tipo);
  const alto = tipo === 'manga' ? ancho : ancho * (320 / 512);
  const mat = new THREE.MeshStandardMaterial({
    map: tex, transparent: true, roughness: 0.7, depthWrite: false,
    polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4,
  });
  const m = new THREE.Mesh(new THREE.PlaneGeometry(ancho, alto), mat);
  m.receiveShadow = true;
  return m;
}
