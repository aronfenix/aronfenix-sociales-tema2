/* Biblioteca de iconos y personajes SVG (planos, redondeados, paleta del SPEC).
 * Cada icono se dibuja centrado en (0,0) dentro de una caja de ~100×100 unidades (de -50 a 50).
 * Uso:  const ic = M.icono('urna', E.g, { ...opciones });  M.pon(ic, { x: 640, y: 300, s: 2 });
 * Lista: M.listaIconos()  ·  Añadir uno propio: M.registrarIcono('nombre', (o) => '<marcado SVG>')
 */
(function () {
  'use strict';
  const M = window.M;
  const C = M.C;
  const K = C.tinta;
  const S = (w = 3.5, c = K) => `stroke="${c}" stroke-width="${w}" stroke-linejoin="round" stroke-linecap="round"`;
  const I = {};
  M.iconos = I;
  M.registrarIcono = (n, fn) => { I[n] = fn; };
  M.listaIconos = () => Object.keys(I).sort();
  /** Crea el icono `nombre` dentro de `padre`. Devuelve <g> (colócalo con M.pon). */
  M.icono = (nombre, padre, o = {}) => {
    const fn = I[nombre];
    const g = M.g(padre, { class: 'icono icono-' + nombre });
    if (!fn) { M.avisa('Icono desconocido: ' + nombre); g.innerHTML = `<circle r="40" fill="${C.error}"/>`; return g; }
    g.innerHTML = fn(o);
    if (fn.alCrear) fn.alCrear(g, o);
    return g;
  };
  const esc = (s) => String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;');
  const txt = (s, x, y, tam, color = K, peso = 900, extra = '') => `<text x="${x}" y="${y}" font-size="${tam}" font-weight="${peso}" fill="${color}" text-anchor="middle" dominant-baseline="central" font-family="Nunito" ${extra}>${esc(s)}</text>`;
  // Contorno de la unión de varias formas: primero trazos gruesos, después rellenos encima.
  const union = (formas, fill, sw = 3.5) => formas.map((f) => f.replace('/>', ` fill="${K}" stroke="${K}" stroke-width="${sw * 2}" stroke-linejoin="round"/>`)).join('') + formas.map((f) => f.replace('/>', ` fill="${fill}"/>`)).join('');
  const estrella = (cx, cy, r, fill = C.estrella, extra = '') => { let d = ''; for (let i = 0; i < 10; i++) { const a = -Math.PI / 2 + (i * Math.PI) / 5; const rr = i % 2 ? r * 0.45 : r; d += (i ? 'L' : 'M') + (cx + rr * Math.cos(a)).toFixed(1) + ',' + (cy + rr * Math.sin(a)).toFixed(1); } return `<path d="${d}Z" fill="${fill}" ${extra}/>`; };
  M.estrellaPath = estrella;

  // ───────── Naturaleza y barrio ─────────
  I.arbol = (o) => `<rect x="-7" y="4" width="14" height="44" rx="5" fill="${C.tronco}" ${S()}/>` +
    union(['<circle cx="0" cy="-16" r="30"/>', '<circle cx="-22" cy="2" r="20"/>', '<circle cx="22" cy="2" r="20"/>', '<circle cx="0" cy="8" r="18"/>'], o.color || C.verde) +
    `<circle cx="-10" cy="-26" r="8" fill="#fff" opacity=".25"/>`;
  I.coche = (o) => { const c = o.color || '#7DA0CA'; return `<path d="M-26,-4 L-18,-26 Q-16,-30 -11,-30 L14,-30 Q19,-30 21,-26 L29,-4Z" fill="${c}" ${S()}/>` +
    `<path d="M-17,-6 L-12,-24 L-1,-24 L-1,-6Z M4,-6 L4,-24 L14,-24 L22,-6Z" fill="#E8F3F8" ${S(3)}/>` +
    `<rect x="-46" y="-6" width="92" height="30" rx="11" fill="${c}" ${S()}/>` +
    `<rect x="36" y="2" width="8" height="6" rx="2" fill="#FFE8A3"/><rect x="-44" y="2" width="6" height="6" rx="2" fill="#F28F8F"/>` +
    [-25, 25].map((x) => `<circle cx="${x}" cy="24" r="12" fill="${K}"/><circle cx="${x}" cy="24" r="5" fill="${C.grisClaro}"/>`).join(''); };
  I.canasta = (o) => `<rect x="-4" y="-10" width="8" height="60" rx="3" fill="${C.gris}" ${S(3)}/>` +
    `<rect x="-36" y="-50" width="72" height="44" rx="5" fill="#fff" ${S()}/><rect x="-13" y="-36" width="26" height="20" rx="2" fill="none" ${S(3, '#E76F51')}/>` +
    `<path d="M-19,-6 L-13,20 M-6,-6 L-5,20 M6,-6 L5,20 M19,-6 L13,20 M-15,6 L15,6" ${S(2.5, '#9AA3B5')} fill="none"/>` +
    `<ellipse cx="0" cy="-6" rx="21" ry="6" fill="none" ${S(5, '#E76F51')}/>` +
    (o.balon === false ? '' : `<circle cx="27" cy="30" r="13" fill="#F2A65A" ${S(3)}/><path d="M14,30 L40,30 M27,17 Q20,30 27,43 M27,17 Q34,30 27,43" fill="none" ${S(2)}/>`);
  I.nube = (o) => union(['<circle cx="-18" cy="6" r="18"/>', '<circle cx="4" cy="-6" r="24"/>', '<circle cx="26" cy="8" r="16"/>', '<rect x="-34" y="4" width="74" height="20" rx="10"/>'], o.color || '#fff', o.trazo === false ? 0 : 2.5);
  I.sol = () => `<g ${S(5, '#F2B63D')}>` + Array.from({ length: 10 }, (_, i) => { const a = (i * Math.PI) / 5; return `<path d="M${(32 * Math.cos(a)).toFixed(1)},${(32 * Math.sin(a)).toFixed(1)} L${(44 * Math.cos(a)).toFixed(1)},${(44 * Math.sin(a)).toFixed(1)}"/>`; }).join('') + `</g><circle r="24" fill="${C.estrella}" ${S(3, '#E2A72E')}/>`;
  I.casa = (o) => { const c = o.color || '#F2D6B3'; return `<rect x="-36" y="-8" width="72" height="56" rx="4" fill="${c}" ${S()}/><path d="M-46,-4 L0,-46 L46,-4Z" fill="${o.tejado || '#C47A6A'}" ${S()}/>` +
    `<rect x="-10" y="18" width="20" height="30" rx="3" fill="${C.tronco}" ${S(3)}/><rect x="-28" y="6" width="14" height="14" rx="2" fill="#E8F3F8" ${S(3)}/><rect x="14" y="6" width="14" height="14" rx="2" fill="#E8F3F8" ${S(3)}/>`; };
  I.bloque = (o) => { const c = o.color || '#E9DCC8', w = o.ancho || 70, h = o.alto || 96, filas = Math.max(1, Math.floor((h - 26) / 22)), cols = Math.max(1, Math.floor((w - 10) / 22));
    let v = ''; for (let f = 0; f < filas; f++) for (let k = 0; k < cols; k++) v += `<rect x="${-w / 2 + 9 + k * ((w - 18) / cols) + ((w - 18) / cols - 12) / 2}" y="${50 - h + 12 + f * 22}" width="12" height="13" rx="2" fill="${(f * 7 + k * 3) % 5 === 0 ? '#FFE8A3' : '#E8F3F8'}" ${S(2)}/>`;
    return `<rect x="${-w / 2}" y="${50 - h}" width="${w}" height="${h}" rx="5" fill="${c}" ${S()}/>${v}`; };
  I.farola = (o) => (o.encendida ? `<circle cx="0" cy="-34" r="26" fill="#FFE8A3" opacity=".75"/>` : '') +
    `<rect x="-4" y="-30" width="8" height="78" rx="3" fill="${C.grisOsc}" ${S(3)}/><rect x="-14" y="44" width="28" height="7" rx="3" fill="${C.grisOsc}" ${S(3)}/>` +
    `<path d="M-14,-30 L14,-30 L9,-44 L-9,-44Z" fill="${o.encendida ? C.estrella : C.grisClaro}" ${S(3)}/><path d="M-12,-44 L0,-52 L12,-44Z" fill="${C.grisOsc}" ${S(3)}/>`;

  // ───────── Votar ─────────
  I.urna = (o) => { const n = o.papeletas || 0; let p = ''; const r = M.azar(7); for (let i = 0; i < n; i++) p += `<rect x="${-28 + r() * 40}" y="${20 + r() * 18 - i * 0.6}" width="18" height="12" rx="2" fill="#fff" transform="rotate(${(r() - 0.5) * 60} ${-19 + r() * 40} ${30})" ${S(1.5, C.gris)}/>`;
    return `<rect x="-40" y="-20" width="80" height="68" rx="7" fill="#E6F1F6" fill-opacity=".55" ${S()}/>` + p +
      `<path d="M-30,-12 L-30,36" stroke="#fff" stroke-width="5" stroke-linecap="round" opacity=".8"/>` +
      `<rect x="-45" y="-32" width="90" height="14" rx="5" fill="${o.tapa || C.grisClaro}" ${S()}/><rect x="-20" y="-28" width="40" height="6" rx="3" fill="${K}"/>`; };
  I.papeleta = (o) => `<rect x="-26" y="-34" width="52" height="68" rx="4" fill="${o.color || '#fff'}" ${S(3)}/>` +
    (o.icono ? '' : `<path d="M-14,-20 L14,-20 M-14,-8 L14,-8 M-14,4 L6,4" ${S(3, C.gris)}/>`) +
    (o.marca === false ? '' : `<rect x="-14" y="12" width="14" height="14" rx="2" fill="#fff" ${S(2.5)}/><path d="M-12,18 L-8,23 L2,10" fill="none" ${S(3.5, C.ok)}/>`);
  I.sobre = (o) => `<rect x="-42" y="-27" width="84" height="54" rx="5" fill="${o.color || '#F4EBD9'}" ${S()}/><path d="M-40,-24 L0,6 L40,-24" fill="none" ${S(3)}/>`;
  I.dni = (o) => `<rect x="-46" y="-30" width="92" height="60" rx="8" fill="${o.color || '#DCE7F3'}" ${S()}/><rect x="-46" y="-30" width="92" height="13" rx="6" fill="${o.banda || '#8CA9CF'}"/><rect x="-46" y="-30" width="92" height="60" rx="8" fill="none" ${S()}/>` +
    `<rect x="-38" y="-10" width="28" height="34" rx="4" fill="#fff" ${S(2.5)}/><circle cx="-24" cy="1" r="7" fill="${C.gris}"/><path d="M-35,22 Q-24,8 -13,22Z" fill="${C.gris}"/>` +
    `<path d="M-2,-4 L36,-4 M-2,6 L30,6 M-2,16 L36,16" ${S(3.5, '#9AA9C0')}/>` + (o.texto ? txt(o.texto, 0, -23, 9, '#fff') : '');
  I.pasaporte = (o) => `<rect x="-32" y="-44" width="64" height="88" rx="7" fill="${o.color || '#7A2E3A'}" ${S()}/><circle cx="0" cy="-6" r="15" fill="none" ${S(3, C.estrella)}/><path d="M-15,-6 L15,-6 M0,-21 Q-9,-6 0,9 M0,-21 Q9,-6 0,9" fill="none" ${S(2, C.estrella)}/>` +
    `<rect x="-16" y="22" width="32" height="5" rx="2" fill="${C.estrella}"/>`;
  I.lista = (o) => { let l = ''; for (let i = 0; i < 6; i++) l += `<circle cx="-24" cy="${-28 + i * 12}" r="2.5" fill="${K}"/><path d="M-16,${-28 + i * 12} L${10 + ((i * 7) % 3) * 6},${-28 + i * 12}" ${S(3, C.gris)}/>`;
    return `<rect x="-36" y="-46" width="72" height="92" rx="6" fill="#fff" ${S()}/>${l}`; };

  // ───────── Poder, instituciones ─────────
  I.corona = (o) => { const c = o.color || C.estrella; return `<path d="M-40,22 L-44,-18 L-22,2 L0,-30 L22,2 L44,-18 L40,22Z" fill="${c}" ${S()}/><rect x="-42" y="18" width="84" height="14" rx="4" fill="${M.oscurece(c, 0.1)}" ${S()}/>` +
    `<circle cx="-44" cy="-20" r="6" fill="${c}" ${S(3)}/><circle cx="0" cy="-32" r="6" fill="${c}" ${S(3)}/><circle cx="44" cy="-20" r="6" fill="${c}" ${S(3)}/>` +
    `<circle cx="-20" cy="25" r="4" fill="#fff"/><circle cx="0" cy="25" r="4" fill="#fff"/><circle cx="20" cy="25" r="4" fill="#fff"/>`; };
  I.trono = (o) => { const c = o.color || '#8E6C8A'; return `<path d="M-30,10 L-30,-30 Q-30,-56 0,-56 Q30,-56 30,-30 L30,10Z" fill="${c}" ${S()}/><path d="M-20,4 L-20,-28 Q-20,-44 0,-44 Q20,-44 20,-28 L20,4Z" fill="${M.aclara(c, 0.25)}"/>` +
    `<rect x="-36" y="6" width="72" height="16" rx="6" fill="${M.aclara(c, 0.15)}" ${S()}/><path d="M-30,22 L-30,50 M30,22 L30,50" ${S(7)}/><path d="M-30,22 L-30,50 M30,22 L30,50" ${S(3, C.estrella)}/>` +
    `<rect x="-42" y="-6" width="10" height="26" rx="4" fill="${C.estrella}" ${S(3)}/><rect x="32" y="-6" width="10" height="26" rx="4" fill="${C.estrella}" ${S(3)}/>`; };
  I.libro = (o) => { const c = o.color || C.estado, w = o.ancho || 76, h = o.alto || 98;
    const tit = (o.titulo || '').split('\n'); const tt = o.tamTitulo || 13;
    return `<rect x="${-w / 2 + 4}" y="${-h / 2 + 4}" width="${w}" height="${h}" rx="6" fill="#fff" ${S()}/>` +
      `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="6" fill="${c}" ${S()}/><rect x="${-w / 2}" y="${-h / 2}" width="11" height="${h}" rx="5" fill="${M.oscurece(c, 0.2)}" ${S()}/>` +
      `<rect x="${-w / 2 + 18}" y="${-h / 2 + 10}" width="${w - 28}" height="${h - 20}" rx="4" fill="none" ${S(2, M.aclara(c, 0.45))}/>` +
      tit.map((l, i) => txt(l, 5, (o.yTitulo || 0) + (i - (tit.length - 1) / 2) * tt * 1.15, tt, '#fff')).join('') +
      (o.subtitulo ? txt(o.subtitulo, 5, h / 2 - 20, o.tamSub || 12, C.estrella) : ''); };
  I.libroAbierto = (o) => `<path d="M0,-28 Q-22,-40 -46,-32 L-46,30 Q-22,22 0,34Z" fill="#fff" ${S()}/><path d="M0,-28 Q22,-40 46,-32 L46,30 Q22,22 0,34Z" fill="#fff" ${S()}/>` +
    `<path d="M-38,-18 Q-22,-24 -8,-16 M-38,-6 Q-22,-12 -8,-4 M-38,6 Q-22,0 -8,8 M8,-16 Q22,-24 38,-18 M8,-4 Q22,-12 38,-6 M8,8 Q22,0 38,6" fill="none" ${S(2.5, o.color || C.gris)}/>`;
  I.libros = () => `<rect x="-44" y="-30" width="18" height="74" rx="3" fill="${C.ccaa}" ${S(3)}/><rect x="-24" y="-40" width="20" height="84" rx="3" fill="${C.estado}" ${S(3)}/><rect x="-2" y="-24" width="16" height="68" rx="3" fill="${C.ayto}" ${S(3)}/>` +
    `<rect x="18" y="-34" width="18" height="78" rx="3" fill="${C.ue}" ${S(3)}/><path d="M-50,46 L50,46" ${S(4)}/>`;
  I.edificio = (o) => { const c = o.color || '#ECE6DA', te = o.tejado || o.acento || c; let col = '';
    for (let i = 0; i < 4; i++) col += `<rect x="${-34 + i * 20}" y="-14" width="10" height="44" rx="2" fill="#fff" ${S(3)}/>`;
    return `<rect x="-46" y="30" width="92" height="10" rx="2" fill="${c}" ${S(3)}/><rect x="-50" y="40" width="100" height="10" rx="2" fill="${c}" ${S(3)}/>` +
      `<rect x="-42" y="-20" width="84" height="52" fill="${c}" ${S(3)}/>${col}<rect x="-46" y="-24" width="92" height="9" rx="2" fill="${te}" ${S(3)}/>` +
      `<path d="M-48,-24 L0,-50 L48,-24Z" fill="${te}" ${S()}/>` + (o.simbolo ? o.simbolo : `<circle cx="0" cy="-34" r="5" fill="#fff" ${S(2)}/>`); };
  I.cupula = (o) => { const c = o.color || '#ECE6DA', a = o.acento || C.estado;
    return `<rect x="-48" y="40" width="96" height="10" rx="2" fill="${c}" ${S(3)}/><rect x="-44" y="-4" width="88" height="46" fill="${c}" ${S(3)}/>` +
      [-30, -10, 10, 30].map((x) => `<rect x="${x - 4}" y="4" width="8" height="34" rx="2" fill="#fff" ${S(2.5)}/>`).join('') +
      `<rect x="-48" y="-10" width="96" height="9" rx="2" fill="${a}" ${S(3)}/><path d="M-26,-10 Q-26,-46 0,-46 Q26,-46 26,-10Z" fill="${a}" ${S()}/><path d="M0,-46 L0,-56" ${S(3)}/><circle cx="0" cy="-58" r="3.5" fill="${K}"/>`; };
  I.ayuntamiento = (o) => { const c = o.color || '#F3E3C0', a = o.acento || C.ayto;
    return `<rect x="-46" y="0" width="92" height="50" rx="3" fill="${c}" ${S()}/><rect x="-16" y="-36" width="32" height="40" fill="${c}" ${S()}/><path d="M-20,-36 L0,-52 L20,-36Z" fill="${a}" ${S()}/>` +
      `<circle cx="0" cy="-18" r="9" fill="#fff" ${S(2.5)}/><path d="M0,-18 L0,-24 M0,-18 L4,-16" ${S(2)}/>` +
      `<path d="M0,-52 L0,-66" ${S(3)}/><path d="M0,-66 L16,-61 L0,-56Z" fill="${a}" ${S(2.5)}/>` +
      [-34, -22, 22, 34].map((x) => `<rect x="${x - 4}" y="12" width="8" height="12" rx="2" fill="#E8F3F8" ${S(2)}/>`).join('') +
      `<rect x="-9" y="26" width="18" height="24" rx="3" fill="${a}" ${S(3)}/><rect x="-46" y="-2" width="92" height="7" rx="2" fill="${a}" ${S(3)}/>`; };
  I.colegio = (o) => { const c = o.color || '#F2D6B3', a = o.acento || '#C47A6A';
    return `<rect x="-48" y="-6" width="96" height="56" rx="3" fill="${c}" ${S()}/><path d="M-22,-6 L0,-34 L22,-6Z" fill="${a}" ${S()}/><circle cx="0" cy="-16" r="7" fill="#fff" ${S(2.5)}/>` +
      [-38, -24, 14, 28].map((x) => `<rect x="${x}" y="6" width="10" height="12" rx="2" fill="#E8F3F8" ${S(2)}/>`).join('') +
      `<rect x="-9" y="22" width="18" height="28" rx="3" fill="${a}" ${S(3)}/><path d="M30,-6 L30,-40" ${S(3)}/><path d="M30,-40 L46,-35 L30,-30Z" fill="${C.ok}" ${S(2.5)}/>`; };
  I.fabrica = (o) => `<path d="M-46,50 L-46,-6 L-24,-22 L-24,-6 L-2,-22 L-2,-6 L20,-22 L20,50Z" fill="${o.color || '#C9C3B6'}" ${S()}/><rect x="22" y="-40" width="16" height="90" rx="2" fill="${C.grisOsc}" ${S()}/>` +
    `<circle cx="34" cy="-50" r="7" fill="${C.grisClaro}"/><circle cx="42" cy="-58" r="5" fill="${C.grisClaro}"/>` + [-38, -20, -2].map((x) => `<rect x="${x}" y="10" width="12" height="12" rx="2" fill="#FFE8A3" ${S(2)}/>`).join('') + `<path d="M-50,50 L50,50" ${S(4)}/>`;
  I.balanza = (o) => { const c = o.color || C.estrella, inc = o.inclina || 0;
    return `<path d="M-20,46 L20,46 L0,34Z" fill="${c}" ${S()}/><rect x="-3" y="-40" width="6" height="78" rx="2" fill="${c}" ${S(3)}/><circle cx="0" cy="-42" r="6" fill="${c}" ${S(3)}/>` +
      `<g transform="rotate(${inc} 0 -34)"><path d="M-40,-34 L40,-34" ${S(5)}/>` +
      [-40, 40].map((x) => `<path d="M${x},-34 L${x - 14},4 M${x},-34 L${x + 14},4" ${S(2.5)}/><path d="M${x - 20},4 L${x + 20},4 Q${x + 16},20 ${x},20 Q${x - 16},20 ${x - 20},4Z" fill="${c}" ${S(3)}/>`).join('') + `</g>`; };
  I.mazo = () => `<rect x="-36" y="-34" width="44" height="22" rx="6" fill="${C.tronco}" ${S()}/><rect x="-4" y="-22" width="8" height="58" rx="3" fill="${M.aclara(C.tronco, 0.2)}" ${S(3)}/><rect x="-30" y="38" width="60" height="10" rx="4" fill="${C.tronco}" ${S(3)}/>`;
  I.banderaUE = (o) => { const w = 90, h = 60; let e = ''; for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; e += estrella(19 * Math.sin(a), -19 * Math.cos(a), 4.6); }
    return (o.mastil ? `<path d="M-45,-30 L-45,50" ${S(4)}/>` : '') + `<rect x="${-w / 2}" y="${-h / 2}" width="${w}" height="${h}" rx="4" fill="${C.ue}" ${S(3)}/>${e}`; };
  I.estrella = (o) => estrella(0, 0, 44, o.color || C.estrella, S(3));
  I.mundo = (o) => `<circle r="42" fill="${o.mar || '#8CC0DE'}" ${S()}/><path d="M-28,-26 Q-14,-34 -6,-24 Q2,-14 -10,-8 Q-20,-2 -14,10 Q-8,22 -22,26 Q-38,12 -38,-6Z M10,-38 Q26,-34 34,-18 Q28,-10 18,-14 Q8,-18 10,-38Z M12,6 Q24,2 34,10 Q32,28 16,36 Q6,24 12,6Z" fill="${o.tierra || C.verde}" ${S(2.5)}/>`;
  I.rayo = (o) => `<path d="M8,-46 L-26,6 L-2,6 L-10,46 L26,-8 L2,-8Z" fill="${o.color || C.estrella}" ${S()}/>`;
  I.escudo = (o) => `<path d="M0,-44 L36,-30 L36,2 Q36,32 0,46 Q-36,32 -36,2 L-36,-30Z" fill="${o.color || '#8A9A7B'}" ${S()}/>` + estrella(0, 0, 18, '#fff');
  I.mesa = (o) => `<ellipse cx="0" cy="0" rx="${o.rx || 46}" ry="${o.ry || 20}" fill="${o.color || '#D9B98C'}" ${S()}/>`;

  // ───────── Temas (servicios, derechos…) ─────────
  I.sanidad = (o) => `<rect x="-40" y="-40" width="80" height="80" rx="18" fill="#fff" ${S()}/><path d="M-10,-28 L10,-28 L10,-10 L28,-10 L28,10 L10,10 L10,28 L-10,28 L-10,10 L-28,10 L-28,-10 L-10,-10Z" fill="${o.color || '#5FA8D3'}" ${S(3)}/>`;
  I.corazon = (o) => `<path d="M0,40 C-46,8 -48,-22 -28,-36 C-14,-46 -2,-36 0,-26 C2,-36 14,-46 28,-36 C48,-22 46,8 0,40Z" fill="${o.color || '#E8798A'}" ${S()}/><circle cx="-24" cy="-22" r="6" fill="#fff" opacity=".5"/>`;
  I.hoja = (o) => `<path d="M-36,38 Q-44,-30 38,-40 Q42,30 -36,38Z" fill="${o.color || C.verde}" ${S()}/><path d="M-36,38 Q-4,-2 26,-28" fill="none" ${S(3)}/>`;
  I.maletin = (o) => `<rect x="-14" y="-34" width="28" height="16" rx="5" fill="none" ${S(5)}/><rect x="-44" y="-22" width="88" height="62" rx="9" fill="${o.color || '#9C6B4E'}" ${S()}/><path d="M-44,2 L44,2" ${S(3)}/><rect x="-8" y="-4" width="16" height="12" rx="3" fill="${C.estrella}" ${S(2.5)}/>`;
  I.bolsa = (o) => `<path d="M-14,-30 L-22,-44 L22,-44 L14,-30Z" fill="${o.color || '#D9C5A0'}" ${S()}/><path d="M-14,-30 Q-46,-4 -40,24 Q-34,46 0,46 Q34,46 40,24 Q46,-4 14,-30Z" fill="${o.color || '#D9C5A0'}" ${S()}/>` + txt('€', 0, 12, 40, K, 900) + `<path d="M-16,-30 L16,-30" ${S(5)}/>`;
  I.euro = (o) => `<circle r="42" fill="${o.color || C.estrella}" ${S()}/><circle r="33" fill="none" ${S(3, M.oscurece(o.color || C.estrella, 0.18))}/>` + txt('€', -1, 3, 46, M.oscurece(o.color || C.estrella, 0.55), 900);
  I.monedas = () => [[-18, 20], [16, 24], [0, -6]].map(([x, y]) => `<g transform="translate(${x} ${y}) scale(.55)"><circle r="42" fill="${C.estrella}" ${S(6)}/>${txt('€', -1, 3, 46, M.oscurece(C.estrella, 0.55), 900)}</g>`).join('');
  I.tractor = (o) => `<rect x="-36" y="-6" width="56" height="26" rx="5" fill="${o.color || '#A3B16B'}" ${S()}/><path d="M-6,-6 L-6,-38 L20,-38 L24,-6Z" fill="${o.color || '#A3B16B'}" ${S()}/><path d="M0,-32 L16,-32 L18,-12 L0,-12Z" fill="#E8F3F8" ${S(2.5)}/>` +
    `<path d="M-30,-6 L-30,-20" ${S(5)}/><circle cx="16" cy="22" r="22" fill="${K}"/><circle cx="16" cy="22" r="9" fill="${C.grisClaro}"/><circle cx="-30" cy="32" r="12" fill="${K}"/><circle cx="-30" cy="32" r="5" fill="${C.grisClaro}"/>`;
  I.espiga = (o) => `<path d="M0,46 L0,-30" ${S(4, '#C9A04A')}/>` + [-24, -10, 4, 18].map((y) => `<ellipse cx="-9" cy="${y}" rx="10" ry="5" transform="rotate(-35 -9 ${y})" fill="${C.estrella}" ${S(2.5)}/><ellipse cx="9" cy="${y}" rx="10" ry="5" transform="rotate(35 9 ${y})" fill="${C.estrella}" ${S(2.5)}/>`).join('') + `<ellipse cx="0" cy="-36" rx="5" ry="10" fill="${C.estrella}" ${S(2.5)}/>`;
  I.llave = (o) => `<circle cx="-20" cy="0" r="20" fill="${o.color || C.estrella}" ${S()}/><circle cx="-24" cy="0" r="7" fill="${C.crema}" ${S(3)}/><path d="M0,-6 L44,-6 L44,6 L34,6 L34,18 L24,18 L24,6 L0,6Z" fill="${o.color || C.estrella}" ${S()}/>`;
  I.alquiler = (o) => I.casa({ color: '#E7EEF5', tejado: '#8CA9CF' }) + `<g transform="translate(18 26) scale(.62)">${I.llave({})}</g>`;
  I.pensar = (o) => `<rect x="-44" y="-40" width="88" height="62" rx="31" fill="#fff" ${S()}/><circle cx="-24" cy="32" r="8" fill="#fff" ${S(3)}/><circle cx="-36" cy="44" r="5" fill="#fff" ${S(3)}/>` +
    `<circle cx="0" cy="-14" r="13" fill="${C.estrella}" ${S(3)}/><rect x="-6" y="-2" width="12" height="9" rx="2" fill="${C.grisClaro}" ${S(2.5)}/>`;
  I.hablar = (o) => `<path d="M-44,-34 Q-44,-42 -36,-42 L36,-42 Q44,-42 44,-34 L44,10 Q44,18 36,18 L-6,18 L-24,38 L-22,18 L-36,18 Q-44,18 -44,10Z" fill="${o.color || '#fff'}" ${S()}/>` + [-20, 0, 20].map((x) => `<circle cx="${x}" cy="-12" r="5.5" fill="${K}"/>`).join('');
  I.megafono = (o) => `<path d="M-30,-12 L14,-34 L14,30 L-30,10Z" fill="${o.color || '#F2A65A'}" ${S()}/><rect x="-42" y="-14" width="14" height="26" rx="4" fill="${C.grisClaro}" ${S()}/><path d="M-26,10 L-20,34 L-10,34 L-14,14" fill="${C.grisClaro}" ${S(3)}/>` +
    `<path d="M24,-14 Q32,-2 24,10 M32,-24 Q46,-2 32,20" fill="none" ${S(3.5)}/>`;
  I.mano = (o) => `<path d="M-18,46 L-18,0 Q-30,-6 -30,-18 Q-26,-22 -18,-14 L-18,-36 Q-18,-42 -12,-42 Q-6,-42 -6,-36 L-6,-44 Q-6,-50 0,-50 Q6,-50 6,-44 L6,-38 Q6,-44 12,-44 Q18,-44 18,-38 L18,-30 Q18,-34 23,-34 Q28,-34 28,-28 L28,8 Q28,30 18,46Z" fill="${o.piel || M.PIEL[1]}" ${S()}/>`;
  I.salvavidas = () => `<circle r="40" fill="#fff" ${S()}/><circle r="18" fill="${C.crema}" ${S()}/>` + [0, 90, 180, 270].map((a) => `<path d="M${(40 * Math.cos(((a - 22) * Math.PI) / 180)).toFixed(1)},${(40 * Math.sin(((a - 22) * Math.PI) / 180)).toFixed(1)} A40,40 0 0 1 ${(40 * Math.cos(((a + 22) * Math.PI) / 180)).toFixed(1)},${(40 * Math.sin(((a + 22) * Math.PI) / 180)).toFixed(1)} L${(18 * Math.cos(((a + 22) * Math.PI) / 180)).toFixed(1)},${(18 * Math.sin(((a + 22) * Math.PI) / 180)).toFixed(1)} A18,18 0 0 0 ${(18 * Math.cos(((a - 22) * Math.PI) / 180)).toFixed(1)},${(18 * Math.sin(((a - 22) * Math.PI) / 180)).toFixed(1)}Z" fill="#E76F51" ${S(3)}/>`).join('');
  I.manos = (o) => `<path d="M-46,20 Q-30,4 -14,14 L8,26 Q14,32 6,36 L-16,32 M-46,20 L-46,44 L-10,44 L20,36 Q40,30 46,16" fill="${M.PIEL[2]}" ${S()}/>` + `<g transform="translate(4 -14) scale(.5)">${I.corazon({})}</g>`;
  I.basura = (o) => `<rect x="-30" y="-24" width="60" height="70" rx="6" fill="${o.color || '#6FB3A8'}" ${S()}/><rect x="-36" y="-34" width="72" height="12" rx="4" fill="${M.oscurece(o.color || '#6FB3A8', 0.15)}" ${S()}/><rect x="-10" y="-42" width="20" height="9" rx="3" fill="none" ${S(3)}/>` +
    `<path d="M-14,-10 L-14,34 M0,-10 L0,34 M14,-10 L14,34" ${S(3, '#fff')}/>`;
  I.senal = () => `<rect x="-3" y="-6" width="6" height="56" rx="2" fill="${C.grisOsc}" ${S(2.5)}/><path d="M0,-48 L36,12 L-36,12Z" fill="#fff" ${S(3)}/><path d="M0,-38 L28,8 L-28,8Z" fill="none" ${S(6, C.error)}/>` + txt('!', 0, -6, 26, K, 900);
  I.gota = (o) => `<path d="M0,-46 Q34,-4 34,16 Q34,44 0,44 Q-34,44 -34,16 Q-34,-4 0,-46Z" fill="${o.color || '#5FA8D3'}" ${S()}/><path d="M-16,14 Q-16,28 -2,32" fill="none" ${S(4, '#fff')}/>`;
  I.policia = () => `<path d="M-44,0 Q-44,-30 0,-34 Q44,-30 44,0Z" fill="#3E4A6B" ${S()}/><path d="M-48,0 L48,0 L42,14 L-42,14Z" fill="#2B2D42" ${S()}/>` + `<path d="M0,-28 L12,-22 L12,-10 Q12,-2 0,2 Q-12,-2 -12,-10 L-12,-22Z" fill="${C.estrella}" ${S(2.5)}/>` + `<path d="M-42,6 L42,6" stroke="#fff" stroke-width="3" stroke-dasharray="6 6"/>`;
  I.balon = (o) => `<circle r="40" fill="#fff" ${S()}/><path d="M0,-14 L13,-4 L8,12 L-8,12 L-13,-4Z" fill="${K}"/><path d="M0,-14 L0,-40 M13,-4 L37,-14 M8,12 L22,32 M-8,12 L-22,32 M-13,-4 L-37,-14" ${S(3)}/>`;
  I.mascaras = () => `<path d="M-44,-36 L4,-36 L4,0 Q4,26 -20,30 Q-44,26 -44,0Z" fill="${C.estrella}" ${S()}/><circle cx="-30" cy="-16" r="4" fill="${K}"/><circle cx="-10" cy="-16" r="4" fill="${K}"/><path d="M-30,4 Q-20,14 -10,4" fill="none" ${S(3)}/>` +
    `<path d="M-4,-20 L44,-20 L44,16 Q44,42 20,46 Q-4,42 -4,16Z" fill="#8CC0DE" ${S()}/><circle cx="10" cy="0" r="4" fill="${K}"/><circle cx="30" cy="0" r="4" fill="${K}"/><path d="M10,28 Q20,18 30,28" fill="none" ${S(3)}/>`;
  I.escoba = () => `<path d="M30,-46 L-4,14" ${S(7, C.tronco)}/><path d="M-4,14 L-4,14" ${S(3)}/><path d="M-14,4 L8,18 L-6,46 L-40,30Z" fill="${C.estrella}" ${S()}/><path d="M-30,28 L-14,14 M-22,36 L-6,20 M-14,42 L0,26" ${S(2.5)}/>`;
  I.silbato = () => `<path d="M-40,-10 L10,-10 Q34,-10 34,12 Q34,34 10,34 Q-12,34 -12,12 L-40,12Z" fill="${C.gris}" ${S()}/><circle cx="10" cy="12" r="8" fill="${K}"/><path d="M-40,-10 L-40,12" ${S(3)}/><path d="M28,-10 Q40,-34 20,-44" fill="none" ${S(3)}/>`;
  I.camion = (o) => `<rect x="-48" y="-30" width="62" height="50" rx="5" fill="${o.color || '#D9C5A0'}" ${S()}/><path d="M14,-12 L34,-12 L46,6 L46,20 L14,20Z" fill="${o.cabina || '#8CC0DE'}" ${S()}/><path d="M20,-6 L32,-6 L38,4 L20,4Z" fill="#E8F3F8" ${S(2.5)}/>` +
    [-32, 30].map((x) => `<circle cx="${x}" cy="24" r="11" fill="${K}"/><circle cx="${x}" cy="24" r="4" fill="${C.grisClaro}"/>`).join('');
  I.cono = () => `<path d="M-8,-44 L8,-44 L28,36 L-28,36Z" fill="#F2A65A" ${S()}/><path d="M-14,-14 L14,-14 L18,4 L-18,4Z" fill="#fff"/><rect x="-40" y="34" width="80" height="12" rx="4" fill="#F2A65A" ${S()}/>`;
  I.lupa = () => `<path d="M14,14 L42,42" ${S(12)}/><circle cx="-6" cy="-6" r="30" fill="#E8F3F8" ${S(5)}/>`;
  I.bombilla = () => `<path d="M-12,22 Q-12,8 -24,-4 Q-34,-16 -30,-30 Q-22,-50 0,-50 Q22,-50 30,-30 Q34,-16 24,-4 Q12,8 12,22Z" fill="${C.estrella}" ${S()}/><rect x="-13" y="22" width="26" height="18" rx="4" fill="${C.grisClaro}" ${S(3)}/><path d="M-6,46 L6,46" ${S(5)}/>`;
  I.interrogacion = (o) => `<circle r="44" fill="${o.color || C.ayto}" ${S()}/>` + txt('?', 0, 3, 64, o.colorTexto || K, 900);
  I.exclamacion = (o) => `<circle r="44" fill="${o.color || C.ayto}" ${S()}/>` + txt('!', 0, 3, 64, K, 900);
  I.pausa = (o) => `<circle r="44" fill="${o.color || C.tinta}"/><rect x="-18" y="-22" width="12" height="44" rx="4" fill="#fff"/><rect x="6" y="-22" width="12" height="44" rx="4" fill="#fff"/>`;
  I.check = () => `<circle r="40" fill="${C.ok}" stroke="#fff" stroke-width="5"/><path d="M-18,0 L-5,14 L20,-13" fill="none" stroke="#fff" stroke-width="8" stroke-linecap="round" stroke-linejoin="round"/>`;
  I.cruz = () => `<circle r="40" fill="${C.error}" stroke="#fff" stroke-width="5"/><path d="M-14,-14 L14,14 M14,-14 L-14,14" stroke="#fff" stroke-width="8" stroke-linecap="round"/>`;
  I.hucha = (o) => `<ellipse cx="0" cy="6" rx="40" ry="30" fill="${o.color || '#E8A0BF'}" ${S()}/><path d="M-22,30 L-22,44 M18,30 L18,44" ${S(8)}/><path d="M-22,30 L-22,44 M18,30 L18,44" ${S(3, o.color || '#E8A0BF')}/>` +
    `<ellipse cx="40" cy="4" rx="8" ry="10" fill="${o.color || '#E8A0BF'}" ${S(3)}/><circle cx="20" cy="-6" r="3.5" fill="${K}"/><path d="M-12,-26 L-16,-34 L-4,-28" fill="${o.color || '#E8A0BF'}" ${S(3)}/><rect x="-12" y="-22" width="22" height="5" rx="2" fill="${K}"/>`;
  I.carretera = () => `<path d="M-14,-46 L14,-46 L44,46 L-44,46Z" fill="${C.grisOsc}" ${S()}/><path d="M0,-40 L0,-26 M0,-14 L0,4 M0,16 L0,40" ${S(5, '#fff')}/>`;
  I.relojArena = (o) => { const p = M.clamp(o.p === undefined ? 0.5 : o.p); const a = 30 * (1 - p), b = 30 * p;
    return `<rect x="-34" y="-48" width="68" height="10" rx="4" fill="${C.tronco}" ${S(3)}/><rect x="-34" y="38" width="68" height="10" rx="4" fill="${C.tronco}" ${S(3)}/>` +
      `<path d="M-26,-38 L26,-38 Q26,-12 4,0 Q26,12 26,38 L-26,38 Q-26,12 -4,0 Q-26,-12 -26,-38Z" fill="#E8F3F8" ${S(3)}/>` +
      (a > 0.5 ? `<path d="M${-22 * (a / 30)},${-a} L${22 * (a / 30)},${-a} L0,-2Z" fill="${C.estrella}"/>` : '') + (b > 0.5 ? `<path d="M${-24 * (b / 30) - 2},36 L${24 * (b / 30) + 2},36 L0,${36 - b}Z" fill="${C.estrella}"/>` : ''); };
  /** Reloj; agujas en grupos .aguja-h y .aguja-m (usa M.ponHora(icono, h, min)). */
  I.reloj = (o) => { let m = ''; for (let i = 0; i < 12; i++) { const a = (i * Math.PI) / 6; m += `<path d="M${(34 * Math.sin(a)).toFixed(1)},${(-34 * Math.cos(a)).toFixed(1)} L${(40 * Math.sin(a)).toFixed(1)},${(-40 * Math.cos(a)).toFixed(1)}" ${S(i % 3 ? 2.5 : 4.5)}/>`; }
    return `<circle r="46" fill="#fff" ${S(5)}/>${m}<g class="aguja-h"><path d="M0,4 L0,-22" ${S(7)}/></g><g class="aguja-m"><path d="M0,6 L0,-34" ${S(4.5, o.color || C.error)}/></g><circle r="5" fill="${K}"/>`; };
  M.ponHora = (ic, h, min = 0) => { const ah = ((h % 12) + min / 60) * 30, am = min * 6; ic.querySelector('.aguja-h').setAttribute('transform', `rotate(${ah.toFixed(1)})`); ic.querySelector('.aguja-m').setAttribute('transform', `rotate(${am.toFixed(1)})`); };
  /** Hoja de calendario: o.mes (texto), o.dia (número), o.color. */
  I.calendario = (o) => `<rect x="-40" y="-40" width="80" height="86" rx="9" fill="#fff" ${S()}/><path d="M-40,-14 L-40,-31 Q-40,-40 -31,-40 L31,-40 Q40,-40 40,-31 L40,-14Z" fill="${o.color || C.error}" ${S()}/>` +
    `<path d="M-20,-48 L-20,-34 M20,-48 L20,-34" ${S(6)}/>` + txt(o.mes || '', 0, -27, 14, '#fff', 900) + txt(o.dia === undefined ? '' : o.dia, 0, 16, 40, K, 900);
  /** Muñeca rusa: o.color (nivel), o.texto (rótulo en la tripa, opcional). */
  I.muneca = (o) => { const c = o.color || C.ayto, oc = M.oscurece(c, 0.12);
    return `<path d="M0,-50 Q-24,-50 -26,-24 Q-27,-14 -22,-8 Q-38,10 -36,30 Q-34,50 0,50 Q34,50 36,30 Q38,10 22,-8 Q27,-14 26,-24 Q24,-50 0,-50Z" fill="${c}" ${S()}/>` +
      `<circle cx="0" cy="-24" r="15" fill="#FBEBD9" ${S(3)}/><path d="M-15,-27 Q-12,-40 0,-40 Q12,-40 15,-27 Q8,-33 0,-33 Q-8,-33 -15,-27Z" fill="${K}"/>` +
      `<circle cx="-5.5" cy="-22" r="2" fill="${K}"/><circle cx="5.5" cy="-22" r="2" fill="${K}"/><circle cx="-9" cy="-16" r="3" fill="#F28F8F" opacity=".7"/><circle cx="9" cy="-16" r="3" fill="#F28F8F" opacity=".7"/>` +
      `<path d="M-3,-15 Q0,-12 3,-15" fill="none" ${S(1.8)}/>` +
      `<ellipse cx="0" cy="22" rx="20" ry="22" fill="${M.aclara(c, 0.55)}" ${S(2.5, oc)}/>` +
      (o.texto ? txt(o.texto, 0, 22, o.tamTexto || 11, K, 900) : `<circle cx="0" cy="20" r="7" fill="${oc}"/>` + [0, 72, 144, 216, 288].map((a) => `<circle cx="${(12 * Math.sin((a * Math.PI) / 180)).toFixed(1)}" cy="${(20 - 12 * Math.cos((a * Math.PI) / 180)).toFixed(1)}" r="5" fill="#fff" ${S(1.5, oc)}/>`).join('')); };
  /** Logotipo de «partido» inventado: o.tipo = 'parque' | 'aparcamiento' | 'pista'. */
  I.logo = (o) => { const tipo = o.tipo || 'parque'; const c = C[tipo] || C.gris; const sub = { parque: 'arbol', aparcamiento: 'coche', pista: 'canasta' }[tipo];
    return `<circle r="46" fill="${c}" ${S(4)}/><circle r="38" fill="none" stroke="#fff" stroke-width="3" opacity=".7"/><g transform="scale(.58) translate(0 ${tipo === 'pista' ? -4 : 0})">${monocromo(I[sub]({ balon: false }))}</g>`; };
  // Convierte un icono a blanco con contorno (para logotipos neutros).
  function monocromo(m) { return m.replace(/fill="(?!none)[^"]*"/g, 'fill="#fff"').replace(/stroke="(?!none)[^"]*"/g, `stroke="${K}"`); }
  M.monocromo = monocromo;
  I.uniforme = (o) => I.persona({ ...o, uniforme: true });
  I.paloma = (o) => `<path d="M-40,8 Q-30,-14 -6,-12 Q4,-34 26,-40 Q20,-22 14,-10 Q30,-12 42,-22 Q40,4 18,14 Q4,22 -14,20 L-30,30 L-26,16 Q-36,16 -40,8Z" fill="${o.color || '#fff'}" ${S()}/><circle cx="-26" cy="0" r="2.5" fill="${K}"/><path d="M-40,6 L-48,8 L-40,11" fill="${C.estrella}" ${S(2)}/>` + (o.rama === false ? '' : `<path d="M-46,10 Q-56,20 -50,30" fill="none" ${S(3, C.verdeOsc)}/><ellipse cx="-54" cy="22" rx="5" ry="3" fill="${C.verde}"/>`);
  I.igual = (o) => `<circle r="44" fill="${o.color || '#fff'}" ${S()}/><rect x="-24" y="-16" width="48" height="11" rx="5" fill="${K}"/><rect x="-24" y="6" width="48" height="11" rx="5" fill="${K}"/>`;
  I.regalo = (o) => `<rect x="-38" y="-10" width="76" height="56" rx="6" fill="${o.color || '#E8A0BF'}" ${S()}/><rect x="-44" y="-26" width="88" height="18" rx="5" fill="${o.color || '#E8A0BF'}" ${S()}/><path d="M0,-26 L0,46" ${S(10, C.estrella)}/><path d="M0,-26 Q-26,-50 -24,-30 Q-22,-22 0,-26 Q22,-22 24,-30 Q26,-50 0,-26Z" fill="${C.estrella}" ${S(3)}/>`;
  I.trofeo = () => `<path d="M-26,-40 L26,-40 L22,-4 Q18,16 0,18 Q-18,16 -22,-4Z" fill="${C.estrella}" ${S()}/><path d="M-26,-32 Q-44,-30 -38,-12 Q-34,-2 -22,-4 M26,-32 Q44,-30 38,-12 Q34,-2 22,-4" fill="none" ${S(4)}/><rect x="-6" y="18" width="12" height="14" fill="${C.estrella}" ${S(3)}/><rect x="-22" y="32" width="44" height="14" rx="3" fill="${C.tronco}" ${S(3)}/>`;
  I.grupo = (o) => [[-26, 6, M.ROPA[0]], [26, 6, M.ROPA[2]], [0, -2, M.ROPA[7]]].map(([x, y, c]) => `<path d="M${x - 20},${y + 42} L${x - 20},${y + 20} Q${x - 20},${y + 6} ${x},${y + 6} Q${x + 20},${y + 6} ${x + 20},${y + 20} L${x + 20},${y + 42}Z" fill="${o.color || c}" ${S()}/><circle cx="${x}" cy="${y - 12}" r="14" fill="${M.PIEL[(x + 30) % 5]}" ${S()}/>`).join('');
  I.mayores = () => `<g transform="translate(-20 0) scale(.9)">${I.persona({ edad: 'mayor', peinado: 'calvo', ropa: M.ROPA[4] })}</g><g transform="translate(22 2) scale(.88)">${I.persona({ edad: 'mayor', peinado: 'mono', ropa: M.ROPA[1], lleva: false })}</g>`;
  I.urnaPregunta = (o) => I.urna(o);


  // ───────── Personas ─────────
  /**
   * Persona plana (pies en y=50, cabeza arriba ~y=-48). Opciones:
   *  piel, pelo, ropa, pantalon (colores) · peinado: 'corto'|'largo'|'mono'|'rizado'|'calvo'|'coleta'
   *  edad: 'adulto'|'nino'|'mayor' · silla (silla de ruedas) · uniforme · gafas · cara:false (sin cara)
   *  brazoD / brazoI: ángulo inicial (grados; -160 = mano derecha arriba) · lleva: 'papeleta'|'pancarta'|'megafono'|'libro'|'baston'
   * Mueve los brazos con M.brazo(p, 'd'|'i', grados).
   */
  I.persona = (o) => {
    const piel = o.piel || M.PIEL[0], pelo = o.pelo || M.PELO[0], ropa = o.ropa || M.ROPA[0], pant = o.pantalon || '#4A4E69';
    const ed = o.edad || 'adulto';
    const hair = ed === 'mayor' && !o.pelo ? '#C9C5BF' : pelo;
    const peinado = o.peinado || 'corto';
    let cuerpo = '';
    if (o.silla) {
      cuerpo += `<circle cx="-6" cy="30" r="20" fill="none" ${S(4, C.grisOsc)}/><circle cx="-6" cy="30" r="3" fill="${C.grisOsc}"/><circle cx="24" cy="46" r="4" fill="${C.grisOsc}"/>` +
        `<path d="M-20,-4 L-20,14 L18,14 L24,46" fill="none" ${S(4, C.grisOsc)}/>` +
        `<path d="M-12,8 L18,8 L18,16 L-12,16Z M10,10 L20,10 L22,40 L12,40Z" fill="${pant}" ${S(3)}/><ellipse cx="20" cy="42" rx="8" ry="4" fill="${K}"/>` +
        `<path d="M-17,14 L-17,-22 Q-17,-32 -5,-32 L5,-32 Q17,-32 17,-22 L17,14Z" fill="${ropa}" ${S()}/>`;
    } else {
      cuerpo += `<rect x="-12" y="14" width="10" height="34" rx="4" fill="${pant}" ${S(3)}/><rect x="2" y="14" width="10" height="34" rx="4" fill="${pant}" ${S(3)}/>` +
        `<ellipse cx="-8" cy="48" rx="8" ry="4" fill="${K}"/><ellipse cx="8" cy="48" rx="8" ry="4" fill="${K}"/>` +
        (o.falda ? `<path d="M-19,0 L19,0 L24,26 L-24,26Z" fill="${o.falda}" ${S(3)}/>` : '') +
        `<path d="M-17,20 L-17,-6 Q-17,-16 -5,-16 L5,-16 Q17,-16 17,-6 L17,20Z" fill="${ropa}" ${S()}/>`;
    }
    const dy = o.silla ? -16 : 0; // en silla, torso más alto
    if (o.uniforme) cuerpo += `<rect x="-20" y="${-17 + dy}" width="10" height="6" rx="2" fill="${C.estrella}" ${S(2)}/><rect x="10" y="${-17 + dy}" width="10" height="6" rx="2" fill="${C.estrella}" ${S(2)}/><path d="M0,${-14 + dy} L0,${18 + dy}" ${S(2)}/><circle cx="0" cy="${-4 + dy}" r="2" fill="${C.estrella}"/><circle cx="0" cy="${8 + dy}" r="2" fill="${C.estrella}"/>`;
    const hy = -32 + dy; // centro de la cabeza
    let pd = '', pt = '';
    if (peinado === 'corto') pt = `<path d="M-15,${hy - 2} Q-15,${hy - 18} 0,${hy - 18} Q15,${hy - 18} 15,${hy - 2} Q8,${hy - 10} -2,${hy - 9} Q-10,${hy - 9} -15,${hy - 2}Z" fill="${hair}" ${S(2.5)}/>`;
    if (peinado === 'largo') { pd = `<path d="M-17,${hy + 16} L-17,${hy - 2} Q-17,${hy - 19} 0,${hy - 19} Q17,${hy - 19} 17,${hy - 2} L17,${hy + 16} Q0,${hy + 20} -17,${hy + 16}Z" fill="${hair}" ${S(2.5)}/>`; pt = `<path d="M-15,${hy - 3} Q-12,${hy - 17} 0,${hy - 17} Q12,${hy - 17} 15,${hy - 3} Q6,${hy - 11} -15,${hy - 3}Z" fill="${hair}"/>`; }
    if (peinado === 'mono') { pd = `<circle cx="0" cy="${hy - 19}" r="8" fill="${hair}" ${S(2.5)}/>`; pt = `<path d="M-15,${hy - 2} Q-15,${hy - 17} 0,${hy - 17} Q15,${hy - 17} 15,${hy - 2} Q0,${hy - 11} -15,${hy - 2}Z" fill="${hair}" ${S(2.5)}/>`; }
    if (peinado === 'coleta') { pd = `<path d="M12,${hy - 8} Q28,${hy - 6} 24,${hy + 14} Q18,${hy + 4} 12,${hy}Z" fill="${hair}" ${S(2.5)}/>`; pt = `<path d="M-15,${hy - 2} Q-15,${hy - 17} 0,${hy - 17} Q15,${hy - 17} 15,${hy - 2} Q4,${hy - 11} -15,${hy - 2}Z" fill="${hair}" ${S(2.5)}/>`; }
    if (peinado === 'rizado') { pd = [-14, -7, 0, 7, 14].map((x, i) => `<circle cx="${x}" cy="${hy - 13 + Math.abs(x) * 0.35}" r="${8 - (i % 2)}" fill="${hair}" ${S(2.5)}/>`).join('') + `<circle cx="-15" cy="${hy - 2}" r="6" fill="${hair}" ${S(2.5)}/><circle cx="15" cy="${hy - 2}" r="6" fill="${hair}" ${S(2.5)}/>`; }
    if (peinado === 'calvo') pt = `<path d="M-15,${hy - 4} Q-17,${hy + 4} -13,${hy + 6} M15,${hy - 4} Q17,${hy + 4} 13,${hy + 6}" fill="none" ${S(5, hair)}/>`;
    let gorra = '';
    if (o.uniforme) gorra = `<path d="M-17,${hy - 8} Q-18,${hy - 22} 0,${hy - 23} Q18,${hy - 22} 17,${hy - 8}Z" fill="${M.oscurece(ropa, 0.25)}" ${S(2.5)}/><path d="M-19,${hy - 8} L19,${hy - 8} L14,${hy - 3} L-14,${hy - 3}Z" fill="${K}"/><circle cx="0" cy="${hy - 15}" r="3" fill="${C.estrella}"/>`;
    const cara = o.cara === false ? '' : `<circle cx="-5.5" cy="${hy + 1}" r="2.2" fill="${K}"/><circle cx="5.5" cy="${hy + 1}" r="2.2" fill="${K}"/>` +
      (o.serio ? `<path d="M-4,${hy + 9} L4,${hy + 9}" fill="none" ${S(2)}/>` : `<path d="M-5,${hy + 7} Q0,${hy + 11} 5,${hy + 7}" fill="none" ${S(2)}/>`) +
      (o.gafas ? `<circle cx="-6" cy="${hy + 1}" r="5" fill="none" ${S(2)}/><circle cx="6" cy="${hy + 1}" r="5" fill="none" ${S(2)}/><path d="M-1,${hy + 1} L1,${hy + 1}" ${S(2)}/>` : '');
    const objeto = (lado) => {
      const hx = lado === 'd' ? 16 : -16, hyM = 18 + dy;
      if (o.lleva === 'papeleta' && lado === 'd') return `<g class="objeto" data-x="${hx}" data-y="${hyM}"><g transform="translate(${hx} ${hyM - 16}) scale(.42)">${I.papeleta({})}</g></g>`;
      if (o.lleva === 'megafono' && lado === 'd') return `<g class="objeto" data-x="${hx}" data-y="${hyM}"><g transform="translate(${hx + 10} ${hyM - 4}) scale(.42)">${I.megafono({})}</g></g>`;
      if (o.lleva === 'libro' && lado === 'd') return `<g class="objeto" data-x="${hx}" data-y="${hyM}"><g transform="translate(${hx} ${hyM - 6}) scale(.36)">${I.libro({})}</g></g>`;
      if ((o.lleva === 'baston' || ed === 'mayor' && o.lleva !== false && !o.silla) && lado === 'd') return `<path d="M${hx},${hyM} L${hx + 4},${50 - dy}" ${S(4, C.tronco)}/>`;
      return '';
    };
    const brazo = (lado) => { const sx = lado === 'd' ? 14 : -14, sy = -11 + dy; const ang = (lado === 'd' ? o.brazoD : o.brazoI) || (lado === 'd' ? -8 : 8);
      return `<g class="brazo-${lado}" data-x="${sx}" data-y="${sy}" transform="rotate(${ang} ${sx} ${sy})"><rect x="${sx - 4.5}" y="${sy - 3}" width="9" height="${30}" rx="4.5" fill="${ropa}" ${S(3)}/><circle cx="${sx}" cy="${sy + 29}" r="5.5" fill="${piel}" ${S(2.5)}/>${objeto(lado)}</g>`; };
    const escala = ed === 'nino' ? 0.74 : ed === 'mayor' ? 0.96 : 1;
    return `<g transform="translate(0 ${50 - 50 * escala}) scale(${escala})">` + pd + brazo('i') + cuerpo + `<rect x="-4" y="${-20 + dy}" width="8" height="6" fill="${piel}"/>` + `<circle cx="0" cy="${hy}" r="15" fill="${piel}" ${S(3)}/>` + pt + gorra + cara + brazo('d') + '</g>';
  };
  /** Gira un brazo de una persona (lado 'd' o 'i'). Los objetos en la mano se mantienen derechos. */
  M.brazo = (p, lado, ang) => {
    const b = p.querySelector('.brazo-' + lado); if (!b) return;
    const x = b.dataset.x, y = b.dataset.y; b.setAttribute('transform', `rotate(${ang.toFixed(1)} ${x} ${y})`);
    const obj = b.querySelector('.objeto'); if (obj) obj.setAttribute('transform', `rotate(${(-ang).toFixed(1)} ${obj.dataset.x} ${obj.dataset.y})`);
  };
  /** Genera n juegos de opciones de persona variadas y deterministas. */
  M.gente = (n, semilla = 3, extra = {}) => {
    const r = M.azar(semilla); const pein = ['corto', 'largo', 'mono', 'rizado', 'coleta', 'corto', 'calvo'];
    return Array.from({ length: n }, (_, i) => ({
      piel: M.PIEL[Math.floor(r() * M.PIEL.length)], pelo: M.PELO[Math.floor(r() * 4)], ropa: M.ROPA[(i * 3 + Math.floor(r() * 3)) % M.ROPA.length],
      pantalon: ['#4A4E69', '#5C6378', '#6B5B4B', '#3E4A6B'][Math.floor(r() * 4)], peinado: pein[Math.floor(r() * pein.length)],
      edad: r() < 0.15 ? 'nino' : r() < 0.15 ? 'mayor' : 'adulto', gafas: r() < 0.2, ...extra,
    }));
  };
  M.persona = (padre, o = {}) => M.icono('persona', padre, o);

  // ───────── Componentes compuestos ─────────
  /**
   * Hemiciclo de n asientos. o: n, cx, cy, rInt, rExt, filas, rAsiento, color (por defecto gris claro).
   * Devuelve { g, asientos: [circle…] } ordenados de izquierda a derecha (como se reparten los escaños).
   */
  M.hemiciclo = (padre, o = {}) => {
    const n = o.n || 350, cx = o.cx || 0, cy = o.cy || 0, rI = o.rInt || 120, rE = o.rExt || 300;
    const filas = o.filas || Math.max(1, Math.round(Math.sqrt(n / 4.2)));
    const radios = Array.from({ length: filas }, (_, i) => (filas === 1 ? (rI + rE) / 2 : rI + ((rE - rI) * i) / (filas - 1)));
    const sumR = radios.reduce((a, b) => a + b, 0);
    let cuenta = radios.map((r) => Math.floor((n * r) / sumR)); let falta = n - cuenta.reduce((a, b) => a + b, 0);
    for (let i = filas - 1; falta > 0; i = (i - 1 + filas) % filas, falta--) cuenta[i]++;
    const pos = [];
    radios.forEach((r, i) => { const k = cuenta[i]; for (let j = 0; j < k; j++) { const a = k === 1 ? Math.PI / 2 : Math.PI - (Math.PI * j) / (k - 1); pos.push({ a, x: cx + r * Math.cos(a), y: cy - r * Math.sin(a) }); } });
    pos.sort((p, q) => q.a - p.a || Math.hypot(p.x - cx, p.y - cy) - Math.hypot(q.x - cx, q.y - cy));
    const rA = o.rAsiento || Math.min(((rE - rI) / Math.max(1, filas - 1)) * 0.42, (Math.PI * rI) / (cuenta[0] || 1) * 0.42);
    const g = M.g(padre);
    const asientos = pos.map((p) => M.el('circle', { cx: p.x.toFixed(1), cy: p.y.toFixed(1), r: rA.toFixed(2), fill: o.color || C.grisClaro }, g));
    return { g, asientos, pos };
  };
  /**
   * Calendario mensual (lunes primero). o: anio, mes (1-12), ancho (px), color, titulo.
   * Devuelve { g, dias: {d: {g, fondo, texto, x, y}}, ancho, alto }.
   */
  M.calendarioMes = (padre, o = {}) => {
    const MESES = ['enero', 'febrero', 'marzo', 'abril', 'mayo', 'junio', 'julio', 'agosto', 'septiembre', 'octubre', 'noviembre', 'diciembre'];
    const anio = o.anio, mes = o.mes; const w = o.ancho || 420; const celda = w / 7; const cab = celda * 1.25;
    const primero = (new Date(anio, mes - 1, 1).getDay() + 6) % 7; const nd = new Date(anio, mes, 0).getDate();
    const semanas = Math.ceil((primero + nd) / 7); const h = cab + celda * 0.7 + semanas * celda + 14;
    const g = M.g(padre);
    M.el('rect', { x: -w / 2 - 12, y: -h / 2, width: w + 24, height: h, rx: 22, fill: '#fff', stroke: K, 'stroke-width': 4 }, g);
    M.el('path', { d: `M${-w / 2 - 12},${-h / 2 + cab} L${-w / 2 - 12},${-h / 2 + 22} Q${-w / 2 - 12},${-h / 2} ${-w / 2 + 10},${-h / 2} L${w / 2 - 10},${-h / 2} Q${w / 2 + 12},${-h / 2} ${w / 2 + 12},${-h / 2 + 22} L${w / 2 + 12},${-h / 2 + cab}Z`, fill: o.color || C.error, stroke: K, 'stroke-width': 4 }, g);
    M.texto(g, o.titulo || `${MESES[mes - 1]} ${anio}`, { tam: celda * 0.52, peso: 900, color: '#fff', y: -h / 2 + cab / 2 });
    'LMXJVSD'.split('').forEach((l, i) => M.texto(g, l, { tam: celda * 0.36, peso: 900, color: i > 4 ? C.error : C.gris, x: -w / 2 + celda * (i + 0.5), y: -h / 2 + cab + celda * 0.38 }));
    const dias = {};
    for (let d = 1; d <= nd; d++) {
      const k = primero + d - 1; const col = k % 7, fila = Math.floor(k / 7);
      const x = -w / 2 + celda * (col + 0.5), y = -h / 2 + cab + celda * 0.7 + celda * (fila + 0.5);
      const gd = M.g(g, { transform: `translate(${x.toFixed(1)} ${y.toFixed(1)})` });
      const fondo = M.el('rect', { x: -celda * 0.44, y: -celda * 0.44, width: celda * 0.88, height: celda * 0.88, rx: celda * 0.2, fill: 'none' }, gd);
      const texto = M.texto(gd, String(d), { tam: celda * 0.42, peso: 800, color: col > 4 ? C.error : K });
      dias[d] = { g: gd, fondo, texto, x, y };
    }
    return { g, dias, ancho: w + 24, alto: h, celda };
  };

  // ───────── Mapas (requieren cargar ../motor-video/mapas/espana.js, madrid.js o europa.js) ─────────
  M.mapas = {
    _n: 0,
    /**
     * Mapa de España. o: modo 'provincias'|'ccaa'|'contorno', relleno (color o función(id)), trazo, grosor,
     * vecinos (true: Portugal, Francia, Marruecos… en tono tierra), mar (color de fondo o null), recuadro (Canarias, true).
     * Devuelve { g, provincias: {id: path}, ccaa: {id: path}, datos, ancho, alto, punto(id) → [x,y] de la etiqueta }.
     * Coordenadas internas: 1000×921 (escálalo con M.pon).
     */
    espana(padre, o = {}) {
      const D = window.MAPA_ESPANA; if (!D) { M.avisa('Falta cargar mapas/espana.js'); return null; }
      const g = M.g(padre); const modo = o.modo || 'provincias';
      // Marco: mar de fondo + recorte redondeado (para que los países vecinos no acaben en seco). marco:false lo quita.
      const marco = o.marco === undefined ? o.vecinos !== false : o.marco;
      if (marco) {
        const svg = padre.ownerSVGElement || padre; const defs = M.defs || svg.querySelector('defs') || M.el('defs', {}, svg);
        const id = 'recorte-mapa-' + (++M.mapas._n);
        M.el('rect', { width: D.ancho, height: D.alto, rx: 26 }, M.el('clipPath', { id }, defs));
        g.setAttribute('clip-path', `url(#${id})`);
        M.el('rect', { width: D.ancho, height: D.alto, rx: 26, fill: o.mar || C.mar }, g);
      } else if (o.mar) M.el('rect', { width: D.ancho, height: D.alto, rx: 20, fill: o.mar }, g);
      if (o.vecinos !== false) for (const k in D.vecinos) M.el('path', { d: D.vecinos[k], fill: o.colorVecinos || C.tierraMapa, stroke: '#fff', 'stroke-width': 1.5 }, g);
      const RC = D.recuadroCanarias;
      if (o.recuadro !== false) M.el('rect', { x: RC.x, y: RC.y, width: RC.w, height: RC.h, rx: 10, fill: o.marCanarias || o.mar || (marco ? C.mar : C.crema), stroke: C.gris, 'stroke-width': 2.5 }, g);
      const rell = (id) => (typeof o.relleno === 'function' ? o.relleno(id) : o.relleno || '#F1E9DA');
      const provincias = {}, ccaa = {};
      if (modo === 'provincias') for (const p of D.provincias) provincias[p.id] = M.el('path', { d: p.d, fill: rell(p.id), stroke: o.trazo || '#fff', 'stroke-width': o.grosor || 1.6, 'stroke-linejoin': 'round' }, g);
      if (modo === 'ccaa' || o.lineasCCAA) for (const c of D.ccaa) ccaa[c.id] = M.el('path', { d: c.d, fill: modo === 'ccaa' ? rell(c.id) : 'none', stroke: o.trazoCCAA || o.trazo || '#fff', 'stroke-width': o.grosorCCAA || o.grosor || 2.5, 'stroke-linejoin': 'round' }, g);
      if (modo === 'contorno') provincias.todo = M.el('path', { d: D.contorno, fill: rell('todo'), stroke: o.trazo || K, 'stroke-width': o.grosor || 3, 'stroke-linejoin': 'round' }, g);
      const punto = (id) => { const p = D.provincias.find((x) => x.id === id) || D.ccaa.find((x) => x.id === id); return p ? p.et : null; };
      return { g, provincias, ccaa, datos: D, ancho: D.ancho, alto: D.alto, punto };
    },
    /** Comunidad de Madrid con sus 179 municipios. Devuelve { g, municipios: [{id,nombre,path,et}], ancho, alto }. */
    madrid(padre, o = {}) {
      const D = window.MAPA_MADRID; if (!D) { M.avisa('Falta cargar mapas/madrid.js'); return null; }
      const g = M.g(padre);
      const municipios = D.municipios.map((m) => ({ ...m, path: M.el('path', { d: m.d, fill: o.relleno || C.ayto, stroke: o.trazo || '#fff', 'stroke-width': o.grosor || 1.2, 'stroke-linejoin': 'round' }, g) }));
      if (o.contorno !== false) M.el('path', { d: D.contorno, fill: 'none', stroke: K, 'stroke-width': 3, 'stroke-linejoin': 'round' }, g);
      return { g, municipios, ancho: D.ancho, alto: D.alto, capital: D.capital };
    },
    /** Europa. o: relleno (color o función(pais)), fondo (resto del mundo), mar. Devuelve { g, paises: {id: {path, ...datos}}, ancho, alto, ciudades }. */
    europa(padre, o = {}) {
      const D = window.MAPA_EUROPA; if (!D) { M.avisa('Falta cargar mapas/europa.js'); return null; }
      const g = M.g(padre);
      if (o.mar !== null) M.el('rect', { width: D.ancho, height: D.alto, rx: 20, fill: o.mar || C.mar }, g);
      M.el('path', { d: D.fondo, fill: o.fondo || C.tierraMapa, stroke: '#fff', 'stroke-width': 1 }, g);
      const paises = {};
      for (const p of D.paises) paises[p.id] = { ...p, path: M.el('path', { d: p.d, fill: typeof o.relleno === 'function' ? o.relleno(p) : (o.relleno || C.tierraMapa), stroke: o.trazo || '#fff', 'stroke-width': o.grosor || 1.2, 'stroke-linejoin': 'round' }, g) };
      return { g, paises, ancho: D.ancho, alto: D.alto, ciudades: D.ciudades };
    },
    /** Encaja un mapa (ancho×alto) en una caja {x,y,w,h}: devuelve {x, y, s} para M.pon. */
    encajar(ancho, alto, caja) { const s = Math.min(caja.w / ancho, caja.h / alto); return { x: caja.x + (caja.w - ancho * s) / 2, y: caja.y + (caja.h - alto * s) / 2, s }; },
  };
})();
